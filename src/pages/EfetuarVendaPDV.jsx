import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Plus, Minus, ShoppingCart, X, Trash2, Loader2 } from 'lucide-react';
import apiService from '../services/api';
import ModalPagamento from '../components/ModalPagamento';

// Componente para exibir mensagens de feedback
const FeedbackMessage = ({ type, message, onClose }) => {
  if (!message) return null;
  
  const bgColor = type === 'error' ? 'bg-red-100 border-red-400 text-red-700' : 'bg-green-100 border-green-400 text-green-700';
  
  return (
    <div className={`${bgColor} border px-4 py-3 rounded relative mb-4`} role="alert">
      <span className="block sm:inline">{message}</span>
      <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={onClose}>
        <X className="h-5 w-5 cursor-pointer" />
      </span>
    </div>
  );
};

const EfetuarVendaPDV = () => {
  // Estados
  const [produtos, setProdutos] = useState([]);
  const [produtosFiltrados, setProdutosFiltrados] = useState([]);
  const [termoBusca, setTermoBusca] = useState('');
  const [carregandoProdutos, setCarregandoProdutos] = useState(true);
  const [erroProdutos, setErroProdutos] = useState(null);
  
  const [carrinho, setCarrinho] = useState([]);
  const [total, setTotal] = useState(0);
  
  // Estados de pagamento
  const [formaPagamento, setFormaPagamento] = useState('DINHEIRO');
  const [valorRecebido, setValorRecebido] = useState('');
  const [troco, setTroco] = useState(0);
  
  // Estados de feedback
  const [processandoVenda, setProcessandoVenda] = useState(false);
  const [vendaConcluida, setVendaConcluida] = useState(false);
  const [vendaInfo, setVendaInfo] = useState(null);
  const [erro, setErro] = useState(null);
  const [modalPagamentoAberto, setModalPagamentoAberto] = useState(false);
  
  // Estados de métodos de pagamento
  const [metodosPagamento, setMetodosPagamento] = useState([]);
  
  // Refs
  const searchInputRef = useRef(null);
  const modalRef = useRef(null);

  // Efeitos
  useEffect(() => {
    carregarProdutos();
    // Focar no campo de busca ao carregar a página
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    const carregarMetodosPagamento = async () => {
      try {
        const metodos = await apiService.getPaymentMethods();
        setMetodosPagamento(metodos);
        // Definir método de pagamento padrão
        if (metodos.length > 0) {
          setFormaPagamento(metodos[0].value);
        }
      } catch (error) {
        console.error('Erro ao carregar métodos de pagamento:', error);
      }
    };

    carregarMetodosPagamento();
  }, []);

  // Função para formatar valores monetários
  const formatarMoeda = useCallback((valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }, []);

  // Função para carregar produtos
  const carregarProdutos = async () => {
    try {
      setCarregandoProdutos(true);
      const data = await apiService.getProducts();
      
      const produtosComPrecosValidos = data.map(produto => ({
        ...produto,
        price: produto.sale_price === null || isNaN(Number(produto.sale_price)) 
          ? 0 
          : Number(produto.sale_price),
        stock_quantity: produto.current_stock === null || isNaN(Number(produto.current_stock))
          ? 0
          : Number(produto.current_stock)
      }));
      
      setProdutos(produtosComPrecosValidos);
      setProdutosFiltrados(produtosComPrecosValidos);
      setErroProdutos(null);
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
      setErroProdutos('Erro ao carregar produtos. Tente novamente mais tarde.');
    } finally {
      setCarregandoProdutos(false);
    }
  };

  // Função para adicionar produto ao carrinho
  const adicionarAoCarrinho = (produto) => {
    if (produto.stock_quantity <= 0) {
      setErro(`Produto "${produto.name}" sem estoque disponível.`);
      return;
    }
    
    setCarrinho(prevCarrinho => {
      const itemExistente = prevCarrinho.find(item => item.id === produto.id);
      const precoValido = isNaN(Number(produto.price)) ? 0 : Number(produto.price);
      
      if (itemExistente) {
        if (itemExistente.quantidade >= produto.stock_quantity) {
          setErro(`Estoque insuficiente para o produto "${produto.name}".`);
          return prevCarrinho;
        }
        
        return prevCarrinho.map(item => 
          item.id === produto.id 
            ? { ...item, quantidade: item.quantidade + 1 } 
            : item
        );
      } else {
        return [...prevCarrinho, {
          id: produto.id,
          nome: produto.name,
          preco: precoValido,
          quantidade: 1,
          imagem: produto.image_url,
          codigo: produto.barcode || produto.id.toString(),
          stock_quantity: produto.stock_quantity
        }];
      }
    });
    
    // Limpar mensagem de erro e focar na busca
    setErro(null);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
    setTermoBusca('');
  };

  // Função para remover produto do carrinho
  const removerDoCarrinho = (produtoId) => {
    setCarrinho(prevCarrinho => prevCarrinho.filter(item => item.id !== produtoId));
  };

  // Função para alterar quantidade de produto no carrinho
  const alterarQuantidade = (produtoId, novaQuantidade) => {
    if (novaQuantidade <= 0) {
      removerDoCarrinho(produtoId);
      return;
    }
    
    const produto = produtos.find(p => p.id === produtoId);
    if (produto && novaQuantidade > produto.stock_quantity) {
      setErro(`Estoque insuficiente para o produto "${produto.name}".`);
      return;
    }
    
    setCarrinho(prevCarrinho => 
      prevCarrinho.map(item => 
        item.id === produtoId 
          ? { ...item, quantidade: novaQuantidade } 
          : item
      )
    );
    
    // Limpar mensagem de erro
    setErro(null);
  };

  // Função para limpar carrinho
  const limparCarrinho = () => {
    setCarrinho([]);
  };

  // Função para abrir modal de pagamento
  const abrirModalPagamento = () => {
    if (carrinho.length === 0) {
      setErro('Adicione produtos ao carrinho para finalizar a venda');
      return;
    }
    setErro(null);
    setModalPagamentoAberto(true);
  };

  // Função para finalizar venda
  const finalizarVenda = async () => {
    if (carrinho.length === 0) {
      setErro('Adicione produtos ao carrinho para finalizar a venda');
      return;
    }

    // Verificar se é pagamento em dinheiro e se o valor recebido é suficiente
    if (formaPagamento === 'DINHEIRO' && (!valorRecebido || Number(valorRecebido) < total)) {
      setErro('O valor recebido deve ser maior ou igual ao total da venda');
      return;
    }
    
    setProcessandoVenda(true);
    setErro(null);

    try {
      // 1. Primeiro, limpar o carrinho anterior (se houver)
      await apiService.clearCart();

      // 2. Adicionar itens ao carrinho
      for (const item of carrinho) {
        await apiService.addToCart(item.id, item.quantidade);
      }

      // 3. Criar a venda
      const vendaData = {
        payment_method: formaPagamento,
        customer_id: null, // Pode ser obtido de um campo de seleção de cliente
        notes: `Venda realizada em ${new Date().toLocaleString()}`
      };

      const resultadoVenda = await apiService.createSale(vendaData);
      
      // 4. Atualizar estado com sucesso
      setVendaInfo(resultadoVenda);
      setVendaConcluida(true);
      setCarrinho([]);
      
      // 5. Fechar o modal após um breve atraso
      setTimeout(() => {
        setModalPagamentoAberto(false);
      }, 2000);

    } catch (error) {
      console.error('Erro ao finalizar venda:', error);
      setErro(`Erro ao processar venda: ${error.message || 'Tente novamente mais tarde'}`);
    } finally {
      setProcessandoVenda(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Ponto de Venda (PDV)</h1>
        
        {/* Mensagens de feedback */}
        {erro && <FeedbackMessage type="error" message={erro} onClose={() => setErro(null)} />}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Seção de busca e produtos */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-4">
            <div className="relative mb-6">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Buscar produtos por nome ou código de barras..."
                autoComplete="off"
              />
            </div>
            
            {/* Lista de produtos */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {carregandoProdutos ? (
                <div className="col-span-full flex justify-center py-8">
                  <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                </div>
              ) : erroProdutos ? (
                <div className="col-span-full text-center text-red-500 py-4">
                  {erroProdutos}
                </div>
              ) : produtosFiltrados.length > 0 ? (
                produtosFiltrados.map((produto) => (
                  <div 
                    key={produto.id} 
                    className="border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer flex flex-col"
                    onClick={() => adicionarAoCarrinho(produto)}
                  >
                    <div className="h-20 bg-gray-100 rounded mb-2 flex items-center justify-center">
                      {produto.image_url ? (
                        <img 
                          src={produto.image_url} 
                          alt={produto.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <ShoppingCart className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 truncate">{produto.name}</h3>
                    <p className="text-sm text-gray-500">{formatarMoeda(produto.price)}</p>
                    <div className="mt-1 text-xs text-gray-500">
                      Estoque: {produto.stock_quantity}
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center text-gray-500 py-8">
                  Nenhum produto encontrado
                </div>
              )}
            </div>
          </div>
          
          {/* Carrinho de compras */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Carrinho</h2>
              {carrinho.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm('Deseja limpar o carrinho?')) {
                      limparCarrinho();
                    }
                  }}
                  className="text-sm text-red-500 hover:text-red-700 flex items-center"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Limpar
                </button>
              )}
            </div>
            
            {carrinho.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                <p>Seu carrinho está vazio</p>
                <p className="text-sm mt-1">Busque e adicione produtos</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {carrinho.map((item) => (
                    <div key={item.id} className="flex items-center border-b pb-2">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">{item.nome}</h4>
                        <p className="text-sm text-gray-600">{formatarMoeda(item.preco)}</p>
                      </div>
                      <div className="flex items-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            alterarQuantidade(item.id, item.quantidade - 1);
                          }}
                          className="p-1 text-gray-500 hover:text-gray-700"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="mx-2 w-6 text-center">{item.quantidade}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (item.quantidade < item.stock_quantity) {
                              alterarQuantidade(item.id, item.quantidade + 1);
                            } else {
                              setErro(`Estoque máximo atingido para ${item.nome}`);
                            }
                          }}
                          disabled={item.quantidade >= item.stock_quantity}
                          className={`p-1 ${item.quantidade >= item.stock_quantity ? 'text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="ml-4 text-right w-20">
                        <p className="font-medium">{formatarMoeda(item.preco * item.quantidade)}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removerDoCarrinho(item.id);
                        }}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 border-t pt-4">
                  <div className="flex justify-between mb-2">
                    <span>Subtotal:</span>
                    <span>{formatarMoeda(total)}</span>
                  </div>
                  <button
                    onClick={abrirModalPagamento}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Finalizar Venda
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Modal de Pagamento */}
      <ModalPagamento
        isOpen={modalPagamentoAberto}
        onClose={() => setModalPagamentoAberto(false)}
        total={total}
        formaPagamento={formaPagamento}
        setFormaPagamento={setFormaPagamento}
        valorRecebido={valorRecebido}
        setValorRecebido={setValorRecebido}
        troco={troco}
        onFinalizarVenda={finalizarVenda}
        processandoVenda={processandoVenda}
        vendaConcluida={vendaConcluida}
        vendaInfo={vendaInfo}
        metodosPagamento={metodosPagamento}
      />
    </div>
  );
};

export default EfetuarVendaPDV;