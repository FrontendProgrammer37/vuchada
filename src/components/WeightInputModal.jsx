import { useState, useEffect } from 'react';

const WeightInputModal = ({
  isOpen,
  onClose,
  product,
  initialWeight = '0.100',
  onConfirm,
  isEditing = false
}) => {
  const [weight, setWeight] = useState(initialWeight);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN'
    }).format(value);
  };

  // Format weight
  const formatWeight = (weight) => {
    const value = parseFloat(weight);
    return isNaN(value) ? '0.000' : value.toFixed(3).replace(/\.?0+$/, '');
  };

  // Calculate value from weight
  const calculateValue = (weight) => {
    const val = parseFloat(weight) * product.sale_price;
    return isNaN(val) ? '' : val.toFixed(2);
  };

  // Calculate weight from value
  const calculateWeight = (val) => {
    const weight = parseFloat(val) / product.sale_price;
    return isNaN(weight) ? '' : weight.toFixed(3);
  };

  useEffect(() => {
    if (isOpen) {
      setWeight(initialWeight);
      setValue(calculateValue(initialWeight));
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen, initialWeight, product]);

  const handleWeightChange = (e) => {
    const newWeight = e.target.value;
    setWeight(newWeight);
    setValue(calculateValue(newWeight));
    validateInput(newWeight);
  };

  const handleValueChange = (e) => {
    const newValue = e.target.value;
    setValue(newValue);
    const calculatedWeight = calculateWeight(newValue);
    setWeight(calculatedWeight);
    validateInput(calculatedWeight);
  };

  const validateInput = (weight) => {
    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0) {
      setError('Peso inválido');
      return false;
    }
    if (product.track_inventory && weightNum > product.current_stock) {
      setError(`Peso excede o estoque disponível de ${formatWeight(product.current_stock)} kg`);
      return false;
    }
    setError('');
    return true;
  };

  const handleConfirm = async () => {
    if (isSubmitting) return;
    
    const weightNum = parseFloat(weight);
    if (!validateInput(weight)) return;
    
    try {
      setIsSubmitting(true);
      await onConfirm(weightNum);
      onClose();
    } catch (err) {
      setError(err.message || 'Erro ao processar o peso');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="bg-blue-50 px-6 py-4 rounded-t-lg">
          <h3 className="text-lg font-bold text-gray-900">Venda por Peso</h3>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <h4 className="text-lg font-medium text-gray-900">{product.name}</h4>
            <p className="text-sm text-gray-500">Código: {product.code || 'N/A'}</p>
            <p className="text-green-600 font-medium mt-1">
              Preço por KG: {formatCurrency(product.sale_price)}
            </p>
            {product.track_inventory && (
              <p className="text-blue-600 text-sm mt-1">
                Estoque disponível: {formatWeight(product.current_stock)} kg
              </p>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor (MT)
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">MT</span>
                </div>
                <input
                  type="number"
                  value={value}
                  onChange={handleValueChange}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-12 pr-12 sm:text-sm border-gray-300 rounded-md p-2 border"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Peso (KG)
              </label>
              <div className="relative rounded-md shadow-sm">
                <input
                  type="number"
                  value={weight}
                  onChange={handleWeightChange}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-12 sm:text-sm border-gray-300 rounded-md p-2 border"
                  placeholder="0.000"
                  min="0.001"
                  step="0.001"
                  disabled={isSubmitting}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">KG</span>
                </div>
              </div>
              <p className="mt-1 text-sm text-gray-600">
                Peso: {formatWeight(weight)} KG
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={!weight || parseFloat(weight) <= 0 || !!error || isSubmitting}
              className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                (!weight || parseFloat(weight) <= 0 || !!error || isSubmitting)
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isSubmitting ? 'Processando...' : (isEditing ? 'Atualizar' : 'Adicionar ao Carrinho')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeightInputModal;
