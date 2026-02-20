import React from 'react';

export interface ToastItem {
  id: string;
  message: string;
}

interface ToastHostProps {
  toasts: ToastItem[];
}

export const ToastHost: React.FC<ToastHostProps> = ({ toasts }) => (
  <div className="toastHost" aria-live="polite">
    {toasts.map((t) => (
      <div key={t.id} className="toast warning">
        {t.message}
      </div>
    ))}
  </div>
);
