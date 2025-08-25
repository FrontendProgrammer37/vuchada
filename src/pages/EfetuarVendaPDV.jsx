import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Minus, ShoppingCart, X, CreditCard, Banknote, Trash2, Printer } from 'lucide-react';
import apiService from '../services/api';

const EfetuarVendaPDV = () => {
  const [produtos, setProdutos] = useState([]);
  const [produtosFiltrados, setProdutosFiltrados] = useState([]);
  const [termoBusca, setTermoBusca] = useState('');
  const [carregandoProdutos, setCarregandoProdutos] = useState(true);
  const [erroProdutos, setErroProdutos] = useState(null);
  
  const [carrinho, setCarrinho] = useState([]);
  const [total, setTotal] = useState(0);
  
  // Cliente removido
  const [formaPagamento, setFormaPagamento] = useState('dinheiro');
  const [valorRecebido, setValorRecebido] = useState('');
  const [troco, setTroco] = useState(0);
  
  const [processandoVenda, setProcessandoVenda] = useState(false);
  const [vendaConcluida, setVendaConcluida] = useState(false);
  const [vendaInfo, setVendaInfo] = useState(null);
  const [erro, setErro] = useState(null);
  const [modalPagamentoAberto, setModalPagamentoAberto] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    carregarProdutos();
  }, []);

  useEffect(() => {
    // Calcular total do carrinho sempre que o carrinho mudar
    const novoTotal = carrinho.reduce((acc, item) => {
      // Garantir que preco e quantidade sejam números válidos
      const preco = isNaN(Number(item.preco)) ? 0 : Number(item.preco);
      const quantidade = isNaN(Number(item.quantidade)) ? 0 : Number(item.quantidade);
      const subtotal = preco * quantidade;
      console.log(`Item: ${item.nome}, Preço: ${preco}, Quantidade: ${quantidade}, Subtotal: ${subtotal}`);
      return acc + subtotal;
    }, 0);
    console.log('Total do carrinho:', novoTotal);
    setTotal(novoTotal);
  }, [carrinho]);

  useEffect(() => {
    // Calcular troco quando valor recebido ou total mudar
    if (formaPagamento === 'dinheiro' && valorRecebido) {
      // Garantir que valorRecebido seja um número válido
      const valorRecebidoNumerico = isNaN(Number(valorRecebido)) ? 0 : Number(valorRecebido);
      const novoTroco = valorRecebidoNumerico - total;
      console.log(`Valor recebido: ${valorRecebidoNumerico}, Total: ${total}, Troco: ${novoTroco >= 0 ? novoTroco : 0}`);
      setTroco(novoTroco >= 0 ? novoTroco : 0);
    } else {
      setTroco(0);
    }
  }, [valorRecebido, total, formaPagamento]);

  useEffect(() => {
    // Filtrar produtos com base no termo de busca
    if (termoBusca.trim() === '') {
      setProdutosFiltrados(produtos);
    } else {
      const termoLowerCase = termoBusca.toLowerCase();
      const filtrados = produtos.filter(produto => 
        produto.name.toLowerCase().includes(termoLowerCase) || 
        produto.barcode?.toLowerCase().includes(termoLowerCase) ||
        produto.id.toString().includes(termoLowerCase)
      );
      setProdutosFiltrados(filtrados);
    }
  }, [termoBusca, produtos]);
  
  // Efeito para fechar o modal quando clicar fora dele
  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setModalPagamentoAberto(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const carregarProdutos = async () => {
    try {
      setCarregandoProdutos(true);
      const data = await apiService.getProducts();
      console.log('Dados dos produtos recebidos da API:', data);
      
      // Garantir que os preços sejam números válidos
      const produtosComPrecosValidos = data.map(produto => ({
        ...produto,
        price: produto.sale_price === null || produto.sale_price === undefined || isNaN(Number(produto.sale_price)) ? 0 : Number(produto.sale_price),
        stock_quantity: produto.current_stock === null || produto.current_stock === undefined || isNaN(Number(produto.current_stock)) ? 0 : Number(produto.current_stock)
      }));
      
      setProdutos(produtosComPrecosValidos);
      setProdutosFiltrados(produtosComPrecosValidos);
      setErroProdutos(null);
    } catch (err) {
      setErroProdutos(err.message || 'Erro ao carregar produtos');
    } finally {
      setCarregandoProdutos(false);
    }
  };

  const adicionarAoCarrinho = (produto) => {
    // Verificar se o produto tem estoque disponível
    if (produto.stock_quantity <= 0) {
      setErro(`Produto "${produto.name}" sem estoque disponível.`);
      return;
    }
    
    setCarrinho(prevCarrinho => {
      // Verificar se o produto já está no carrinho
      const itemExistente = prevCarrinho.find(item => item.id === produto.id);
      
      // Garantir que o preço seja um número válido
      const precoValido = isNaN(Number(produto.price)) ? 0 : Number(produto.price);
      
      if (itemExistente) {
        // Verificar se há estoque suficiente para aumentar a quantidade
        if (itemExistente.quantidade >= produto.stock_quantity) {
          setErro(`Estoque insuficiente para o produto "${produto.name}".`);
          return prevCarrinho;
        }
        
        // Atualizar quantidade se já existir
        return prevCarrinho.map(item => 
          item.id === produto.id 
            ? { ...item, quantidade: item.quantidade + 1 } 
            : item
        );
      } else {
        // Adicionar novo item ao carrinho
        return [...prevCarrinho, {
          id: produto.id,
          nome: produto.name,
          preco: precoValido,
          quantidade: 1,
          imagem: produto.image_url,
          codigo: produto.barcode || produto.id.toString()
        }];
      }
    });
    
    // Limpar mensagem de erro ao adicionar com sucesso
    setErro(null);
  };

  const removerDoCarrinho = (produtoId) => {
    setCarrinho(prevCarrinho => prevCarrinho.filter(item => item.id !== produtoId));
  };

  const alterarQuantidade = (produtoId, novaQuantidade) => {
    if (novaQuantidade <= 0) {
      removerDoCarrinho(produtoId);
      return;
    }
    
    // Verificar estoque disponível
    const produto = produtos.find(p => p.id === produtoId);
    if (produto && novaQuantidade > produto.stock_quantity) {
      setErro(`Estoque insuficiente para o produto "${produto.name}". Disponível: ${produto.stock_quantity}`);
      return;
    }
    
    setCarrinho(prevCarrinho => 
      prevCarrinho.map(item => 
        item.id === produtoId 
          ? { ...item, quantidade: novaQuantidade } 
          : item
      )
    );
    
    // Limpar mensagem de erro ao alterar com sucesso
    setErro(null);
  };

  const limparCarrinho = () => {
    setCarrinho([]);
    setFormaPagamento('dinheiro');
    setValorRecebido('');
    setTroco(0);
    setModalPagamentoAberto(false);
  };
  
  const abrirModalPagamento = () => {
    if (carrinho.length === 0) {
      setErro('Adicione produtos ao carrinho para finalizar a venda');
      return;
    }
    setErro(null);
    setModalPagamentoAberto(true);
  };

  const finalizarVenda = async () => {
    if (carrinho.length === 0) {
      setErro('Adicione produtos ao carrinho para finalizar a venda');
      return;
    }

    if (formaPagamento === 'dinheiro' && (!valorRecebido || Number(valorRecebido) < total)) {
      setErro('Valor recebido insuficiente');
      return;
    }
    
    // Verificar estoque disponível
    const produtosComEstoqueInsuficiente = [];
    carrinho.forEach(item => {
      const produto = produtos.find(p => p.id === item.id);
      if (produto && produto.stock_quantity < item.quantidade) {
        produtosComEstoqueInsuficiente.push({
          nome: produto.name,
          estoqueDisponivel: produto.stock_quantity,
          quantidadeSolicitada: item.quantidade
        });
      }
    });
    
    if (produtosComEstoqueInsuficiente.length > 0) {
      const mensagem = produtosComEstoqueInsuficiente.map(p => 
        `${p.nome}: Estoque disponível: ${p.estoqueDisponivel}, Solicitado: ${p.quantidadeSolicitada}`
      ).join('\n');
      setErro(`Estoque insuficiente para os seguintes produtos:\n${mensagem}`);
      return;
    }

    try {
      setProcessandoVenda(true);
      setErro(null);
      setModalPagamentoAberto(false);

      const dadosVenda = {
        items: carrinho.map(item => ({
          product_id: item.id,
          quantity: item.quantidade,
          price: item.preco
        })),
        payment_method: formaPagamento,
        total_amount: total,
        amount_paid: formaPagamento === 'dinheiro' ? Number(valorRecebido) : total,
        change_amount: formaPagamento === 'dinheiro' ? troco : 0,
        source: 'pdv',
        status: 'concluída'
      };

      const resposta = await apiService.createSale(dadosVenda);
      setVendaInfo(resposta);
      setVendaConcluida(true);
      limparCarrinho();
    } catch (err) {
      setErro(err.message || 'Erro ao finalizar venda');
    } finally {
      setProcessandoVenda(false);
    }
  };

  const imprimirRecibo = async () => {
    if (!vendaInfo) return;
    
    try {
      await apiService.printReceipt(vendaInfo.id);
    } catch (err) {
      setErro('Erro ao imprimir recibo: ' + err.message);
    }
  };

  const iniciarNovaVenda = () => {
    setVendaConcluida(false);
    setVendaInfo(null);
  };

  const formatarMoeda = (valor) => {
    // Verificar se o valor é NaN, undefined ou null e substituir por 0
    const valorNumerico = isNaN(Number(valor)) || valor === undefined || valor === null ? 0 : Number(valor);
    return `MT ${valorNumerico.toLocaleString('pt-MZ', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // Renderização condicional para tela de venda concluída
  if (vendaConcluida) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-2 sm:p-4">
        <div className="bg-white shadow-lg rounded-lg p-4 sm:p-8 max-w-md w-full text-center">
          <div className="mb-4 sm:mb-6">
            <div className="mx-auto flex items-center justify-center h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-green-100">
              <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
            </div>
            <h2 className="mt-3 sm:mt-4 text-xl sm:text-2xl font-bold text-gray-900">Venda Concluída!</h2>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">Venda #{vendaInfo?.id} realizada com sucesso.</p>
          </div>
          
          <div className="border-t border-b border-gray-200 py-3 sm:py-4 my-3 sm:my-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm sm:text-base text-gray-600">Total:</span>
              <span className="text-sm sm:text-base font-bold">{formatarMoeda(vendaInfo?.total_amount || 0)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-sm sm:text-base text-gray-600">Forma de Pagamento:</span>
              <span className="text-sm sm:text-base capitalize">{vendaInfo?.payment_method || formaPagamento}</span>
            </div>
            {vendaInfo?.payment_method === 'dinheiro' && (
              <>
                <div className="flex justify-between mb-2">
                  <span className="text-sm sm:text-base text-gray-600">Valor Recebido:</span>
                  <span className="text-sm sm:text-base">{formatarMoeda(vendaInfo?.amount_paid || 0)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm sm:text-base text-gray-600">Troco:</span>
                  <span className="text-sm sm:text-base">{formatarMoeda(vendaInfo?.change_amount || 0)}</span>
                </div>
              </>
            )}
          </div>
          
          <div className="flex flex-col space-y-2 sm:space-y-3">
            <button
              onClick={imprimirRecibo}
              className="inline-flex justify-center items-center px-3 sm:px-4 py-1.5 sm:py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Printer className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
              Imprimir Recibo
            </button>
            <button
              onClick={iniciarNovaVenda}
              className="inline-flex justify-center items-center px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
              Nova Venda
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Componente do modal de pagamento
  const ModalPagamento = () => {
    if (!modalPagamentoAberto) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div ref={modalRef} className="bg-white rounded-lg shadow-xl w-full max-w-md p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg sm:text-xl font-medium text-gray-900">Finalizar Venda</h3>
            <button 
              onClick={() => setModalPagamentoAberto(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between text-base sm:text-lg font-bold mb-4">
              <span>Total:</span>
              <span>{formatarMoeda(total)}</span>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Forma de Pagamento</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormaPagamento('dinheiro')}
                  className={`flex items-center justify-center px-4 py-2 border ${formaPagamento === 'dinheiro' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-300 text-gray-700'} rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                >
                  <Banknote className="h-5 w-5 mr-2" />
                  Dinheiro
                </button>
                <button
                  type="button"
                  onClick={() => setFormaPagamento('cartao')}
                  className={`flex items-center justify-center px-4 py-2 border ${formaPagamento === 'cartao' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-300 text-gray-700'} rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  Cartão
                </button>
              </div>
            </div>
            
            {formaPagamento === 'dinheiro' && (
              <div>
                <label htmlFor="valorRecebidoModal" className="block text-sm font-medium text-gray-700 mb-2">Valor Recebido</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">MT</span>
                  </div>
                  <input
                    type="number"
                    id="valorRecebidoModal"
                    value={valorRecebido}
                    min={isNaN(total) ? 0 : total}
                    step="0.01"
                    onChange={(e) => setValorRecebido(e.target.value)}
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-12 pr-12 text-sm border-gray-300 rounded-md"
                    placeholder="0.00"
                    // Removed duplicate min attribute
// Removed duplicate step attribute
                  />
                </div>
                
                {Number(valorRecebido) >= total && (
                  <div className="mt-2 flex justify-between">
                    <span className="text-sm text-gray-600">Troco:</span>
                    <span className="text-sm font-medium text-green-600">{formatarMoeda(troco)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {erro && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700 whitespace-pre-line">{erro}</p>
                </div>
              </div>
            </div>
          )}
          
          <button
            onClick={finalizarVenda}
            disabled={processandoVenda || carrinho.length === 0 || (formaPagamento === 'dinheiro' && (!valorRecebido || Number(valorRecebido) < total))}
            className={`w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 ${(processandoVenda || carrinho.length === 0 || (formaPagamento === 'dinheiro' && (!valorRecebido || Number(valorRecebido) < total))) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
          >
            {processandoVenda ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processando...
              </>
            ) : (
              <>
                <ShoppingCart className="h-5 w-5 mr-2" />
                Finalizar Venda
              </>
            )}
          </button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="flex flex-col lg:flex-row h-full relative">
      {/* Coluna da esquerda - Produtos */}
      <div className="w-full lg:w-2/3 p-4 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">PDV - Ponto de Venda</h1>
          <p className="mt-1 text-sm text-gray-500">Selecione os produtos para adicionar à venda</p>
        </div>
        
        {/* Barra de busca */}
        <div className="mb-6 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            placeholder="Buscar produto por nome, código ou ID..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        
        {/* Lista de produtos */}
        {carregandoProdutos ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : erroProdutos ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{erroProdutos}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {produtosFiltrados.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                {termoBusca ? 'Nenhum produto encontrado para a busca' : 'Nenhum produto disponível'}
              </div>
            ) : (
              produtosFiltrados.map(produto => (
                <div 
                  key={produto.id} 
                  className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => adicionarAoCarrinho(produto)}
                >
                  <div className="p-2 sm:p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm sm:text-lg font-medium text-gray-900 truncate">{produto.name}</h3>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                          {produto.barcode || `ID: ${produto.id}`}
                        </p>
                      </div>
                      <span className="text-sm sm:text-lg font-bold text-indigo-600">
                        {formatarMoeda(produto.price)}
                      </span>
                    </div>
                    <div className="mt-1 sm:mt-2 flex justify-between items-center">
                      <span className={`text-xs sm:text-sm ${produto.stock_quantity > 0 ? 'text-gray-500' : 'text-red-500 font-bold'}`}>
                        Estoque: {produto.stock_quantity || 0}
                      </span>
                      <button 
                        className="inline-flex items-center px-1.5 sm:px-2.5 py-1 sm:py-1.5 border border-transparent text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          adicionarAoCarrinho(produto);
                        }}
                      >
                        <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />
                        Adicionar
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      
      {/* Ícone de carrinho flutuante para mobile */}
      <div className="fixed bottom-4 right-4 lg:hidden z-20">
        <button 
          onClick={abrirModalPagamento}
          className="relative bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ShoppingCart className="h-6 w-6" />
          {carrinho.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
              {carrinho.reduce((total, item) => {
                const quantidade = isNaN(Number(item.quantidade)) ? 0 : Number(item.quantidade);
                return total + quantidade;
              }, 0)}
            </span>
          )}
        </button>
      </div>
      
      {/* Coluna da direita - Carrinho (visível apenas em desktop) */}
      <div className="hidden lg:block w-full lg:w-1/3 bg-gray-50 p-2 sm:p-4 border-l border-gray-200 overflow-auto">
        <div className="sticky top-0 bg-gray-50 pb-4 z-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base sm:text-xl font-medium text-gray-900">Carrinho</h2>
            {carrinho.length > 0 && (
              <button 
                onClick={limparCarrinho}
                className="text-xs sm:text-sm text-red-600 hover:text-red-800 flex items-center"
              >
                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                Limpar
              </button>
            )}
          </div>
          
          {carrinho.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p>Seu carrinho está vazio</p>
              <p className="text-sm mt-1">Adicione produtos para iniciar uma venda</p>
            </div>
          ) : (
            <div className="space-y-4 mb-4 max-h-[calc(100vh-400px)] overflow-auto">
              {carrinho.map(item => (
                <div key={item.id} className="bg-white p-3 rounded-lg shadow-sm">
                  <div className="flex justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 truncate">{item.nome}</h3>
                      <p className="text-sm text-gray-500">{item.codigo}</p>
                    </div>
                    <button 
                      onClick={() => removerDoCarrinho(item.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="mt-2 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => alterarQuantidade(item.id, item.quantidade - 1)}
                        className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="font-medium">{item.quantidade}</span>
                      <button 
                        onClick={() => alterarQuantidade(item.id, item.quantidade + 1)}
                        className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{formatarMoeda(item.preco)} x {item.quantidade}</p>
                      <p className="font-medium text-indigo-600">{formatarMoeda(item.preco * item.quantidade)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>{formatarMoeda(total)}</span>
            </div>
          </div>
        </div>
        
        {carrinho.length > 0 && (
          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Forma de Pagamento</label>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setFormaPagamento('dinheiro')}
                  className={`flex items-center justify-center px-3 sm:px-4 py-1.5 sm:py-2 border ${formaPagamento === 'dinheiro' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-300 text-gray-700'} rounded-md shadow-sm text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                >
                  <Banknote className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                  Dinheiro
                </button>
                <button
                  type="button"
                  onClick={() => setFormaPagamento('cartao')}
                  className={`flex items-center justify-center px-3 sm:px-4 py-1.5 sm:py-2 border ${formaPagamento === 'cartao' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-300 text-gray-700'} rounded-md shadow-sm text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                >
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                  Cartão
                </button>
              </div>
            </div>
            
            {formaPagamento === 'dinheiro' && (
              <div>
                <label htmlFor="valorRecebido" className="block text-sm font-medium text-gray-700 mb-2">Valor Recebido</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">MT</span>
                  </div>
                  <input
                    type="number"
                    id="valorRecebido"
                    value={valorRecebido}
                    onChange={(e) => setValorRecebido(e.target.value)}
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:pl-12 pr-10 sm:pr-12 text-xs sm:text-sm border-gray-300 rounded-md"
                    placeholder="0.00"
                    min={isNaN(total) ? "0" : total.toString()}
                    step="0.01"
                  />
                </div>
                
                {Number(valorRecebido) >= total && (
                  <div className="mt-2 flex justify-between">
                    <span className="text-xs sm:text-sm text-gray-600">Troco:</span>
                    <span className="text-xs sm:text-sm font-medium text-green-600">{formatarMoeda(troco)}</span>
                  </div>
                )}
              </div>
            )}
            
            {erro && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{erro}</p>
                  </div>
                </div>
              </div>
            )}
            
            <button
                onClick={abrirModalPagamento}
                disabled={carrinho.length === 0}
                className={`w-full flex justify-center items-center px-3 sm:px-4 py-2 sm:py-3 border border-transparent text-sm sm:text-base font-medium rounded-md text-white bg-indigo-600 ${carrinho.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Finalizar Venda
            </button>
          </div>
        )}
      </div>
      
      {/* Renderizar o modal de pagamento */}
      <ModalPagamento />
    </div>
  );
};

export default EfetuarVendaPDV;