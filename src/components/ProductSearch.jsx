import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Minus } from 'lucide-react';
import apiService from '../services/api';

const ProductSearch = ({ onAddToCart }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const searchTimeout = useRef(null);

  // Buscar produtos quando o termo de busca mudar
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setProducts([]);
      return;
    }

    // Debounce para evitar muitas requisições
    clearTimeout(searchTimeout.current);
    
    searchTimeout.current = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiService.request(`products?search=${encodeURIComponent(searchTerm)}`);
        setProducts(response.data || []);
      } catch (err) {
        console.error('Erro ao buscar produtos:', err);
        setError('Erro ao carregar produtos. Tente novamente.');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout.current);
  }, [searchTerm]);

  // Adicionar produto ao carrinho
  const handleAddToCart = (product) => {
    if (onAddToCart) {
      onAddToCart({
        id: product.id,
        name: product.name,
        price: product.sale_price,
        stock: product.current_stock
      });
    }
  };

  return (
    <div className="w-full">
      {/* Barra de busca */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Buscar produtos por nome ou código de barras..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          autoFocus
        />
      </div>

      {/* Resultados da busca */}
      {searchTerm && (
        <div className="mt-2 bg-white shadow-lg rounded-md overflow-hidden">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              Buscando produtos...
            </div>
          ) : error ? (
            <div className="p-4 text-red-600 text-sm">
              {error}
            </div>
          ) : products.length === 0 ? (
            <div className="p-4 text-gray-500 text-sm">
              Nenhum produto encontrado para "{searchTerm}"
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {products.map((product) => (
                <li key={product.id} className="p-3 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {product.name}
                      </p>
                      <div className="flex items-center mt-1 text-xs text-gray-500">
                        <span className="mr-2">
                          {product.barcode || 'Sem código de barras'}
                        </span>
                        <span className="text-green-600 font-medium">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(product.sale_price || 0)}
                        </span>
                        <span className="ml-2 text-gray-400">•</span>
                        <span className="ml-2">
                          Estoque: {product.current_stock || 0}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="ml-4 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      disabled={!product.current_stock}
                      title={!product.current_stock ? 'Sem estoque disponível' : ''}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Adicionar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductSearch;
