import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { debounce } from 'lodash';
import { Search, Plus, Filter, RefreshCw, User, UserCheck, UserX, UserCog, UserPlus, ChevronLeft, ChevronRight, Trash2, Edit } from 'lucide-react';
import api from '../services/api';
import ConfirmationModal from '../components/ConfirmationModal';
import EmployeeFormModal from '../components/EmployeeFormModal';

// Status badge component
const StatusBadge = ({ active }) => (
  <span className={`px-2 py-1 text-xs font-medium rounded-full ${active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
    {active ? 'Ativo' : 'Inativo'}
  </span>
);

// Role badge component
const RoleBadge = ({ role }) => {
  const roleColors = {
    admin: 'bg-purple-100 text-purple-800',
    manager: 'bg-blue-100 text-blue-800',
    cashier: 'bg-green-100 text-green-800',
    viewer: 'bg-gray-100 text-gray-800'
  };
  
  const roleLabels = {
    admin: 'Administrador',
    manager: 'Gerente',
    cashier: 'Caixa',
    viewer: 'Visualizador'
  };
  
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${roleColors[role] || 'bg-gray-100 text-gray-800'}`}>
      {roleLabels[role] || role}
    </span>
  );
};

const Funcionarios = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  
  // Filters and pagination
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    page: 1,
    size: 10,
    sort_by: 'full_name',
    sort_order: 'asc',
    show_inactive: true  // Mostrar inativos por padrão
  });
  
  const [pagination, setPagination] = useState({
    page: 1,
    size: 10,
    total: 0,
    pages: 1
  });

  // Load employees
  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true);
      // Usar os filtros atuais, incluindo show_inactive
      const data = await api.getEmployees({
        ...filters
      });
      
      console.log('Dados retornados pela API:', data);
      
      setEmployees(Array.isArray(data) ? data : (data.items || []));
      setPagination({
        page: data.page || 1,
        size: data.size || 10,
        total: data.total || (Array.isArray(data) ? data.length : 0),
        pages: data.pages || 1
      });
    } catch (error) {
      console.error('Error loading employees:', error);
      toast.error('Erro ao carregar funcionários');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Debounced search
  const debouncedLoadEmployees = useCallback(
    debounce(() => loadEmployees(), 500),
    [loadEmployees]
  );

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    console.log('Filtros atuais:', filters);
    console.log('Novos filtros:', newFilters);
    
    setFilters(prev => {
      const updatedFilters = {
        ...prev,
        ...newFilters,
        // Apenas reseta a página se não for uma mudança de show_inactive
        ...(!('show_inactive' in newFilters) && { page: 1 })
      };
      
      console.log('Filtros após atualização:', updatedFilters);
      return updatedFilters;
    });
  };

  // Handle sort
  const handleSort = (field) => {
    handleFilterChange({
      sort_by: field,
      sort_order: filters.sort_by === field && filters.sort_order === 'asc' ? 'desc' : 'asc'
    });
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      handleFilterChange({ page: newPage });
    }
  };

  // Handle employee status toggle
  const toggleEmployeeStatus = async (employee) => {
    if (!window.confirm(`Tem certeza que deseja ${employee.is_active ? 'desativar' : 'ativar'} este funcionário?`)) {
      return;
    }

    try {
      if (employee.is_active) {
        // Usar DELETE para desativar
        await api.deleteEmployee(employee.id);
        toast.success('Funcionário desativado com sucesso!');
      } else {
        // Usar PUT para reativar
        await api.updateEmployee(employee.id, { is_active: true });
        toast.success('Funcionário ativado com sucesso!');
      }
      
      // Recarregar a lista de funcionários
      await loadEmployees();
    } catch (error) {
      console.error('Erro ao alterar status do funcionário:', error);
      toast.error(error.response?.data?.detail || 'Erro ao atualizar status do funcionário');
    }
  };

  // Handle employee deletion
  const handleDelete = async () => {
    if (!employeeToDelete) return;
    
    try {
      await api.deleteEmployee(employeeToDelete.id);
      toast.success('Funcionário removido com sucesso!');
      setShowDeleteModal(false);
      await loadEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error('Erro ao remover funcionário');
    }
  };

  // Toggle para mostrar/ocultar inativos
  const toggleShowInactive = () => {
    handleFilterChange({ show_inactive: !filters.show_inactive });
  };

  // Initial load
  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  // Render loading state
  if (loading && !employees.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="px-2 sm:px-4 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Funcionários</h1>
          <p className="mt-1 sm:mt-2 text-sm text-gray-700">
            Gerencie os funcionários do sistema e suas permissões.
          </p>
        </div>
        <div className="mt-3 sm:mt-0 sm:ml-4 sm:flex-none">
          <button
            type="button"
            onClick={() => {
              setEditingEmployee(null);
              setShowModal(true);
            }}
            className="w-full sm:w-auto flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="-ml-0.5 mr-1.5 h-4 w-4" />
            <span className="text-xs sm:text-sm">Novo Funcionário</span>
          </button>
        </div>
      </div>

      {/* Filtros e botão de adicionar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <input
            type="text"
            placeholder="Buscar funcionário..."
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 flex-grow"
            value={filters.search}
            onChange={(e) => handleFilterChange({ search: e.target.value })}
          />
          <select
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.role}
            onChange={(e) => handleFilterChange({ role: e.target.value })}
          >
            <option value="">Todas as funções</option>
            <option value="admin">Administrador</option>
            <option value="manager">Gerente</option>
            <option value="cashier">Caixa</option>
            <option value="viewer">Visualizador</option>
          </select>
          
          <button
            onClick={() => handleFilterChange({ show_inactive: !filters.show_inactive })}
            className={`px-4 py-2 rounded-lg font-medium ${
              filters.show_inactive 
                ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' 
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {filters.show_inactive ? 'Ocultar Inativos' : 'Mostrar Inativos'}
          </button>
        </div>
      </div>

      {/* Employee list */}
      <div className="mt-4 sm:mt-6">
        {/* Mobile View - Cards */}
        <div className="sm:hidden space-y-3 mt-4">
          {employees.length === 0 ? (
            <div className="text-center py-4 text-sm text-gray-500">
              Nenhum funcionário encontrado
            </div>
          ) : (
            employees.map((employee) => (
              <div 
                key={employee.id} 
                className={`bg-white shadow overflow-hidden rounded-lg border-l-4 ${employee.is_active ? 'border-green-500' : 'border-red-500'}`}
              >
                <div className="px-4 py-3 sm:px-6 flex justify-between items-start">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-500" />
                    </div>
                    <div className="ml-3">
                      <div className="flex items-center">
                        <h3 className="text-sm font-medium text-gray-900">{employee.full_name}</h3>
                        {!employee.is_active && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            Desativado
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">@{employee.username}</p>
                      {employee.email && (
                        <p className="text-xs text-gray-500 truncate">{employee.email}</p>
                      )}
                      <div className="mt-1">
                        <RoleBadge role={employee.role} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setEditingEmployee(employee);
                      setShowModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-900 p-1"
                    title="Editar"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => toggleEmployeeStatus(employee)}
                    className={employee.is_active 
                      ? "text-yellow-600 hover:text-yellow-900 p-1" 
                      : "text-green-600 hover:text-green-900 p-1"
                    }
                    title={employee.is_active ? "Desativar" : "Ativar"}
                  >
                    {employee.is_active ? (
                      <UserX className="h-4 w-4" />
                    ) : (
                      <UserCheck className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setEmployeeToDelete(employee);
                      setShowDeleteModal(true);
                    }}
                    className="text-red-600 hover:text-red-900 p-1"
                    disabled={employee.role === 'admin'}
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View - Table */}
        <div className="hidden sm:block">
          <div className="-mx-2 sm:-mx-4 overflow-x-auto">
            <div className="inline-block min-w-full py-2 align-middle">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-2 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort('full_name')}
                        >
                          <div className="flex items-center">
                            Nome
                            <span className="ml-1">
                              {filters.sort_by === 'full_name' && (filters.sort_order === 'asc' ? '↑' : '↓')}
                            </span>
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-2 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort('username')}
                        >
                          <div className="flex items-center">
                            Usuário
                            <span className="ml-1">
                              {filters.sort_by === 'username' && (filters.sort_order === 'asc' ? '↑' : '↓')}
                            </span>
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-2 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort('role')}
                        >
                          <div className="flex items-center">
                            Cargo
                            <span className="ml-1">
                              {filters.sort_by === 'role' && (filters.sort_order === 'asc' ? '↑' : '↓')}
                            </span>
                          </div>
                        </th>
                        <th scope="col" className="px-2 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="relative px-2 py-2 sm:px-4 sm:py-3">
                          <span className="sr-only">Ações</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {employees.map((employee) => (
                        <tr key={employee.id} className="hover:bg-gray-50">
                          <td className="px-2 py-3 sm:px-4 sm:py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                                </div>
                              </div>
                              <div className="ml-2 sm:ml-4">
                                <div className="text-xs sm:text-sm font-medium text-gray-900">
                                  {employee.full_name}
                                </div>
                                {employee.email && (
                                  <div className="text-xs text-gray-500">
                                    {employee.email}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-3 sm:px-4 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                            @{employee.username}
                          </td>
                          <td className="px-2 py-3 sm:px-4 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                            <RoleBadge role={employee.role} />
                          </td>
                          <td className="px-2 py-3 sm:px-4 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                            <StatusBadge active={employee.is_active} />
                          </td>
                          <td className="px-2 py-3 sm:px-4 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                            <div className="flex items-center justify-end space-x-1 sm:space-x-2">
                              <button
                                onClick={() => {
                                  setEditingEmployee(employee);
                                  setShowModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-900 p-1"
                                title="Editar"
                              >
                                <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                              </button>
                              <button
                                onClick={() => toggleEmployeeStatus(employee)}
                                className={employee.is_active 
                                  ? "text-yellow-600 hover:text-yellow-900 p-1" 
                                  : "text-green-600 hover:text-green-900 p-1"
                                }
                                title={employee.is_active ? "Desativar" : "Ativar"}
                              >
                                {employee.is_active ? (
                                  <UserX className="h-4 w-4 sm:h-5 sm:w-5" />
                                ) : (
                                  <UserCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  setEmployeeToDelete(employee);
                                  setShowDeleteModal(true);
                                }}
                                className="text-red-600 hover:text-red-900 p-1"
                                disabled={employee.role === 'admin'}
                                title="Excluir"
                              >
                                <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
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
        </div>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="relative inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="ml-3 relative inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próximo
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-700">
                Mostrando <span className="font-medium">{(pagination.page - 1) * pagination.size + 1}</span> a{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.size, pagination.total)}
                </span>{' '}
                de <span className="font-medium">{pagination.total}</span> resultados
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Anterior</span>
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>
                <div className="flex items-center px-2">
                  <span className="text-xs sm:text-sm text-gray-700">
                    Página {pagination.page} de {pagination.pages}
                  </span>
                </div>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Próximo</span>
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <EmployeeFormModal
          employee={editingEmployee}
          onClose={() => setShowModal(false)}
          onSave={async (data) => {
            try {
              if (editingEmployee) {
                await api.updateEmployee(editingEmployee.id, data);
                toast.success('Funcionário atualizado com sucesso!');
              } else {
                try {
                  // Primeiro tenta criar o funcionário
                  await api.createEmployee(data);
                  toast.success('Funcionário criado com sucesso!');
                } catch (error) {
                  // Se der erro 400, verifica se é porque o usuário já existe (mas está desativado)
                  if (error.status === 400) {
                    // Busca todos os funcionários, incluindo os desativados
                    const allEmployees = await api.getEmployees({ show_inactive: true });
                    const existingEmployee = allEmployees.find(
                      emp => emp.username.toLowerCase() === data.username.toLowerCase()
                    );
                    
                    if (existingEmployee && !existingEmployee.is_active) {
                      // Se encontrou um funcionário desativado com o mesmo username, reativa ele
                      await api.updateEmployee(existingEmployee.id, {
                        ...data,
                        is_active: true
                      });
                      toast.success('Funcionário reativado com sucesso!');
                    } else {
                      // Se não encontrou ou o usuário já está ativo, propaga o erro
                      throw error;
                    }
                  } else {
                    // Se for outro erro, propaga
                    throw error;
                  }
                }
              }
              await loadEmployees();
            } catch (error) {
              console.error('Error saving employee:', error);
              toast.error(error.response?.data?.detail || 'Erro ao salvar funcionário');
              throw error;
            }
          }}
        />
      )}

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir o funcionário ${employeeToDelete?.full_name}? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
};

export default Funcionarios;