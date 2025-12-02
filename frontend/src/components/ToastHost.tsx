import { useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';

export const ToastHost = () => {
  const { toasts, removeToast } = useNotifications();

  useEffect(() => {
    if (!toasts.length) return;
    const timers = toasts.map((t) => setTimeout(() => removeToast(t.id), 6000));
    return () => timers.forEach(clearTimeout);
  }, [toasts, removeToast]);

  if (!toasts.length) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div className="toast" key={toast.id}>
          <div className="flex between">
            <strong>{toast.title}</strong>
            <button className="btn-ghost" onClick={() => removeToast(toast.id)}>
              x
            </button>
          </div>
          <p className="muted" style={{ margin: '6px 0 0' }}>
            {toast.body}
          </p>
        </div>
      ))}
    </div>
  );
};
