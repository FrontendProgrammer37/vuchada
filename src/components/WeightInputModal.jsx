import { useState, useEffect } from 'react';

const WeightInputModal = ({
  isOpen,
  onClose,
  productName = '',
  pricePerKg = 0,
  initialWeight = '0.100',
  maxWeight = null,
  onConfirm,
  isEditing = false
}) => {
  const [weight, setWeight] = useState(initialWeight);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Format currency
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN'
    }).format(val);
  };

  // Format weight
  const formatWeight = (weight) => {
    const value = parseFloat(weight);
    return isNaN(value) ? '0.000' : value.toFixed(3).replace(/\.?0+$/, '');
  };

  // Calculate value from weight
  const calculateValue = (weight) => {
    const val = parseFloat(weight) * pricePerKg;
    return isNaN(val) ? '0.00' : val.toFixed(2);
  };

  // Calculate weight from value
  const calculateWeight = (val) => {
    const weight = parseFloat(val) / pricePerKg;
    return isNaN(weight) ? '0.100' : weight.toFixed(3);
  };

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen && isMounted) {
      setWeight(initialWeight);
      setValue(calculateValue(initialWeight));
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen, initialWeight, isMounted]);

  const handleWeightChange = (e) => {
    const newWeight = e.target.value.replace(',', '.');
    if (/^\d*\.?\d*$/.test(newWeight) || newWeight === '') {
      setWeight(newWeight);
      setValue(calculateValue(newWeight));
      validateInput(newWeight);
    }
  };

  const handleValueChange = (e) => {
    const newValue = e.target.value.replace(',', '.');
    if (/^\d*\.?\d*$/.test(newValue) || newValue === '') {
      setValue(newValue);
      const calculatedWeight = calculateWeight(newValue);
      setWeight(calculatedWeight);
      validateInput(calculatedWeight);
    }
  };

  const validateInput = (weight) => {
    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0) {
      setError('Peso inválido');
      return false;
    }
    if (maxWeight !== null && weightNum > maxWeight) {
      setError(`Peso excede o estoque disponível de ${formatWeight(maxWeight)} kg`);
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
      if (isMounted) {
        setIsSubmitting(false);
      }
    }
  };

  if (!isOpen || !isMounted) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">
            {isEditing ? 'Editar Peso' : 'Venda por Peso'}
          </h2>
          
          <div className="mb-4">
            <p className="font-medium">{productName}</p>
            <p className="text-sm text-gray-600">
              Preço: {formatCurrency(pricePerKg)} / kg
              {maxWeight !== null && (
                <span className="block">
                  Estoque disponível: {formatWeight(maxWeight)} kg
                </span>
              )}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Peso (kg)
              </label>
              <input
                type="text"
                value={weight}
                onChange={handleWeightChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.000"
                disabled={isSubmitting}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor (MT)
              </label>
              <input
                type="text"
                value={value}
                onChange={handleValueChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
                disabled={isSubmitting}
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm mt-2">
                {error}
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting || !!error}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Processando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeightInputModal;
