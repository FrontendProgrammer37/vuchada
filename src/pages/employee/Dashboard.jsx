import { Card, Row, Col, Statistic, Button, Typography } from 'antd';
import { ShoppingCartOutlined, DollarOutlined, HistoryOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  
  // Dados de exemplo - substituir por chamadas à API
  const stats = {
    salesToday: 15,
    revenueToday: 1250.75,
    pendingOrders: 3,
  };

  const quickActions = [
    {
      title: 'Nova Venda',
      icon: <ShoppingCartOutlined style={{ fontSize: '24px' }} />,
      description: 'Iniciar uma nova venda',
      action: () => navigate('/employee/pos'),
      color: '#52c41a'
    },
    {
      title: 'Minhas Vendas',
      icon: <HistoryOutlined style={{ fontSize: '24px' }} />,
      description: 'Ver histórico de vendas',
      action: () => navigate('/employee/sales'),
      color: '#1890ff'
    },
    {
      title: 'Relatório Diário',
      icon: <DollarOutlined style={{ fontSize: '24px' }} />,
      description: 'Visualizar relatórios',
      action: () => alert('Relatório diário em desenvolvimento'),
      color: '#722ed1'
    },
  ];

  return (
    <div>
      <Title level={3}>Bem-vindo(a) ao Painel do Funcionário</Title>
      
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Vendas Hoje"
              value={stats.salesToday}
              valueStyle={{ color: '#52c41a' }}
              prefix={<ShoppingCartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Faturamento Hoje"
              value={stats.revenueToday}
              precision={2}
              valueStyle={{ color: '#1890ff' }}
              prefix="R$"
              suffix="BRL"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Pedidos Pendentes"
              value={stats.pendingOrders}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Title level={4} style={{ marginTop: '24px' }}>Ações Rápidas</Title>
      <Row gutter={[16, 16]}>
        {quickActions.map((action, index) => (
          <Col key={index} xs={24} sm={12} md={8}>
            <Card 
              hoverable
              onClick={action.action}
              style={{ 
                textAlign: 'center',
                cursor: 'pointer',
                borderLeft: `4px solid ${action.color}`
              }}
            >
              <div style={{ marginBottom: '12px', color: action.color }}>
                {action.icon}
              </div>
              <h3>{action.title}</h3>
              <p style={{ color: '#666' }}>{action.description}</p>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col span={24}>
          <Card title="Últimas Vendas" style={{ minHeight: '300px' }}>
            <p>Lista das últimas vendas será exibida aqui</p>
            <Button type="link" onClick={() => navigate('/employee/sales')}>
              Ver todas as vendas
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default EmployeeDashboard;
