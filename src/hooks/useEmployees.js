import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import apiService from '../services/api';
import { debounce } from 'lodash';

export const useEmployees = (initialFilters = {}) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    size: 10,
    total: 0,
    pages: 1,
  });
  const [filters, setFilters] = useState({
    is_admin: null,
    can_sell: null,
    is_active: true,
    search: '',
    ...initialFilters,
  });

  const loadEmployees = useCallback(async (page = 1, size = 10) => {
    try {
      setLoading(true);
      const params = { 
        page, 
        size, 
        ...filters,
      };
      
      const data = await apiService.getEmployees(params);
      
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
          total: data.total || 0,
          pages: data.pages || data.total_pages || 1
        });
      }
      
      setError(null);
    } catch (err) {
      console.error('Erro ao carregar funcionários:', err);
      setError('Erro ao carregar a lista de funcionários. Tente novamente mais tarde.');
      setEmployees([]);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Debounced search
  const debouncedLoadEmployees = useCallback(
    debounce((page, size) => loadEmployees(page, size), 500),
    [loadEmployees]
  );

  // Handle filter changes
  const updateFilter = useCallback((newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset to first page on filter change
    }));
  }, []);

  // Handle page change
  const handlePageChange = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      loadEmployees(newPage, pagination.size);
    }
  }, [pagination.pages, pagination.size, loadEmployees]);

  // Handle employee status toggle
  const toggleEmployeeStatus = useCallback(async (employee) => {
    try {
      await apiService.updateEmployee(employee.id, { 
        is_active: !employee.is_active 
      });
      
      toast.success(
        employee.is_active 
          ? 'Funcionário desativado com sucesso!'
          : 'Funcionário ativado com sucesso!'
      );
      
      await loadEmployees(pagination.page, pagination.size);
    } catch (err) {
      console.error('Erro ao atualizar status do funcionário:', err);
      toast.error('Erro ao atualizar status do funcionário');
      throw err;
    }
  }, [loadEmployees, pagination.page, pagination.size]);

  // Handle employee deletion
  const deleteEmployee = useCallback(async (employeeId) => {
    try {
      await apiService.deleteEmployee(employeeId);
      toast.success('Funcionário removido com sucesso!');
      await loadEmployees(pagination.page, pagination.size);
    } catch (err) {
      console.error('Erro ao remover funcionário:', err);
      toast.error('Erro ao remover funcionário');
      throw err;
    }
  }, [loadEmployees, pagination.page, pagination.size]);

  // Initial load
  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  return {
    employees,
    loading,
    error,
    pagination,
    filters,
    loadEmployees,
    updateFilter,
    handlePageChange,
    toggleEmployeeStatus,
    deleteEmployee,
  };
};

export default useEmployees;
