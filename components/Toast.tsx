
import React from 'react';
import { ToastMessage } from '../types';

interface ToastProps extends Omit<ToastMessage, 'id'> {
  onClose: () => void;
}

const toastConfig = {
  success: {
    icon: 'fa-check-circle',
    barColor: 'bg-green-500',
    iconColor: 'text-green-500',
  },
  error: {
    icon: 'fa-times-circle',
    barColor: 'bg-red-500',
    iconColor: 'text-red-500',
  },
  info: {
    icon: 'fa-info-circle',
    barColor: 'bg-blue-500',
    iconColor: 'text-blue-500',
  },
};

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  const config = toastConfig[type];

  return (
    <div className="bg-gray-800 text-white rounded-lg shadow-2xl flex overflow-hidden animate-fade-in-right">
      <div className={`w-2 ${config.barColor}`}></div>
      <div className="flex items-center p-4">
        <i className={`fas ${config.icon} ${config.iconColor} text-xl mr-4`}></i>
        <p className="flex-grow text-sm font-medium">{message}</p>
        <button onClick={onClose} className="ml-4 text-gray-500 hover:text-white transition-colors">
          <i className="fas fa-times"></i>
        </button>
      </div>
    </div>
  );
};

export default Toast;
