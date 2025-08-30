import { useState, useEffect } from 'react';

const WeightSaleModal = ({ 
  product, 
  isOpen, 
  onClose, 
  onConfirm 
}) => {
  const [weight, setWeight] = useState(0.1);
  const [customPrice, setCustomPrice] = useState(0);

  useEffect(() => {
    if (isOpen && product) {
      setWeight(0.1);
      setCustomPrice((0.1 * product.sale_price).toFixed(2));
    }
  }, [isOpen, product]);

  const handleWeightChange = (e) => {
    const newWeight = parseFloat(e.target.value) || 0;
    setWeight(newWeight);
    setCustomPrice((newWeight * product.sale_price).toFixed(2));
  };

  const handlePriceChange = (e) => {
    const newPrice = parseFloat(e.target.value) || 0;
    setCustomPrice(newPrice);
  };

  const handleConfirm = () => {
    if (weight < 0.1) {
      alert('O peso mínimo é 0.1kg');
      return;
    }
    
    if (customPrice <= 0) {
      alert('O valor total deve ser maior que zero');
      return;
    }

    onConfirm({
      productId: product.id,
      isWeightSale: true,
      weightInKg: parseFloat(weight),
      customPrice: parseFloat(customPrice),
      quantity: 1
    });
    
    onClose();
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Venda por Peso - {product.name}</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Peso (kg):
            </label>
            <input
              type="number"
              step="0.01"
              min="0.1"
              value={weight}
              onChange={handleWeightChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <p className="text-sm text-gray-600">
              Preço por kg: {product.sale_price.toFixed(2)} MTn
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valor Total (MTn):
            </label>
            <input
              type="number"
              step="0.01"
              min="0.1"
              value={customPrice}
              onChange={handlePriceChange}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            Adicionar ao Carrinho
          </button>
        </div>
      </div>
    </div>
  );
};

export default WeightSaleModal;
