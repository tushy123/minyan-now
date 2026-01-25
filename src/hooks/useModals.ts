import { useState, useCallback } from "react";

type ModalName =
  | "auth"
  | "profile"
  | "filter"
  | "create"
  | "zmanim"
  | "detail"
  | "minyanPage";

interface ModalState {
  auth: boolean;
  profile: boolean;
  filter: boolean;
  create: boolean;
  zmanim: boolean;
}

export function useModals() {
  const [modals, setModals] = useState<ModalState>({
    auth: false,
    profile: false,
    filter: false,
    create: false,
    zmanim: false,
  });

  const openModal = useCallback((name: keyof ModalState) => {
    setModals((prev) => ({ ...prev, [name]: true }));
  }, []);

  const closeModal = useCallback((name: keyof ModalState) => {
    setModals((prev) => ({ ...prev, [name]: false }));
  }, []);

  const toggleModal = useCallback((name: keyof ModalState) => {
    setModals((prev) => ({ ...prev, [name]: !prev[name] }));
  }, []);

  const closeAllModals = useCallback(() => {
    setModals({
      auth: false,
      profile: false,
      filter: false,
      create: false,
      zmanim: false,
    });
  }, []);

  return {
    modals,
    openModal,
    closeModal,
    toggleModal,
    closeAllModals,
  };
}

// Utility hook for managing a single item selection (like detail sheets)
export function useSelection<T>() {
  const [selected, setSelected] = useState<T | null>(null);

  const select = useCallback((item: T) => {
    setSelected(item);
  }, []);

  const clear = useCallback(() => {
    setSelected(null);
  }, []);

  return {
    selected,
    select,
    clear,
    isOpen: selected !== null,
  };
}
