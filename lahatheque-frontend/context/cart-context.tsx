"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface CartItem {
  id: string; // bookId + '_' + format (+ '_' + selectedLanguage)
  bookId: string;
  title: string;
  author: string;
  cover?: string;
  format: "digital" | "paper" | "audio";
  price: number;
  quantity: number;
  maxStockPaper?: number;
  selectedLanguage?: string;
  category?: string;
  country?: string;
  level?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">, autoOpenDrawer?: boolean) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  totalAmount: number;
  totalCount: number;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("laha_cart");
      if (saved) {
        const parsed = JSON.parse(saved);
        setItems(parsed);
        console.log(`[CART PERSISTENCE] Panier rechargé depuis le stockage local (${parsed.length} article(s), total: ${parsed.reduce((a: number, b: any) => a + (b.price * b.quantity), 0)} FCFA)`);
      } else {
        console.log("[CART PERSISTENCE] Aucun panier préexistant dans le stockage local.");
      }
    } catch (e) {
      console.error("[CART PERSISTENCE] Erreur de lecture du panier dans localStorage", e);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (loaded) {
      try {
        localStorage.setItem("laha_cart", JSON.stringify(items));
        console.log(`[CART PERSISTENCE] Panier synchronisé dans le stockage local (${items.length} article(s), total: ${items.reduce((a, b) => a + (b.price * b.quantity), 0)} FCFA)`);
      } catch (e) {
        console.error("[CART PERSISTENCE] Erreur de sauvegarde du panier dans localStorage", e);
      }
    }
  }, [items, loaded]);

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);
  const toggleDrawer = () => setIsDrawerOpen((prev) => !prev);

  const addItem = (newItem: Omit<CartItem, "id">, autoOpenDrawer: boolean = true) => {
    const suffix = newItem.selectedLanguage ? `_${newItem.selectedLanguage}` : "";
    const itemId = `${newItem.bookId}_${newItem.format}${suffix}`;
    console.log(`[CART ACTION] Ajout article: "${newItem.title}" | Format: ${newItem.format} | Langue: ${newItem.selectedLanguage || "défaut"} | Prix: ${newItem.price} FCFA | Quantité: ${newItem.quantity || 1}`);
    setItems((prev) => {
      const existing = prev.find((i) => i.id === itemId);
      if (existing) {
        return prev.map((i) =>
          i.id === itemId
            ? { ...i, quantity: i.quantity + (newItem.quantity || 1) }
            : i
        );
      }
      return [...prev, { ...newItem, id: itemId, quantity: newItem.quantity || 1 }];
    });

    if (autoOpenDrawer) {
      setIsDrawerOpen(true);
    }
  };

  const removeItem = (id: string) => {
    console.log(`[CART ACTION] Suppression article id: ${id}`);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    console.log(`[CART ACTION] Mise à jour quantité id: ${id} (delta: ${delta > 0 ? `+${delta}` : delta})`);
    setItems((prev) =>
      prev
        .map((i) => {
          if (i.id === id) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => {
    console.log("[CART ACTION] Vidage intégral du panier (après finalisation de commande).");
    setItems([]);
  };

  const totalAmount = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalAmount,
        totalCount,
        isDrawerOpen,
        openDrawer,
        closeDrawer,
        toggleDrawer,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
