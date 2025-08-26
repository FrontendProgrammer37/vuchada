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
  User as UserIcon,
  Menu,
  X as CloseIcon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import UserProfile from '../components/UserProfile';

const Configuracoes = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('perfil');
  const [editMode, setEditMode] = useState({});
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
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
    { id: 'usuarios', name: 'Usuários', icon: <Users size={18} /> },
    { id: 'notificacoes', name: 'Notificações', icon: <Bell size={18} /> },
    { id: 'seguranca', name: 'Segurança', icon: <Shield size={18} /> },
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

  // Fechar menu ao pressionar ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  // Desabilitar scroll do body quando o menu estiver aberto
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMobileMenuOpen]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cabeçalho mobile */}
      <div className="md:hidden bg-white shadow-sm fixed top-0 left-0 right-0 z-40">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">Configurações</h1>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -mr-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            aria-label="Abrir menu"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Adiciona padding no topo para compensar a barra fixa */}
      <div className="pt-16 md:pt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
          <h1 className="hidden md:block text-2xl font-bold text-gray-900 mb-6">Configurações</h1>
          
          <div className="flex flex-col md:flex-row gap-6">
            {/* Menu lateral para desktop */}
            <aside className="hidden md:block w-64 flex-shrink-0">
              <nav>
                <ul className="space-y-1">
                  {tabs.map((tab) => (
                    <li key={tab.id}>
                      <button
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
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
            </aside>

            {/* Menu lateral móvel */}
            <div 
              id="mobile-menu"
              className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ease-in-out ${
                isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
              aria-hidden={!isMobileMenuOpen}
            >
              {/* Overlay escuro com transição suave */}
              <div 
                className={`fixed inset-0 bg-black transition-opacity duration-300 ${
                  isMobileMenuOpen ? 'opacity-50' : 'opacity-0'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
                aria-hidden="true"
              />
              
              {/* Menu deslizante */}
              <div 
                className="fixed inset-y-0 left-0 w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out h-full overflow-y-auto"
                style={{
                  transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
                  paddingTop: '60px' // Altura da barra de título
                }}
                role="dialog"
                aria-modal="true"
                aria-label="Menu de navegação"
              >
                <nav>
                  <ul className="space-y-1 p-2">
                    {tabs.map((tab) => (
                      <li key={tab.id}>
                        <button
                          onClick={() => {
                            setActiveTab(tab.id);
                            setIsMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                            activeTab === tab.id
                              ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-500'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                          aria-current={activeTab === tab.id ? 'page' : undefined}
                        >
                          <span className="mr-3">{tab.icon}</span>
                          {tab.name}
                          {activeTab === tab.id && (
                            <span className="ml-auto text-blue-500">
                              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            </div>
            
            {/* Conteúdo principal */}
            <main className="flex-1 bg-white rounded-lg shadow-sm p-4 md:p-6 mt-4 md:mt-0">
              {renderTabContent()}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Configuracoes;