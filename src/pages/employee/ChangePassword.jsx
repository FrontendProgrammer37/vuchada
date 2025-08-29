import { useState } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Typography, 
  message, 
  Space, 
  Row, 
  Col,
  Alert,
  Divider
} from 'antd';
import { 
  LockOutlined, 
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/api';

const { Title, Text } = Typography;

const passwordRequirements = [
  { re: /[0-9]/, label: 'Pelo menos 1 número' },
  { re: /[a-z]/, label: 'Pelo menos 1 letra minúscula' },
  { re: /[A-Z]/, label: 'Pelo menos 1 letra maiúscula' },
  { re: /[$&+,:;=?@#|'<>.^*()%!-]/, label: 'Pelo menos 1 caractere especial' },
  { re: /.{8,}/, label: 'Mínimo de 8 caracteres' },
];

const ChangePassword = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  // Validar força da senha
  const getPasswordStatus = () => {
    if (!password) return null;
    
    const strength = passwordRequirements.reduce(
      (score, requirement) => 
        requirement.re.test(password) ? score + 1 : score,
      0
    );
    
    if (strength === 0) return { status: 'error', text: 'Muito fraca' };
    if (strength <= 2) return { status: 'warning', text: 'Fraca' };
    if (strength <= 4) return { status: 'validating', text: 'Média' };
    return { status: 'success', text: 'Forte' };
  };

  // Atualizar senha
  const handleChangePassword = async (values) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('As senhas não coincidem!');
      return;
    }

    try {
      setLoading(true);
      await apiService.request('auth/change-password', {
        method: 'POST',
        body: {
          current_password: values.currentPassword,
          new_password: values.newPassword,
          new_password_confirmation: values.confirmPassword
        }
      });
      
      message.success('Senha alterada com sucesso!');
      form.resetFields();
      setPassword('');
      
      // Redirecionar após 2 segundos
      setTimeout(() => {
        navigate('/employee/profile');
      }, 2000);
      
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      message.error(error.response?.data?.message || 'Erro ao alterar senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Verificar se a senha atende a todos os requisitos
  const checkAllRequirements = () => {
    if (!password) return false;
    return passwordRequirements.every(requirement => requirement.re.test(password));
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 0' }}>
      <Button 
        type="text" 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate(-1)}
        style={{ marginBottom: '24px' }}
      >
        Voltar para o Perfil
      </Button>

      <Card>
        <Title level={3} style={{ textAlign: 'center', marginBottom: '24px' }}>
          Alterar Senha
        </Title>
        
        <Alert
          message="Dicas para uma senha segura"
          description="Sua senha deve conter letras maiúsculas, minúsculas, números e caracteres especiais. Evite usar informações pessoais ou sequências comuns."
          type="info"
          showIcon
          style={{ marginBottom: '24px' }}
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleChangePassword}
        >
          <Form.Item
            label="Senha Atual"
            name="currentPassword"
            rules={[
              { required: true, message: 'Por favor, insira sua senha atual' },
              { min: 6, message: 'A senha deve ter pelo menos 6 caracteres' }
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Sua senha atual"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Nova Senha"
            name="newPassword"
            rules={[
              { required: true, message: 'Por favor, insira a nova senha' },
              { min: 8, message: 'A senha deve ter pelo menos 8 caracteres' },
              { validator: (_, value) => 
                  checkAllRequirements() 
                    ? Promise.resolve() 
                    : Promise.reject(new Error('A senha não atende a todos os requisitos'))
              }
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Nova senha"
              size="large"
              onChange={(e) => setPassword(e.target.value)}
            />
          </Form.Item>

          {/* Indicador de força da senha */}
          {password && (
            <div style={{ marginBottom: '16px' }}>
              <Text>Força da senha: </Text>
              <Text 
                strong 
                style={{
                  color: getPasswordStatus()?.status === 'error' ? '#ff4d4f' :
                         getPasswordStatus()?.status === 'warning' ? '#faad14' :
                         getPasswordStatus()?.status === 'validating' ? '#1890ff' :
                         '#52c41a'
                }}
              >
                {getPasswordStatus()?.text}
              </Text>
              
              <div style={{ marginTop: '8px' }}>
                {passwordRequirements.map((requirement, index) => {
                  const isMet = requirement.re.test(password);
                  return (
                    <div key={index} style={{ margin: '4px 0' }}>
                      {isMet ? (
                        <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                      ) : (
                        <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: '8px' }} />
                      )}
                      <Text type={isMet ? 'success' : 'secondary'}>{requirement.label}</Text>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <Form.Item
            label="Confirmar Nova Senha"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Por favor, confirme a nova senha' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('As senhas não coincidem!'));
                },
              }),
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Confirme a nova senha"
              size="large"
            />
          </Form.Item>

          <Form.Item style={{ marginTop: '32px' }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              size="large" 
              block
              loading={loading}
              disabled={!checkAllRequirements()}
            >
              Alterar Senha
            </Button>
          </Form.Item>
        </Form>

        <Divider>Dicas de Segurança</Divider>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <div style={{ padding: '12px', background: '#f6ffed', borderRadius: '4px' }}>
              <Title level={5} style={{ color: '#52c41a' }}>O que fazer:</Title>
              <ul style={{ paddingLeft: '20px' }}>
                <li>Use uma senha longa e complexa</li>
                <li>Misture letras, números e caracteres especiais</li>
                <li>Altere sua senha regularmente</li>
                <li>Use um gerenciador de senhas</li>
              </ul>
            </div>
          </Col>
          <Col xs={24} md={12}>
            <div style={{ padding: '12px', background: '#fff1f0', borderRadius: '4px' }}>
              <Title level={5} style={{ color: '#ff4d4f' }}>O que evitar:</Title>
              <ul style={{ paddingLeft: '20px' }}>
                <li>Não use informações pessoais</li>
                <li>Evite sequências como "123456" ou "senha"</li>
                <li>Não reutilize senhas antigas</li>
                <li>Não compartilhe sua senha</li>
              </ul>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default ChangePassword;
