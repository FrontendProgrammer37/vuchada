import { toast as toastify } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Default toast configuration
const defaultConfig = {
  position: 'top-right',
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
};

const toast = {
  success: (message, config = {}) => {
    toastify.success(message, { ...defaultConfig, ...config });
  },
  error: (message, config = {}) => {
    toastify.error(message, { ...defaultConfig, ...config });
  },
  info: (message, config = {}) => {
    toastify.info(message, { ...defaultConfig, ...config });
  },
  warning: (message, config = {}) => {
    toastify.warning(message, { ...defaultConfig, ...config });
  },
  default: (message, config = {}) => {
    toastify(message, { ...defaultConfig, ...config });
  },
  dismiss: () => {
    toastify.dismiss();
  },
  loading: (message, config = {}) => {
    return toastify.loading(message, { ...defaultConfig, ...config });
  },
  update: (toastId, options) => {
    toastify.update(toastId, options);
  },
  promise: (promise, messages, options = {}) => {
    return toastify.promise(promise, messages, { ...defaultConfig, ...options });
  },
};

export default toast;
