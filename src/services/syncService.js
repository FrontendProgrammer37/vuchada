import { get, set, del, keys as idbKeys } from 'idb-keyval';
import { formatISO, parseISO, isAfter } from 'date-fns';
import api from './api';
import productService from './productService';

const SYNC_QUEUE = 'sync_queue';
const LAST_SYNC = 'last_sync';
const LOCAL_PREFIX = 'local_';

// Utilitários
const generateId = () => `${LOCAL_PREFIX}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const syncService = {
  // Estado da conexão
  isOnline: navigator.onLine,
  isSyncing: false,
  syncListeners: new Set(),

  // Inicializar listeners de rede
  init() {
    const updateOnlineStatus = () => {
      this.isOnline = navigator.onLine;
      if (this.isOnline) {
        this.trySync();
      }
      this.notifyListeners();
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
  },

  // Gerenciar listeners
  addListener(callback) {
    this.syncListeners.add(callback);
    return () => this.syncListeners.delete(callback);
  },

  notifyListeners() {
    this.syncListeners.forEach(callback => callback({
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
    }));
  },

  // Gerenciar fila de sincronização
  async addToQueue(action, payload) {
    const id = payload.id || generateId();
    const queue = (await get(SYNC_QUEUE)) || [];
    const existingIndex = queue.findIndex(item => item.id === id);
    
    const queueItem = {
      id,
      action,
      payload: { ...payload, id },
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    if (existingIndex >= 0) {
      queue[existingIndex] = queueItem;
    } else {
      queue.push(queueItem);
    }

    await set(SYNC_QUEUE, queue);
    this.trySync();
    return id;
  },

  // Sincronização
  async trySync() {
    if (!this.isOnline || this.isSyncing) return false;
    
    this.isSyncing = true;
    this.notifyListeners();

    try {
      const queue = (await get(SYNC_QUEUE)) || [];
      const pendingItems = queue.filter(item => item.status === 'pending');
      
      if (pendingItems.length === 0) {
        // Nada para sincronizar, verificar atualizações do servidor
        await this.syncFromServer();
        return true;
      }

      // Processar itens pendentes
      for (const item of pendingItems) {
        try {
          item.status = 'syncing';
          await set(SYNC_QUEUE, queue);
          
          let result;
          switch (item.action) {
            case 'createProduct':
              result = await productService.createProduct(item.payload);
              break;
            case 'updateProduct':
              result = await productService.updateProduct(item.payload.id, item.payload);
              break;
            case 'deleteProduct':
              await productService.deleteProduct(item.payload.id);
              result = { success: true };
              break;
            default:
              console.warn('Ação de sincronização desconhecida:', item.action);
              continue;
          }
          
          // Atualizar status para sincronizado
          item.status = 'synced';
          item.result = result;
          await set(SYNC_QUEUE, queue);
          
        } catch (error) {
          console.error('Erro ao sincronizar item:', item, error);
          item.status = 'error';
          item.error = error.message;
          await set(SYNC_QUEUE, queue);
          throw error; // Interrompe a sincronização em caso de erro
        }
      }
      
      // Sincronizar com o servidor após processar itens locais
      await this.syncFromServer();
      return true;
      
    } catch (error) {
      console.error('Erro durante a sincronização:', error);
      return false;
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  },

  // Sincronizar dados do servidor
  async syncFromServer() {
    try {
      const lastSync = await get(LAST_SYNC) || new Date(0).toISOString();
      const response = await api.get(`/api/v1/sync/products?last_sync=${encodeURIComponent(lastSync)}`);
      
      if (response.data) {
        // Processar produtos atualizados
        if (response.data.updated_products && response.data.updated_products.length > 0) {
          for (const product of response.data.updated_products) {
            // Verificar se já existe localmente
            const localProduct = await this.getLocalProduct(product.id);
            
            if (!localProduct || isAfter(parseISO(product.updated_at), parseISO(localProduct.updated_at))) {
              // Atualizar produto local se for mais recente
              await this.upsertLocalProduct(product);
            }
          }
        }
        
        // Processar produtos excluídos
        if (response.data.deleted_products && response.data.deleted_products.length > 0) {
          for (const productId of response.data.deleted_products) {
            await this.deleteLocalProduct(productId);
          }
        }
        
        // Atualizar último horário de sincronização
        await set(LAST_SYNC, new Date().toISOString());
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao sincronizar com o servidor:', error);
      throw error;
    }
  },
  
  // Métodos auxiliares
  async getLocalProduct(productId) {
    return get(`product_${productId}`);
  },
  
  async upsertLocalProduct(product) {
    await set(`product_${product.id}`, product);
  },
  
  async deleteLocalProduct(productId) {
    await del(`product_${productId}`);
  },
  
  // Métodos públicos para produtos
  async createProduct(productData) {
    if (this.isOnline) {
      try {
        const result = await productService.createProduct(productData);
        return result;
      } catch (error) {
        // Se falhar, adiciona à fila de sincronização
        if (error.isNetworkError) {
          return this.addToQueue('createProduct', productData);
        }
        throw error;
      }
    } else {
      // Modo offline: adiciona à fila
      return this.addToQueue('createProduct', productData);
    }
  },
  
  async updateProduct(productId, productData) {
    if (this.isOnline) {
      try {
        const result = await productService.updateProduct(productId, productData);
        return result;
      } catch (error) {
        if (error.isNetworkError) {
          return this.addToQueue('updateProduct', { id: productId, ...productData });
        }
        throw error;
      }
    } else {
      return this.addToQueue('updateProduct', { id: productId, ...productData });
    }
  },
  
  async deleteProduct(productId) {
    if (this.isOnline) {
      try {
        await productService.deleteProduct(productId);
        return { success: true };
      } catch (error) {
        if (error.isNetworkError) {
          return this.addToQueue('deleteProduct', { id: productId });
        }
        throw error;
      }
    } else {
      return this.addToQueue('deleteProduct', { id: productId });
    }
  },
  
  // Inicializar o serviço
  start() {
    this.init();
    // Tentar sincronizar a cada 30 segundos quando online
    this.syncInterval = setInterval(() => {
      if (this.isOnline) {
        this.trySync();
      }
    }, 30000);
    
    // Tentar sincronizar imediatamente
    this.trySync();
  },
  
  // Parar o serviço
  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }
};

export default syncService;
