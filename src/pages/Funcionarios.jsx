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
      
      setEmployees(data.items || []);
      setPagination({
        page: data.page || 1,
        size: data.size || 10,
        total: data.total || 0,
        pages: data.pages || 1
      });
      
      setError(null);
    } catch (err) {
      setError('Erro ao carregar funcionários');
      console.error('Erro ao carregar funcionários:', err);
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    loadEmployees();
  }, []);

  // Função para salvar/atualizar funcionário
  const handleSaveEmployee = async (employeeData) => {
    try {
      setError(null);
      
      if (editingEmployee) {
        await apiService.updateEmployee(editingEmployee.id, employeeData);
      } else {
        await apiService.createEmployee(employeeData);
      }
      
      setShowModal(false);
      setEditingEmployee(null);
      await loadEmployees();
    } catch (err) {
      setError(err.message || 'Erro ao salvar funcionário');
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

  // Filtrar funcionários
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = 
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilters = 
      (filters.is_admin === null || employee.is_admin === filters.is_admin) &&
      (filters.can_sell === null || employee.can_sell === filters.can_sell) &&
      (filters.is_active === null || employee.is_active === filters.is_active);
    
    return matchesSearch && matchesFilters;
  });

  // Renderizar tabela
  const renderTable = () => {
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
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usuário
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Salário
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Admin
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vender
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredEmployees.map((employee) => (
              <tr key={employee.id} className={!employee.is_active ? 'bg-gray-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{employee.username}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'MZN'
                    }).format(employee.salary || 0)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge isActive={employee.is_admin} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge isActive={employee.can_sell} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge isActive={employee.is_active} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => {
                      setEditingEmployee(employee);
                      setShowModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Editar
                  </button>
                  {employee.is_active ? (
                    <button
                      onClick={() => handleDeleteClick(employee)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Desativar
                    </button>
                  ) : (
                    <button
                      onClick={() => handleActivateEmployee(employee.id)}
                      className="text-green-600 hover:text-green-900"
                    >
                      Ativar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Cabeçalho */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gerenciar Funcionários</h1>
        <button
          onClick={() => handleOpenModal()}
          className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Funcionário
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Buscar por nome ou usuário..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filtros
          </button>
        </div>

        {/* Filtros avançados */}
        {isFilterOpen && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="is_active"
                  value={filters.is_active}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="all">Todos</option>
                  <option value="true">Ativos</option>
                  <option value="false">Inativos</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Acesso</label>
                <select
                  name="role"
                  value={filters.role}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="all">Todos</option>
                  <option value="admin">Administradores</option>
                  <option value="seller">Vendedores</option>
                  <option value="inventory">Estoque</option>
                  <option value="finance">Financeiro</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabela */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {renderTable()}
      </div>

      {/* Modal */}
      {showModal && (
        <UserModal
          user={editingEmployee}
          onSave={handleSaveEmployee}
          onClose={() => {
            setShowModal(false);
            setEditingEmployee(null);
          }}
        />
      )}

      {/* Modal de confirmação */}
      {isConfirmOpen && (
        <ConfirmModal
          isOpen={isConfirmOpen}
          onConfirm={handleConfirmDelete}
          onCancel={() => setIsConfirmOpen(false)}
          title="Confirmar exclusão"
          message="Tem certeza que deseja excluir este funcionário?"
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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const dataToSend = { ...formData };
    
    // Remover senha se não foi alterada
    if (user && !dataToSend.password) {
      delete dataToSend.password;
    }
    
    // Converter salário para número
    if (dataToSend.salary) {
      dataToSend.salary = parseFloat(dataToSend.salary) || 0;
    }
    
    onSave(dataToSend);
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