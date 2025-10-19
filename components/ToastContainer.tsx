
import React, { useState, useEffect } from 'react';
import { toastService } from '../services/toastService';
import { ToastMessage } from '../types';
import Toast from './Toast';

const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const subscription = toastService.onToast((toast) => {
      setToasts((currentToasts) => [...currentToasts, toast]);
      setTimeout(() => {
        removeToast(toast.id);
      }, 5000);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const removeToast = (id: number) => {
    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
  };

  return (
    <div className="fixed top-5 right-5 z-[100] w-full max-w-xs space-y-3">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

export default ToastContainer;
