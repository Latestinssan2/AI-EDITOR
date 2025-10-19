
import { ToastMessage } from '../types';

type ToastListener = (toast: ToastMessage) => void;

class ToastService {
  private listeners: ToastListener[] = [];
  private toastId = 0;

  subscribe(listener: ToastListener) {
    this.listeners.push(listener);
    return {
      unsubscribe: () => {
        this.listeners = this.listeners.filter(l => l !== listener);
      },
    };
  }

  private emit(toast: ToastMessage) {
    this.listeners.forEach(listener => listener(toast));
  }

  show(message: string, type: ToastMessage['type']) {
    this.toastId += 1;
    this.emit({ id: this.toastId, message, type });
  }

  success(message: string) {
    this.show(message, 'success');
  }

  error(message: string) {
    this.show(message, 'error');
  }

  info(message: string) {
    this.show(message, 'info');
  }

  onToast(listener: ToastListener) {
    return this.subscribe(listener);
  }
}

export const toastService = new ToastService();
