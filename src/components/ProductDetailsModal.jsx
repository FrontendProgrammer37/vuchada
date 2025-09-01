import React, { useState } from 'react';
import { X, Package, Scale, Tag, Info, AlertTriangle, ShoppingCart } from 'lucide-react';
import WeightInputModal from './WeightInputModal';

export default function ProductDetailsModal({ product, isOpen, onClose, onAddToCart }) {
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [weight, setWeight] = useState('0.100');
  const [customPrice, setCustomPrice] = useState('');

  if (!isOpen || !product) return null;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN',
    }).format(value).replace('MZN', 'MT');
  };

  const formatWeight = (kg) => {
    return new Intl.NumberFormat('pt-MZ', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(parseFloat(kg));
  };

  const handleAddToCart = () => {
    if (product.is_weight_sale) {
      setShowWeightModal(true);
    } else {
      onAddToCart && onAddToCart(product, 1);
      onClose();
    }
  };

  const handleWeightConfirm = (selectedWeight) => {
    onAddToCart && onAddToCart({
      ...product,
      weight_in_kg: selectedWeight,
      custom_price: parseFloat(customPrice) || product.unit_price * selectedWeight
    }, 1);
    setShowWeightModal(false);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity" onClick={onClose}>
            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
          </div>

          <span className="hidden sm:inline-block sm:h-screen sm:align-middle">&#8203;</span>
          
          <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-semibold leading-6 text-gray-900">
                      {product.name || product.product_name}
                    </h3>
                    <button
                      onClick={onClose}
                      className="text-gray-400 hover:text-gray-500 focus:outline-none"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                  
                  <div className="mt-4 space-y-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Package className="h-4 w-4 mr-2 text-gray-400" />
                      <span>Código: {product.sku || product.id || 'N/A'}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Tag className="h-4 w-4 mr-2 text-gray-400" />
                      <span>Preço: {formatCurrency(product.unit_price || product.price)}</span>
                      {product.is_weight_sale && <span className="ml-1">/kg</span>}
                    </div>
                    
                    {product.is_weight_sale && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Scale className="h-4 w-4 mr-2 text-gray-400" />
                        <span>Peso: {formatWeight(weight)} kg</span>
                      </div>
                    )}
                    
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">
                          {product.is_weight_sale ? 'Valor total:' : 'Valor unitário:'}
                        </span>
                        <span className="text-lg font-semibold text-blue-700">
                          {formatCurrency(
                            product.is_weight_sale 
                              ? (product.unit_price * parseFloat(weight) || 0)
                              : (product.unit_price || product.price)
                          )}
                        </span>
                      </div>
                    </div>
                    
                    {product.description && (
                      <div className="mt-2 text-sm text-gray-600">
                        <p className="font-medium text-gray-700 mb-1">Descrição:</p>
                        <p className="text-gray-600">{product.description}</p>
                      </div>
                    )}
                    
                    {product.stock_quantity !== undefined && (
                      <div className="mt-2 text-sm">
                        <span className="font-medium text-gray-700">Estoque: </span>
                        <span className={product.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'}>
                          {product.stock_quantity > 0 
                            ? `${product.stock_quantity} ${product.is_weight_sale ? 'kg' : 'unidades'}` 
                            : '0'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
              {product.stock_quantity > 0 && (
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Adicionar ao Carrinho
                </button>
              )}
              <button
                type="button"
                className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={onClose}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>

      {showWeightModal && (
        <WeightInputModal
          isOpen={showWeightModal}
          onClose={() => setShowWeightModal(false)}
          productName={product.name || product.product_name}
          pricePerKg={product.unit_price || product.price}
          initialWeight={weight}
          maxWeight={product.stock_quantity}
          onConfirm={handleWeightConfirm}
        />
      )}
    </>
  );
}
