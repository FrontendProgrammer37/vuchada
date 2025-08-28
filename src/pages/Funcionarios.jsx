import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  UserX, 
  UserCheck, 
  X, 
  Eye, 
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Filter,
  SlidersHorizontal
} from 'lucide-react';
import apiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Componente para exibir o status do funcionário
const StatusBadge = ({ isActive }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
    isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800'
  }`}>
    {isActive ? 'Ativo' : 'Inativo'}
  </span>
);

// Componente para o modal de confirmação
const ConfirmModal = ({ isOpen, onConfirm, onCancel, title, message }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

const Funcionarios = () => {
  const { user: currentUser } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados de paginação
  const [pagination, setPagination] = useState({
    page: 1,
    size: 10,
    total: 0,
    pages: 1
  });
  
  // Estados dos filtros
  const [filters, setFilters] = useState({
    is_admin: null,
    can_sell: null,
    is_active: true
  });

  // Estados do modal de confirmação
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Carregar funcionários com paginação
  const loadEmployees = async (page = 1, size = 10) => {
    try {
      setLoading(true);
      const params = { 
        page, 
        size, 
        ...filters,
        ...(searchTerm && { search: searchTerm })
      };
      
      const data = await apiService.getEmployees(params);
      
      // Atualizado para lidar com o formato de resposta da API
      if (Array.isArray(data)) {
        setEmployees(data);
        setPagination(prev => ({
          ...prev,
          page: 1,
          total: data.length,
          pages: 1
        }));
      } else {
        setEmployees(data.items || data.data || []);
        setPagination({
          page: data.page || 1,
          size: data.size || data.per_page || 10,
          total: data.total || (Array.isArray(data) ? data.length : 0),
          pages: data.pages || data.total_pages || 1
        });
      }
      
      setError(null);
    } catch (err) {
      console.error('Erro ao carregar funcionários:', err);
      setError('Erro ao carregar a lista de funcionários. Tente novamente mais tarde.');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    loadEmployees();
  }, []);

  // Função para salvar/atualizar funcionário
  const onSave = async (employeeData) => {
    try {
      setLoading(true);
      
      // Preparar os dados para envio
      const employeeToSave = {
        full_name: employeeData.full_name,
        username: employeeData.username,
        salary: parseFloat(employeeData.salary) || 0,
        is_admin: Boolean(employeeData.is_admin),
        can_sell: Boolean(employeeData.can_sell),
        can_manage_inventory: Boolean(employeeData.can_manage_inventory),
        can_manage_expenses: Boolean(employeeData.can_manage_expenses),
        is_active: employeeData.is_active !== undefined ? employeeData.is_active : true
      };

      // Se for uma atualização
      if (employeeData.id) {
        // Incluir senha apenas se fornecida e não vazia
        if (employeeData.password && employeeData.password.trim() !== '') {
          employeeToSave.password = employeeData.password;
        }
        await apiService.updateEmployee(employeeData.id, employeeToSave);
        toast.success('Funcionário atualizado com sucesso!');
      } else {
        // Para criação, a senha é obrigatória
        if (!employeeData.password || employeeData.password.trim() === '') {
          throw new Error('A senha é obrigatória para novo funcionário');
        }
        employeeToSave.password = employeeData.password;
        await apiService.createEmployee(employeeToSave);
        toast.success('Funcionário criado com sucesso!');
      }

      // Fechar o modal e recarregar a lista
      setShowModal(false);
      setEditingEmployee(null);
      await loadEmployees(pagination.page, pagination.size);
      
    } catch (error) {
      console.error('Erro ao salvar funcionário:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Erro ao salvar funcionário';
      toast.error(errorMessage);
      // Não fechar o modal em caso de erro
      return Promise.reject(error);
    } finally {
      setLoading(false);
    }
  };

  // Função para deletar funcionário
  const handleDeleteEmployee = async (id) => {
    if (window.confirm('Tem certeza que deseja desativar este funcionário?')) {
      try {
        await apiService.updateEmployee(id, { is_active: false });
        await loadEmployees();
      } catch (err) {
        setError('Erro ao desativar funcionário');
      }
    }
  };

  // Função para ativar funcionário
  const handleActivateEmployee = async (id) => {
    try {
      await apiService.updateEmployee(id, { is_active: true });
      await loadEmployees();
    } catch (err) {
      setError('Erro ao ativar funcionário');
    }
  };

  // Função para confirmar a exclusão de um funcionário
  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setIsConfirmOpen(true);
  };

  // Função para confirmar a exclusão
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    
    try {
      setLoading(true);
      await apiService.deleteEmployee(userToDelete.id);
      await loadEmployees();
    } catch (err) {
      console.error('Erro ao excluir funcionário:', err);
      setError('Erro ao excluir funcionário. Tente novamente mais tarde.');
    } finally {
      setIsConfirmOpen(false);
      setUserToDelete(null);
      setLoading(false);
    }
  };

  // Função para lidar com a mudança de filtros
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    // Resetar para a primeira página ao mudar os filtros
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Função para abrir o modal de edição/criação
  const handleOpenModal = (user = null) => {
    setEditingEmployee(user);
    setShowModal(true);
  };

  // Função para alternar o status do usuário (ativo/inativo)
  const toggleUserStatus = async (user) => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      await apiService.updateEmployee(user.id, { 
        is_active: !user.is_active 
      });
      
      // Atualiza a lista de funcionários após a mudança
      await loadEmployees(pagination.page, pagination.size);
      
    } catch (err) {
      console.error('Erro ao atualizar status do usuário:', err);
      setError('Erro ao atualizar o status do usuário. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar funcionários
  const filteredEmployees = employees.filter(employee => {
    // Verificar se o employee é válido
    if (!employee) return false;
    
    const searchTermLower = (searchTerm || '').toLowerCase();
    const fullName = employee.full_name || '';
    const username = employee.username || '';
    
    const matchesSearch = 
      fullName.toLowerCase().includes(searchTermLower) ||
      username.toLowerCase().includes(searchTermLower);
      
    const matchesFilters = 
      (filters.is_admin === null || employee.is_admin === filters.is_admin) &&
      (filters.can_sell === null || employee.can_sell === filters.can_sell) &&
      (filters.is_active === null || employee.is_active === filters.is_active);
      
    return matchesSearch && matchesFilters;
  });

  // Renderizar cards para mobile
  const renderMobileCards = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-900"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Erro! </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      );
    }

    if (filteredEmployees.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          Nenhum funcionário encontrado
        </div>
      );
    }

    return (
      <div className="mt-4 space-y-4 sm:hidden">
        {filteredEmployees.map((employee) => (
          <div key={employee.id} className="bg-white shadow overflow-hidden rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">{employee.full_name}</h3>
                <StatusBadge isActive={employee.is_active} />
              </div>
              <p className="mt-1 text-sm text-gray-500">@{employee.username}</p>
              
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Admin</p>
                  <p className="text-sm font-medium text-gray-900">
                    {employee.is_admin ? 'Sim' : 'Não'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Vendas</p>
                  <p className="text-sm font-medium text-gray-900">
                    {employee.can_sell ? 'Sim' : 'Não'}
                  </p>
                </div>
              </div>
              
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => toggleUserStatus(employee)}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {employee.is_active ? (
                    <UserX className="h-4 w-4 mr-1" />
                  ) : (
                    <UserCheck className="h-4 w-4 mr-1" />
                  )}
                  {employee.is_active ? 'Desativar' : 'Ativar'}
                </button>
                <button
                  onClick={() => handleOpenModal(employee)}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </button>
                <button
                  onClick={() => handleDeleteClick(employee)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Excluir
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Renderizar tabela para desktop
  const renderDesktopTable = () => (
    <div className="hidden sm:block mt-8 flex flex-col">
      <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                    Nome
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Usuário
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Admin
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Vendas
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                      {employee.full_name}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      @{employee.username}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <StatusBadge isActive={employee.is_active} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {employee.is_admin ? 'Sim' : 'Não'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {employee.can_sell ? 'Sim' : 'Não'}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <div className="flex space-x-2 justify-end">
                        <button
                          onClick={() => toggleUserStatus(employee)}
                          className="text-blue-600 hover:text-blue-900"
                          title={employee.is_active ? 'Desativar' : 'Ativar'}
                        >
                          {employee.is_active ? (
                            <UserX className="h-5 w-5" />
                          ) : (
                            <UserCheck className="h-5 w-5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleOpenModal(employee)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Editar"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(employee)}
                          className="text-red-600 hover:text-red-900"
                          title="Excluir"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  // Atualizar o retorno principal para incluir ambas as visualizações
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Funcionários</h1>
          <p className="mt-2 text-sm text-gray-700">
            Gerencie os funcionários do sistema
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            Novo Funcionário
          </button>
        </div>
      </div>

      {/* Filtros e busca */}
      <div className="mt-6">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="relative flex-1 max-w-lg">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full rounded-md border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-blue-500 focus:text-gray-900 focus:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
              placeholder="Buscar funcionários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </button>
          </div>
        </div>

        {/* Filtros expandíveis */}
        {isFilterOpen && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  name="is_active"
                  value={filters.is_active}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Todos</option>
                  <option value="true">Ativos</option>
                  <option value="false">Inativos</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tipo</label>
                <select
                  name="is_admin"
                  value={filters.is_admin}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Todos</option>
                  <option value="true">Administradores</option>
                  <option value="false">Funcionários</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Vendas</label>
                <select
                  name="can_sell"
                  value={filters.can_sell}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Todos</option>
                  <option value="true">Pode vender</option>
                  <option value="false">Não pode vender</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Visualização mobile */}
      {renderMobileCards()}
      
      {/* Visualização desktop */}
      {renderDesktopTable()}

      {/* Paginação */}
      {pagination.pages > 1 && (
        <div className="mt-4 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próximo
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{(pagination.page - 1) * pagination.size + 1}</span> a{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.size, pagination.total)}
                </span>{' '}
                de <span className="font-medium">{pagination.total}</span> resultados
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Anterior</span>
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Próximo</span>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsConfirmOpen(false);
          setUserToDelete(null);
        }}
        title="Confirmar exclusão"
        message={`Tem certeza que deseja excluir o funcionário ${userToDelete?.full_name || ''}? Esta ação não pode ser desfeita.`}
      />

      {/* Modal de edição/criação */}
      {showModal && (
        <UserModal
          user={editingEmployee}
          onSave={async (userData) => {
            try {
              if (editingEmployee) {
                await apiService.updateEmployee(editingEmployee.id, userData);
              } else {
                await apiService.createEmployee(userData);
              }
              await loadEmployees(pagination.page, pagination.size);
              setShowModal(false);
            } catch (err) {
              console.error('Erro ao salvar funcionário:', err);
            }
          }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

const UserModal = ({ user, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    username: user?.username || '',
    password: '',
    salary: user?.salary ? String(user.salary) : '0',
    is_admin: user?.is_admin || false,
    can_sell: user?.can_sell || false,
    can_manage_inventory: user?.can_manage_inventory || false,
    can_manage_expenses: user?.can_manage_expenses || false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Nome completo é obrigatório';
    }
    
    if (!formData.username.trim()) {
      newErrors.username = 'Nome de usuário é obrigatório';
    }
    
    if (!user && !formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'A senha deve ter pelo menos 6 caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const dataToSend = { ...formData };
    
    // Incluir o ID do usuário se estiver editando
    if (user?.id) {
      dataToSend.id = user.id;
    }
    
    // Remover senha se não foi alterada
    if (user && !dataToSend.password) {
      delete dataToSend.password;
    }
    
    // Converter salário para número
    if (dataToSend.salary) {
      dataToSend.salary = parseFloat(dataToSend.salary) || 0;
    }
    
    try {
      await onSave(dataToSend);
      // O fechamento do modal é tratado dentro do onSave
    } catch (error) {
      // O erro já é tratado dentro do onSave
      console.error('Erro ao processar o formulário:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {user ? 'Editar Funcionário' : 'Novo Funcionário'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome Completo *
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className={`w-full px-3 py-2 border ${errors.full_name ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
              required
            />
            {errors.full_name && (
              <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome de Usuário *
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className={`w-full px-3 py-2 border ${errors.username ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
              required
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">{errors.username}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {user ? 'Nova Senha' : 'Senha *'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`w-full px-3 py-2 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                required={!user}
                placeholder={user ? 'Deixe em branco para não alterar' : ''}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 hover:text-gray-800"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Salário (MT)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-700">
                MT
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Permissões
            </label>
            
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_admin}
                  onChange={(e) => setFormData({ ...formData, is_admin: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Administrador</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.can_sell}
                  onChange={(e) => setFormData({ ...formData, can_sell: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Pode realizar vendas</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.can_manage_inventory}
                  onChange={(e) => setFormData({ ...formData, can_manage_inventory: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Gerenciar estoque</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.can_manage_expenses}
                  onChange={(e) => setFormData({ ...formData, can_manage_expenses: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Gerenciar despesas</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {user ? 'Atualizar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Funcionarios;