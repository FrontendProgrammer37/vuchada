import { useState, useEffect } from 'react';
import { Table, Card, Button, Typography, Tag, Space, Badge, Input, DatePicker, Select } from 'antd';
import { SearchOutlined, ArrowLeftOutlined, EyeOutlined, PrinterOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    search: '',
    status: null,
    dateRange: [
      dayjs().startOf('month'),
      dayjs().endOf('day')
    ]
  });
  
  const navigate = useNavigate();

  // Carregar vendas
  const loadSales = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      
      const params = {
        page,
        page_size: pageSize,
        search: filters.search,
        status: filters.status,
        start_date: filters.dateRange?.[0]?.format('YYYY-MM-DD'),
        end_date: filters.dateRange?.[1]?.format('YYYY-MM-DD'),
        my_sales: true // Apenas vendas do usuário logado
      };

      const response = await apiService.request('sales', { params });
      
      setSales(response.data || []);
      setPagination({
        ...pagination,
        total: response.meta?.total || 0,
        current: response.meta?.current_page || 1,
        pageSize: response.meta?.per_page || 10,
      });
    } catch (error) {
      console.error('Erro ao carregar vendas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar vendas quando os filtros mudarem
  useEffect(() => {
    loadSales(pagination.current, pagination.pageSize);
  }, [filters]);

  // Manipulador de mudança de página
  const handleTableChange = (pagination) => {
    setPagination(pagination);
    loadSales(pagination.current, pagination.pageSize);
  };

  // Formatar status
  const getStatusTag = (status) => {
    const statusMap = {
      'concluida': { color: 'success', text: 'Concluída' },
      'cancelada': { color: 'error', text: 'Cancelada' },
      'pendente': { color: 'processing', text: 'Pendente' },
      'reembolsada': { color: 'warning', text: 'Reembolsada' },
    };
    
    const statusInfo = statusMap[status] || { color: 'default', text: status };
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  // Colunas da tabela
  const columns = [
    {
      title: 'Número',
      dataIndex: 'sale_number',
      key: 'sale_number',
      render: (text) => <Text strong>#{text}</Text>,
    },
    {
      title: 'Data',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Cliente',
      dataIndex: 'customer',
      key: 'customer',
      render: (customer) => customer?.name || 'Cliente não informado',
    },
    {
      title: 'Itens',
      dataIndex: 'items',
      key: 'items',
      render: (items) => items?.length || 0,
    },
    {
      title: 'Total',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount) => (
        <Text strong>R$ {parseFloat(amount).toFixed(2)}</Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: getStatusTag,
    },
    {
      title: 'Ações',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<EyeOutlined />} 
            onClick={() => navigate(`/employee/sales/${record.id}`)}
          >
            Ver
          </Button>
          <Button 
            type="text" 
            icon={<PrinterOutlined />} 
            onClick={() => window.print()}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <Title level={4} style={{ margin: 0 }}>Minhas Vendas</Title>
        <Button 
          type="primary" 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/employee/pos')}
        >
          Nova Venda
        </Button>
      </div>

      {/* Filtros */}
      <Card style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <Input
              placeholder="Buscar por número ou cliente"
              prefix={<SearchOutlined />}
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          
          <div style={{ width: '200px' }}>
            <Select
              style={{ width: '100%' }}
              placeholder="Status"
              allowClear
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value })}
            >
              <Option value="concluida">Concluída</Option>
              <Option value="pendente">Pendente</Option>
              <Option value="cancelada">Cancelada</Option>
              <Option value="reembolsada">Reembolsada</Option>
            </Select>
          </div>
          
          <div style={{ width: '300px' }}>
            <RangePicker
              style={{ width: '100%' }}
              value={filters.dateRange}
              onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
              format="DD/MM/YYYY"
            />
          </div>
          
          <Button 
            onClick={() => setFilters({
              search: '',
              status: null,
              dateRange: [dayjs().startOf('month'), dayjs().endOf('day')]
            })}
          >
            Limpar Filtros
          </Button>
        </div>
      </Card>

      {/* Tabela de Vendas */}
      <Card>
        <Table
          columns={columns}
          dataSource={sales}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `Total: ${total} vendas`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          onChange={handleTableChange}
        />
      </Card>
    </div>
  );
};

export default Sales;
