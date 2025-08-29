import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Layout, Menu, Button, Avatar, Dropdown, Space, theme } from 'antd';
import {
  ShoppingCartOutlined,
  AppstoreOutlined,
  HistoryOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;

const EmployeeLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const handleLogout = () => {
    // Implementar lógica de logout
    localStorage.removeItem('token');
    navigate('/login');
  };

  const userMenu = (
    <Menu
      items={[
        {
          key: '1',
          icon: <UserOutlined />,
          label: 'Meu Perfil',
          onClick: () => navigate('/employee/profile'),
        },
        {
          key: '2',
          icon: <LogoutOutlined />,
          label: 'Sair',
          onClick: handleLogout,
        },
      ]}
    />
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} width={220}>
        <div className="logo" style={{
          height: '64px',
          margin: '16px',
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '18px',
          fontWeight: 'bold'
        }}>
          {collapsed ? 'PDV' : 'Ponto de Venda'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['1']}
          items={[
            {
              key: '1',
              icon: <AppstoreOutlined />,
              label: 'Produtos',
              onClick: () => navigate('/employee/dashboard')
            },
            {
              key: '2',
              icon: <ShoppingCartOutlined />,
              label: 'Nova Venda',
              onClick: () => navigate('/employee/pos')
            },
            {
              key: '3',
              icon: <HistoryOutlined />,
              label: 'Minhas Vendas',
              onClick: () => navigate('/employee/sales')
            },
          ]}
        />
      </Sider>
      <Layout>
        <Header style={{
          padding: 0,
          background: colorBgContainer,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingRight: '24px',
          boxShadow: '0 1px 4px rgba(0, 21, 41, 0.08)'
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Dropdown overlay={userMenu} placement="bottomRight">
              <Space style={{ cursor: 'pointer', padding: '0 15px' }}>
                <Avatar icon={<UserOutlined />} />
                <span style={{ marginLeft: 8 }}>Funcionário</span>
              </Space>
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: '8px',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default EmployeeLayout;
