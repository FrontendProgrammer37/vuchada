import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Configure default toast options
const defaultOptions = {
  position: 'top-right',
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
};

export const showToast = (message, type = 'default', options = {}) => {
  const toastOptions = { ...defaultOptions, ...options };
  
  switch (type.toLowerCase()) {
    case 'success':
      return toast.success(message, toastOptions);
    case 'error':
      return toast.error(message, { ...toastOptions, autoClose: 5000 });
    case 'warning':
      return toast.warn(message, { ...toastOptions, autoClose: 4000 });
    case 'info':
      return toast.info(message, toastOptions);
    default:
      return toast(message, toastOptions);
  }
};

export const success = (message, options) => showToast(message, 'success', options);
export const error = (message, options) => showToast(message, 'error', options);
export const warning = (message, options) => showToast(message, 'warning', options);
export const info = (message, options) => showToast(message, 'info', options);

export default {
  success,
  error,
  warning,
  info,
  show: showToast
};
