import { useState, useEffect } from 'react';
import { 
  Building2,
  Settings,
  Database,
  Users,
  Bell,
  Shield,
  Save,
  Edit,
  X,
  Check,
  AlertTriangle,
  Info,
  Download
} from 'lucide-react';

const Configuracoes = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('empresa');
  const [editMode, setEditMode] = useState({});
  
  const [empresa, setEmpresa] = useState({
    nome: 'Neotrix Comércio Lda',
    nuit: '123456789',
    endereco: 'Av. 25 de Setembro, 1234, Maputo',
    telefone: '+258 84 123 4567',
    email: 'contato@neotrix.co.mz',
    website: 'www.neotrix.co.mz'
  });

  const [sistema, setSistema] = useState({
    moeda: 'MT',
    idioma: 'pt-MZ',
    fusoHorario: 'Africa/Maputo',
    formatoData: 'DD/MM/YYYY',
    formatoHora: '24h',
    backupAutomatico: true,
    notificacoes: true
  });

  const [backup, setBackup] = useState({
    ultimoBackup: '2024-01-15 14:30',
    proximoBackup: '2024-01-16 14:30',
    tamanhoBackup: '2.5 GB',
    localizacao: '/backups/',
    retencao: '30 dias'
  });

  useEffect(() => {
    // Simular carregamento de dados
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const handleSave = (secao) => {
    setEditMode({ ...editMode, [secao]: false });
    // Aqui seria feita a chamada para salvar no backend
    alert(`Configurações de ${secao} salvas com sucesso!`);
  };

  const handleCancel = (secao) => {
    setEditMode({ ...editMode, [secao]: false });
    // Aqui seria feito o reset dos dados
  };

  const handleEdit = (secao) => {
    setEditMode({ ...editMode, [secao]: true });
  };

  const tabs = [
    { id: 'empresa', name: 'Empresa', icon: Building2 },
    { id: 'sistema', name: 'Sistema', icon: Settings },
    { id: 'backup', name: 'Backup', icon: Database },
    { id: 'seguranca', name: 'Segurança', icon: Shield }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="px-4 lg:px-0">
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-sm lg:text-base text-gray-600">Gerencie as configurações do sistema</p>
      </div>

      {/* Tabs Navigation */}
      <div className="px-4 lg:px-0">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-blue-900 text-blue-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 lg:px-0">
        {/* Empresa */}
        {activeTab === 'empresa' && (
          <div className="bg-white rounded-lg shadow-sm lg:shadow">
            <div className="px-4 lg:px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-base lg:text-lg font-medium text-gray-900">Informações da Empresa</h3>
                {!editMode.empresa ? (
                  <button
                    onClick={() => handleEdit('empresa')}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleSave('empresa')}
                      className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-900 hover:bg-blue-800 transition-colors"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Salvar
                    </button>
                    <button
                      onClick={() => handleCancel('empresa')}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 lg:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Empresa
                  </label>
                  {editMode.empresa ? (
                    <input
                      type="text"
                      value={empresa.nome}
                      onChange={(e) => setEmpresa({...empresa, nome: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{empresa.nome}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NUIT
                  </label>
                  {editMode.empresa ? (
                    <input
                      type="text"
                      value={empresa.nuit}
                      onChange={(e) => setEmpresa({...empresa, nuit: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{empresa.nuit}</p>
                  )}
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Endereço
                  </label>
                  {editMode.empresa ? (
                    <input
                      type="text"
                      value={empresa.endereco}
                      onChange={(e) => setEmpresa({...empresa, endereco: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{empresa.endereco}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone
                  </label>
                  {editMode.empresa ? (
                    <input
                      type="tel"
                      value={empresa.telefone}
                      onChange={(e) => setEmpresa({...empresa, telefone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{empresa.telefone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  {editMode.empresa ? (
                    <input
                      type="email"
                      value={empresa.email}
                      onChange={(e) => setEmpresa({...empresa, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{empresa.email}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sistema */}
        {activeTab === 'sistema' && (
          <div className="bg-white rounded-lg shadow-sm lg:shadow">
            <div className="px-4 lg:px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-base lg:text-lg font-medium text-gray-900">Configurações do Sistema</h3>
                {!editMode.sistema ? (
                  <button
                    onClick={() => handleEdit('sistema')}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleSave('sistema')}
                      className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-900 hover:bg-blue-800 transition-colors"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Salvar
                    </button>
                    <button
                      onClick={() => handleCancel('sistema')}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 lg:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Moeda
                  </label>
                  {editMode.sistema ? (
                    <select
                      value={sistema.moeda}
                      onChange={(e) => setSistema({...sistema, moeda: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="MT">Metical (MT)</option>
                      <option value="USD">Dólar (USD)</option>
                      <option value="EUR">Euro (EUR)</option>
                    </select>
                  ) : (
                    <p className="text-sm text-gray-900">{sistema.moeda}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Idioma
                  </label>
                  {editMode.sistema ? (
                    <select
                      value={sistema.idioma}
                      onChange={(e) => setSistema({...sistema, idioma: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="pt-MZ">Português (Moçambique)</option>
                      <option value="en">English</option>
                    </select>
                  ) : (
                    <p className="text-sm text-gray-900">{sistema.idioma}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fuso Horário
                  </label>
                  {editMode.sistema ? (
                    <select
                      value={sistema.fusoHorario}
                      onChange={(e) => setSistema({...sistema, fusoHorario: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Africa/Maputo">Maputo (GMT+2)</option>
                      <option value="Africa/Lagos">Lagos (GMT+1)</option>
                    </select>
                  ) : (
                    <p className="text-sm text-gray-900">{sistema.fusoHorario}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Formato de Data
                  </label>
                  {editMode.sistema ? (
                    <select
                      value={sistema.formatoData}
                      onChange={(e) => setSistema({...sistema, formatoData: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  ) : (
                    <p className="text-sm text-gray-900">{sistema.formatoData}</p>
                  )}
                </div>

                <div className="lg:col-span-2">
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={sistema.backupAutomatico}
                        onChange={(e) => setSistema({...sistema, backupAutomatico: e.target.checked})}
                        disabled={!editMode.sistema}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">Backup Automático</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={sistema.notificacoes}
                        onChange={(e) => setSistema({...sistema, notificacoes: e.target.checked})}
                        disabled={!editMode.sistema}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">Notificações do Sistema</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Backup */}
        {activeTab === 'backup' && (
          <div className="bg-white rounded-lg shadow-sm lg:shadow">
            <div className="px-4 lg:px-6 py-4 border-b border-gray-200">
              <h3 className="text-base lg:text-lg font-medium text-gray-900">Configurações de Backup</h3>
            </div>
            
            <div className="p-4 lg:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center mb-3">
                    <Database className="h-5 w-5 text-blue-600 mr-2" />
                    <h4 className="text-sm font-medium text-blue-900">Último Backup</h4>
                  </div>
                  <p className="text-sm text-blue-700">{backup.ultimoBackup}</p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center mb-3">
                    <Check className="h-5 w-5 text-green-600 mr-2" />
                    <h4 className="text-sm font-medium text-green-900">Próximo Backup</h4>
                  </div>
                  <p className="text-sm text-green-700">{backup.proximoBackup}</p>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg">
                  <div className="flex items-center mb-3">
                    <Info className="h-5 w-5 text-yellow-600 mr-2" />
                    <h4 className="text-sm font-medium text-yellow-900">Tamanho</h4>
                  </div>
                  <p className="text-sm text-yellow-700">{backup.tamanhoBackup}</p>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center mb-3">
                    <Shield className="h-5 w-5 text-purple-600 mr-2" />
                    <h4 className="text-sm font-medium text-purple-900">Retenção</h4>
                  </div>
                  <p className="text-sm text-purple-700">{backup.retencao}</p>
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-900 hover:bg-blue-800 transition-colors">
                  <Database className="h-4 w-4 mr-2" />
                  Fazer Backup Manual
                </button>
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  <Download className="h-4 w-4 mr-2" />
                  Restaurar Backup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Segurança */}
        {activeTab === 'seguranca' && (
          <div className="bg-white rounded-lg shadow-sm lg:shadow">
            <div className="px-4 lg:px-6 py-4 border-b border-gray-200">
              <h3 className="text-base lg:text-lg font-medium text-gray-900">Configurações de Segurança</h3>
            </div>
            
            <div className="p-4 lg:p-6">
              <div className="space-y-6">
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-900">Alterar Senha</h4>
                      <p className="text-sm text-yellow-700">Recomendamos alterar sua senha regularmente</p>
                    </div>
                  </div>
                  <button className="mt-3 inline-flex items-center px-3 py-2 border border-yellow-300 rounded-md text-sm font-medium text-yellow-700 hover:bg-yellow-100 transition-colors">
                    Alterar Senha
                  </button>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center">
                    <Shield className="h-5 w-5 text-blue-600 mr-3" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-900">Autenticação de Dois Fatores</h4>
                      <p className="text-sm text-blue-700">Adicione uma camada extra de segurança</p>
                    </div>
                  </div>
                  <button className="mt-3 inline-flex items-center px-3 py-2 border border-blue-300 rounded-md text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors">
                    Configurar 2FA
                  </button>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-3" />
                    <div>
                      <h4 className="text-sm font-medium text-green-900">Sessões Ativas</h4>
                      <p className="text-sm text-green-700">Gerencie suas sessões de login</p>
                    </div>
                  </div>
                  <button className="mt-3 inline-flex items-center px-3 py-2 border border-green-300 rounded-md text-sm font-medium text-green-700 hover:bg-green-100 transition-colors">
                    Ver Sessões
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Configuracoes; 