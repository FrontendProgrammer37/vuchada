import { useState, useEffect } from 'react';
import { Card, Button, Input, Space, Typography, Divider, List, Badge } from 'antd';
import { SearchOutlined, ShoppingCartOutlined, PlusOutlined, MinusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/api';

const { Title, Text } = Typography;

const PointOfSale = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Carregar produtos
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await apiService.request('products');
        setProducts(response.data || []);
        setFilteredProducts(response.data || []);
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Filtrar produtos
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.barcode?.toString().includes(searchTerm)
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  // Adicionar item ao carrinho
  const addToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  // Remover item do carrinho
  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  // Atualizar quantidade
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  // Calcular total
  const cartTotal = cart.reduce((total, item) => {
    return total + (item.sale_price || item.price) * item.quantity;
  }, 0);

  // Finalizar venda
  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Adicione itens ao carrinho antes de finalizar a venda');
      return;
    }

    try {
      const response = await apiService.request('cart/checkout', {
        method: 'POST',
        body: {
          payment_method: 'dinheiro',
          items: cart.map(item => ({
            product_id: item.id,
            quantity: item.quantity,
            unit_price: item.sale_price || item.price,
            subtotal: (item.sale_price || item.price) * item.quantity
          }))
        }
      });

      alert(`Venda finalizada com sucesso! Número: ${response.sale_number}`);
      setCart([]);
    } catch (error) {
      console.error('Erro ao finalizar venda:', error);
      alert('Erro ao finalizar venda. Verifique o console para mais detalhes.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <Button 
          type="primary" 
          icon={<ShoppingCartOutlined />} 
          onClick={() => navigate('/employee/sales')}
        >
          Minhas Vendas
        </Button>
        <Button onClick={() => navigate('/employee/dashboard')}>
          Voltar para o Painel
        </Button>
      </div>

      <div style={{ display: 'flex', gap: '16px' }}>
        {/* Lista de Produtos */}
        <Card 
          title="Produtos" 
          style={{ flex: 3, height: 'calc(100vh - 200px)', overflowY: 'auto' }}
        >
          <Input
            placeholder="Buscar produtos..."
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ marginBottom: '16px' }}
          />
          
          <List
            loading={loading}
            dataSource={filteredProducts}
            renderItem={product => (
              <List.Item
                actions={[
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />} 
                    onClick={() => addToCart(product)}
                  />
                ]}
              >
                <List.Item.Meta
                  title={product.name}
                  description={`Estoque: ${product.stock_quantity} | R$ ${(product.sale_price || product.price).toFixed(2)}`}
                />
                {product.barcode && <Text type="secondary">Cód: {product.barcode}</Text>}
              </List.Item>
            )}
          />
        </Card>

        {/* Carrinho */}
        <Card 
          title={
            <Space>
              <ShoppingCartOutlined />
              <span>Carrinho</span>
              <Badge count={cart.reduce((sum, item) => sum + item.quantity, 0)} />
            </Space>
          } 
          style={{ flex: 2, height: 'calc(100vh - 200px)', overflowY: 'auto' }}
          actions={[
            <Button 
              type="primary" 
              size="large" 
              block 
              onClick={handleCheckout}
              disabled={cart.length === 0}
            >
              Finalizar Venda (R$ {cartTotal.toFixed(2)})
            </Button>
          ]}
        >
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <ShoppingCartOutlined style={{ fontSize: '32px', color: '#999', marginBottom: '8px' }} />
              <p>Seu carrinho está vazio</p>
              <p>Adicione produtos para começar</p>
            </div>
          ) : (
            <List
              dataSource={cart}
              renderItem={item => (
                <List.Item
                  actions={[
                    <Button 
                      type="text" 
                      danger 
                      icon={<DeleteOutlined />} 
                      onClick={() => removeFromCart(item.id)}
                    />
                  ]}
                >
                  <List.Item.Meta
                    title={item.name}
                    description={
                      <Space>
                        <Button 
                          icon={<MinusOutlined />} 
                          size="small"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        />
                        <span>{item.quantity}x</span>
                        <Button 
                          icon={<PlusOutlined />} 
                          size="small"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        />
                        <Text strong>R$ {(item.sale_price || item.price).toFixed(2)}</Text>
                      </Space>
                    }
                  />
                  <Text strong>R$ {((item.sale_price || item.price) * item.quantity).toFixed(2)}</Text>
                </List.Item>
              )}
            />
          )}
          
          {cart.length > 0 && (
            <div style={{ marginTop: '16px', textAlign: 'right' }}>
              <Divider style={{ margin: '12px 0' }} />
              <Title level={4} style={{ margin: 0 }}>
                Total: R$ {cartTotal.toFixed(2)}
              </Title>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default PointOfSale;
