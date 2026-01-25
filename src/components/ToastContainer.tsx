import type { Toast } from "@/lib/types";

export function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="toast-container" id="toastContainer">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}
