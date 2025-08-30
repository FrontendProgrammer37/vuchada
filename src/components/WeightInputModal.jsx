import { useState, useEffect } from 'react';

const WeightInputModal = ({ 
  isOpen, 
  onClose, 
  productName, 
  pricePerKg,
  initialWeight = '0.100',
  maxWeight = null, // Optional max weight for inventory control
  onConfirm 
}) => {
  const [weight, setWeight] = useState(initialWeight);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setWeight(initialWeight);
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen, initialWeight]);

  // Handle weight input with proper decimal handling
  const handleWeightChange = (e) => {
    let value = e.target.value;
    
    // Replace comma with dot for decimal input
    value = value.replace(',', '.');
    
    // Allow only numbers and one decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setWeight(value);
      setError('');
    }
  };

  // Format weight to 3 decimal places
  const formatWeight = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? '0.000' : num.toFixed(3).replace(/\.?0+$/, '');
  };

  const handleConfirm = async () => {
    if (isSubmitting) return;
    
    // Parse and validate weight
    const weightValue = parseFloat(weight.replace(',', '.'));
    
    if (isNaN(weightValue) || weightValue <= 0) {
      setError('Por favor, insira um peso válido maior que zero');
      return;
    }
    
    // Round to 3 decimal places
    const roundedWeight = Math.round(weightValue * 1000) / 1000;
    
    // Validate against max weight if provided
    if (maxWeight !== null && roundedWeight > maxWeight) {
      setError(`Peso máximo disponível: ${formatWeight(maxWeight)} kg`);
      return;
    }
    
    try {
      setIsSubmitting(true);
      await onConfirm(roundedWeight);
      onClose();
    } catch (err) {
      setError(err.message || 'Erro ao processar o peso');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculatePrice = () => {
    const weightValue = parseFloat(weight.replace(',', '.')) || 0;
    const roundedWeight = Math.round(weightValue * 1000) / 1000;
    return (roundedWeight * pricePerKg).toFixed(2);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 transition-opacity" 
          aria-hidden="true" 
          onClick={!isSubmitting ? onClose : undefined}
        >
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              {productName}
            </h3>
            
            <div className="mt-4">
              <label htmlFor="weight" className="block text-sm font-medium text-gray-700">
                Peso (kg)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type="text"
                  name="weight"
                  id="weight"
                  className={`focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-3 pr-12 sm:text-sm border ${
                    error ? 'border-red-300' : 'border-gray-300'
                  } rounded-md py-2`}
                  placeholder="0,000"
                  value={weight}
                  onChange={handleWeightChange}
                  autoFocus
                  disabled={isSubmitting}
                  inputMode="decimal"
                  pattern="[0-9]*[.,]?[0-9]*"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">kg</span>
                </div>
              </div>
              
              <div className="mt-1 text-sm text-gray-500">
                Use ponto ou vírgula como separador decimal (ex: 0,300 para 300g)
              </div>
              
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
              
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Preço por kg:</p>
                  <p className="text-lg font-medium">R$ {pricePerKg.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Total:</p>
                  <p className="text-lg font-bold">R$ {calculatePrice()}</p>
                </div>
              </div>
              
              {maxWeight !== null && (
                <div className="mt-2 text-sm text-gray-500">
                  Estoque disponível: {formatWeight(maxWeight)} kg
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              onClick={handleConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processando...' : 'Confirmar'}
            </button>
            
            <button
              type="button"
              className={`mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeightInputModal;
