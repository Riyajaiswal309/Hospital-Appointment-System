import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { removeToast } from '@/store/slices/uiSlice';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

export function ToastContainer() {
  const dispatch = useAppDispatch();
  const { toasts } = useAppSelector((s) => s.ui);

  useEffect(() => {
    const timers = toasts.map((t) =>
      setTimeout(() => dispatch(removeToast(t.id)), 4000)
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts, dispatch]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 rounded-xl shadow-lg px-4 py-3 animate-slide-in-right bg-white border ${
            toast.type === 'success'
              ? 'border-green-200'
              : toast.type === 'error'
              ? 'border-red-200'
              : 'border-blue-200'
          }`}
        >
          {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />}
          {toast.type === 'error' && <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />}
          <p className="text-sm text-slate-700 flex-1">{toast.message}</p>
          <button
            onClick={() => dispatch(removeToast(toast.id))}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
