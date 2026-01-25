import { useCallback, useState } from "react";
import type { Toast } from "@/lib/types";

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const pushToast = useCallback((message: string, type: Toast["type"]) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  }, []);

  return { toasts, pushToast };
}
