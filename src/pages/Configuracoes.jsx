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
  Download,
  User as UserIcon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import UserProfile from '../components/UserProfile';

const Configuracoes = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('perfil');
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
    { id: 'perfil', name: 'Meu Perfil', icon: <UserIcon size={18} /> },
    { id: 'empresa', name: 'Empresa', icon: <Building2 size={18} /> },
    { id: 'sistema', name: 'Sistema', icon: <Settings size={18} /> },
    { id: 'backup', name: 'Backup', icon: <Database size={18} /> },
    { id: 'seguranca', name: 'Segurança', icon: <Shield size={18} /> },
    { id: 'usuarios', name: 'Usuários', icon: <Users size={18} /> },
    { id: 'notificacoes', name: 'Notificações', icon: <Bell size={18} /> },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'perfil':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800">Meu Perfil</h2>
            <div className="max-w-2xl">
              <UserProfile user={user} />
            </div>
          </div>
        );
      case 'empresa':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-gray-800">Informações da Empresa</h2>
              {!editMode.empresa ? (
                <button
                  onClick={() => setEditMode({...editMode, empresa: true})}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Edit size={16} className="mr-2" />
                  Editar
                </button>
              ) : (
                <div className="space-x-2">
                  <button
                    onClick={() => setEditMode({...editMode, empresa: false})}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <X size={16} className="mr-2" />
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      // Lógica para salvar as alterações
                      setEditMode({...editMode, empresa: false});
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <Save size={16} className="mr-2" />
                    Salvar Alterações
                  </button>
                </div>
              )}
            </div>
            
            {/* Formulário de edição da empresa */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-4">
                    <label htmlFor="nome-empresa" className="block text-sm font-medium text-gray-700">
                      Nome da Empresa
                    </label>
                    <input
                      type="text"
                      name="nome-empresa"
                      id="nome-empresa"
                      disabled={!editMode.empresa}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      defaultValue={empresa.nome}
                    />
                  </div>
                  
                  <div className="sm:col-span-4">
                    <label htmlFor="email-empresa" className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email-empresa"
                      id="email-empresa"
                      disabled={!editMode.empresa}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      defaultValue={empresa.email}
                    />
                  </div>
                  
                  {/* Outros campos do formulário... */}
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'sistema':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-gray-800">Configurações do Sistema</h2>
              {!editMode.sistema ? (
                <button
                  onClick={() => setEditMode({...editMode, sistema: true})}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Edit size={16} className="mr-2" />
                  Editar
                </button>
              ) : (
                <div className="space-x-2">
                  <button
                    onClick={() => setEditMode({...editMode, sistema: false})}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <X size={16} className="mr-2" />
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      // Lógica para salvar as alterações
                      setEditMode({...editMode, sistema: false});
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <Save size={16} className="mr-2" />
                    Salvar Alterações
                  </button>
                </div>
              )}
            </div>
            
            {/* Formulário de edição do sistema */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-4">
                    <label htmlFor="moeda" className="block text-sm font-medium text-gray-700">
                      Moeda
                    </label>
                    <select
                      id="moeda"
                      name="moeda"
                      disabled={!editMode.sistema}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="MT">Metical (MT)</option>
                      <option value="USD">Dólar (USD)</option>
                      <option value="EUR">Euro (EUR)</option>
                    </select>
                  </div>
                  
                  <div className="sm:col-span-4">
                    <label htmlFor="idioma" className="block text-sm font-medium text-gray-700">
                      Idioma
                    </label>
                    <select
                      id="idioma"
                      name="idioma"
                      disabled={!editMode.sistema}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="pt-MZ">Português (Moçambique)</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  
                  {/* Outros campos do formulário... */}
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'backup':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800">Configurações de Backup</h2>
            
            {/* Conteúdo da aba de backup */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-4">
                    <label htmlFor="ultimo-backup" className="block text-sm font-medium text-gray-700">
                      Último Backup
                    </label>
                    <p id="ultimo-backup" className="mt-1 text-sm text-gray-500">{backup.ultimoBackup}</p>
                  </div>
                  
                  <div className="sm:col-span-4">
                    <label htmlFor="proximo-backup" className="block text-sm font-medium text-gray-700">
                      Próximo Backup
                    </label>
                    <p id="proximo-backup" className="mt-1 text-sm text-gray-500">{backup.proximoBackup}</p>
                  </div>
                  
                  {/* Outros campos do formulário... */}
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'seguranca':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800">Configurações de Segurança</h2>
            
            {/* Conteúdo da aba de segurança */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-4">
                    <label htmlFor="senha" className="block text-sm font-medium text-gray-700">
                      Senha
                    </label>
                    <input
                      type="password"
                      id="senha"
                      name="senha"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  
                  {/* Outros campos do formulário... */}
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'usuarios':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800">Usuários</h2>
            
            {/* Conteúdo da aba de usuários */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-4">
                    <label htmlFor="nome-usuario" className="block text-sm font-medium text-gray-700">
                      Nome do Usuário
                    </label>
                    <input
                      type="text"
                      id="nome-usuario"
                      name="nome-usuario"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  
                  {/* Outros campos do formulário... */}
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'notificacoes':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800">Notificações</h2>
            
            {/* Conteúdo da aba de notificações */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-4">
                    <label htmlFor="notificacoes-email" className="block text-sm font-medium text-gray-700">
                      Notificações por Email
                    </label>
                    <input
                      type="email"
                      id="notificacoes-email"
                      name="notificacoes-email"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  
                  {/* Outros campos do formulário... */}
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900">Selecione uma opção</h3>
            <p className="mt-1 text-sm text-gray-500">Escolha uma categoria no menu ao lado para começar.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Configurações</h1>
        
        <div className="flex flex-col md:flex-row gap-8">
          {/* Barra lateral de navegação */}
          <nav className="md:w-64 flex-shrink-0">
            <ul className="space-y-1">
              {tabs.map((tab) => (
                <li key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent'
                    }`}
                  >
                    <span className="mr-3">{tab.icon}</span>
                    {tab.name}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          
          {/* Conteúdo principal */}
          <div className="flex-1">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Configuracoes;