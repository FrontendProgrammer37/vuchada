import { v4 as uuidv4 } from 'uuid';
import { get, set, del } from 'idb-keyval';
import productService from './productService';

const CONFLICT_NAMESPACE = 'conflicts';

/**
 * Armazena um conflito para resolução posterior
 * @param {string} entityType - Tipo da entidade (ex: 'product')
 * @param {string} entityId - ID da entidade
 * @param {object} localData - Dados locais
 * @param {object} serverData - Dados do servidor
 * @param {string} operation - Operação que causou o conflito (create/update/delete)
 * @returns {Promise<string>} ID do conflito
 */
async function storeConflict(entityType, entityId, localData, serverData, operation) {
  const conflictId = `${entityType}:${entityId}:${Date.now()}:${uuidv4()}`;
  const conflict = {
    id: conflictId,
    entityType,
    entityId,
    localData,
    serverData,
    operation,
    timestamp: new Date().toISOString(),
    resolved: false,
  };

  const conflicts = (await get(CONFLICT_NAMESPACE)) || [];
  conflicts.push(conflict);
  await set(CONFLICT_NAMESPACE, conflicts);
  
  return conflictId;
}

/**
 * Obtém todos os conflitos não resolvidos
 * @returns {Promise<Array>} Lista de conflitos
 */
async function getUnresolvedConflicts() {
  const conflicts = (await get(CONFLICT_NAMESPACE)) || [];
  return conflicts.filter(conflict => !conflict.resolved);
}

/**
 * Resolve um conflito usando a estratégia especificada
 * @param {string} conflictId - ID do conflito
 * @param {string} strategy - Estratégia para resolução ('local'|'server'|'merge'|'custom')
 * @param {object} customData - Dados personalizados para estratégia 'custom'
 * @returns {Promise<object>} Resultado da resolução
 */
async function resolveConflict(conflictId, strategy, customData = null) {
  const conflicts = (await get(CONFLICT_NAMESPACE)) || [];
  const conflictIndex = conflicts.findIndex(c => c.id === conflictId);
  
  if (conflictIndex === -1) {
    throw new Error('Conflito não encontrado');
  }

  const conflict = conflicts[conflictIndex];
  let resolvedData = null;
  let operation = conflict.operation;

  // Aplicar estratégia de resolução
  switch (strategy) {
    case 'local':
      // Usar versão local
      resolvedData = conflict.localData;
      break;
      
    case 'server':
      // Manter versão do servidor
      resolvedData = conflict.serverData;
      break;
      
    case 'merge':
      // Mesclar versões (última modificação vence)
      const localUpdated = new Date(conflict.localData.updated_at || 0);
      const serverUpdated = new Date(conflict.serverData.updated_at || 0);
      
      if (localUpdated > serverUpdated) {
        resolvedData = { ...conflict.serverData, ...conflict.localData };
      } else {
        resolvedData = { ...conflict.localData, ...conflict.serverData };
      }
      break;
      
    case 'custom':
      // Usar dados personalizados fornecidos
      if (!customData) {
        throw new Error('Dados personalizados são necessários para esta estratégia');
      }
      resolvedData = customData;
      break;
      
    default:
      throw new Error('Estratégia de resolução inválida');
  }

  // Atualizar o conflito como resolvido
  conflicts[conflictIndex] = {
    ...conflict,
    resolved: true,
    resolvedAt: new Date().toISOString(),
    resolutionStrategy: strategy,
    resolvedData
  };
  
  await set(CONFLICT_NAMESPACE, conflicts);
  
  // Se o conflito foi resolvido com sucesso, sincronizar com o servidor
  if (resolvedData) {
    try {
      // Executar a operação original com os dados resolvidos
      switch (operation) {
        case 'create':
          await productService.createProduct(resolvedData);
          break;
          
        case 'update':
          await productService.updateProduct(conflict.entityId, resolvedData);
          break;
          
        case 'delete':
          await productService.deleteProduct(conflict.entityId);
          break;
      }
      
      // Remover o conflito após sincronização bem-sucedida
      await removeResolvedConflicts();
      
    } catch (error) {
      console.error('Erro ao sincronizar resolução do conflito:', error);
      throw error;
    }
  }
  
  return {
    success: true,
    conflictId,
    resolvedData
  };
}

/**
 * Remove conflitos já resolvidos
 * @returns {Promise<void>}
 */
async function removeResolvedConflicts() {
  const conflicts = (await get(CONFLICT_NAMESPACE)) || [];
  const unresolvedConflicts = conflicts.filter(conflict => !conflict.resolved);
  await set(CONFLICT_NAMESPACE, unresolvedConflicts);
}

/**
 * Processa automaticamente conflitos com base em regras predefinidas
 * @returns {Promise<Array>} Lista de conflitos resolvidos
 */
async function autoResolveConflicts() {
  const conflicts = await getUnresolvedConflicts();
  const resolved = [];
  
  for (const conflict of conflicts) {
    try {
      // Regra: Se a versão local for mais recente, mantê-la
      const localUpdated = new Date(conflict.localData.updated_at || 0);
      const serverUpdated = new Date(conflict.serverData.updated_at || 0);
      
      const strategy = localUpdated > serverUpdated ? 'local' : 'server';
      
      const result = await resolveConflict(conflict.id, strategy);
      resolved.push(result);
      
    } catch (error) {
      console.error(`Erro ao resolver automaticamente o conflito ${conflict.id}:`, error);
    }
  }
  
  return resolved;
}

/**
 * Obtém o histórico de conflitos resolvidos
 * @param {number} limit - Número máximo de itens a retornar
 * @returns {Promise<Array>} Lista de conflitos resolvidos
 */
async function getResolvedConflicts(limit = 50) {
  const conflicts = (await get(CONFLICT_NAMESPACE)) || [];
  return conflicts
    .filter(conflict => conflict.resolved)
    .sort((a, b) => new Date(b.resolvedAt) - new Date(a.resolvedAt))
    .slice(0, limit);
}

/**
 * Limpa todos os conflitos (apenas para testes)
 * @returns {Promise<void>}
 */
async function clearAllConflicts() {
  await del(CONFLICT_NAMESPACE);
}

export default {
  storeConflict,
  getUnresolvedConflicts,
  resolveConflict,
  autoResolveConflicts,
  getResolvedConflicts,
  clearAllConflicts,
  removeResolvedConflicts
};
