import { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Typography, 
  message, 
  Upload, 
  Avatar, 
  Space, 
  Row, 
  Col,
  Descriptions,
  Divider,
  Modal,
  Tag
} from 'antd';
import { 
  UserOutlined, 
  MailOutlined, 
  PhoneOutlined, 
  LockOutlined,
  CameraOutlined,
  ArrowLeftOutlined,
  SaveOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const Profile = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const navigate = useNavigate();

  // Carregar dados do usuário
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        const response = await apiService.request('auth/me');
        setUserData(response.data);
        setAvatarUrl(response.data.avatar_url || '');
        
        // Preencher formulário com dados do usuário
        form.setFieldsValue({
          name: response.data.name,
          email: response.data.email,
          phone: response.data.phone || '',
        });
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        message.error('Não foi possível carregar os dados do perfil');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [form]);

  // Atualizar dados do perfil
  const handleUpdateProfile = async (values) => {
    try {
      setLoading(true);
      await apiService.request('auth/profile', {
        method: 'PUT',
        body: values
      });
      
      // Atualizar dados locais
      setUserData({ ...userData, ...values });
      setIsEditing(false);
      message.success('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      message.error('Erro ao atualizar perfil. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Upload de avatar
  const handleAvatarChange = async (info) => {
    if (info.file.status === 'done') {
      const newAvatarUrl = info.file.response?.url || '';
      setAvatarUrl(newAvatarUrl);
      message.success('Foto de perfil atualizada com sucesso!');
      
      // Atualizar dados locais
      setUserData({ ...userData, avatar_url: newAvatarUrl });
    }
  };

  // Verificar antes de fazer upload
  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('Você só pode fazer upload de imagens!');
    }
    
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('A imagem deve ter menos de 2MB!');
    }
    
    return isImage && isLt2M;
  };

  // Redirecionar para a página de alteração de senha
  const handleChangePassword = () => {
    if (isEditing && form.isFieldsTouched()) {
      Modal.confirm({
        title: 'Alterações não salvas',
        content: 'Você tem alterações não salvas no perfil. Deseja continuar para a alteração de senha?',
        okText: 'Sim, continuar',
        cancelText: 'Cancelar',
        onOk() {
          navigate('/employee/change-password');
        }
      });
    } else {
      navigate('/employee/change-password');
    }
  };

  return (
    <div>
      <Button 
        type="text" 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate(-1)}
        style={{ marginBottom: '16px' }}
      >
        Voltar
      </Button>
      
      <Row gutter={[24, 24]}>
        <Col xs={24} md={8}>
          <Card loading={loading}>
            <div style={{ textAlign: 'center' }}>
              <Upload
                name="avatar"
                listType="picture-card"
                className="avatar-uploader"
                showUploadList={false}
                action="/api/upload/avatar" // Ajuste para o endpoint correto
                beforeUpload={beforeUpload}
                onChange={handleAvatarChange}
                headers={{
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                }}
              >
                <div style={{ position: 'relative' }}>
                  <Avatar 
                    size={128} 
                    src={avatarUrl} 
                    icon={<UserOutlined />}
                    style={{ fontSize: '48px' }}
                  />
                  <div 
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 40,
                      background: '#1890ff',
                      borderRadius: '50%',
                      padding: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    <CameraOutlined style={{ color: 'white' }} />
                  </div>
                </div>
              </Upload>
              
              <Title level={4} style={{ marginTop: '16px' }}>
                {userData?.name || 'Usuário'}
              </Title>
              <Text type="secondary">{userData?.role === 'admin' ? 'Administrador' : 'Funcionário'}</Text>
              
              <Divider />
              
              <Button 
                type="primary" 
                onClick={() => setIsEditing(!isEditing)}
                style={{ marginRight: '8px' }}
              >
                {isEditing ? 'Cancelar' : 'Editar Perfil'}
              </Button>
              
              <Button 
                type={isEditing ? 'default' : 'primary'}
                icon={<LockOutlined />} 
                onClick={handleChangePassword}
                style={{
                  background: isEditing ? 'transparent' : '#f0ad4e',
                  borderColor: isEditing ? '#d9d9d9' : '#f0ad4e',
                  color: isEditing ? 'rgba(0, 0, 0, 0.85)' : '#fff'
                }}
              >
                Alterar Senha
              </Button>
            </div>
            
            <Divider>Informações da Conta</Divider>
            
            <Descriptions column={1} bordered>
              <Descriptions.Item label="Data de Cadastro">
                {dayjs(userData?.created_at).format('DD/MM/YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Último Acesso">
                {userData?.last_login ? 
                  dayjs(userData.last_login).format('DD/MM/YYYY HH:mm') : 
                  'Nunca'}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={userData?.status === 'active' ? 'success' : 'default'}>
                  {userData?.status === 'active' ? 'Ativo' : 'Inativo'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        
        <Col xs={24} md={16}>
          <Card 
            title="Informações Pessoais" 
            loading={loading}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleUpdateProfile}
              initialValues={{
                name: userData?.name,
                email: userData?.email,
                phone: userData?.phone || '',
              }}
            >
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item
                    label="Nome Completo"
                    name="name"
                    rules={[
                      { required: true, message: 'Por favor, insira seu nome' },
                      { min: 3, message: 'O nome deve ter pelo menos 3 caracteres' }
                    ]}
                  >
                    <Input 
                      prefix={<UserOutlined />} 
                      placeholder="Seu nome completo"
                      disabled={!isEditing}
                    />
                  </Form.Item>
                </Col>
                
                <Col xs={24} md={12}>
                  <Form.Item
                    label="E-mail"
                    name="email"
                    rules={[
                      { required: true, message: 'Por favor, insira seu e-mail' },
                      { type: 'email', message: 'Por favor, insira um e-mail válido' }
                    ]}
                  >
                    <Input 
                      prefix={<MailOutlined />} 
                      placeholder="seu@email.com"
                      disabled={!isEditing}
                    />
                  </Form.Item>
                </Col>
                
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Telefone"
                    name="phone"
                    rules={[
                      { pattern: /^\(?\d{2}\)\s?\d{4,5}-?\d{4}$/, message: 'Formato inválido. Use (99) 99999-9999' }
                    ]}
                  >
                    <Input 
                      prefix={<PhoneOutlined />} 
                      placeholder="(99) 99999-9999"
                      disabled={!isEditing}
                    />
                  </Form.Item>
                </Col>
              </Row>
              
              {isEditing && (
                <div style={{ textAlign: 'right', marginTop: '24px' }}>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={loading}
                    icon={<SaveOutlined />}
                  >
                    Salvar Alterações
                  </Button>
                </div>
              )}
            </Form>
          </Card>
          
          <Card 
            title="Atividades Recentes" 
            style={{ marginTop: '16px' }}
            loading={loading}
          >
            <p>Seu histórico de atividades aparecerá aqui em breve.</p>
            {/* Implementar histórico de atividades quando disponível na API */}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Profile;
