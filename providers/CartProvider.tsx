'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Movie } from '@/types/catalog';

interface CartContextType {
  items: Movie[];
  isReady: boolean;
  has: (movieId: string | number) => boolean;
  toggle: (movie: Movie) => void;
  addToCart: (movie: Movie) => void;
  removeFromCart: (movieId: string | number) => void;
  remove: (movieId: string | number) => void;
  isInCart: (movieId: string | number) => boolean;
  clearCart: () => void;
  clear: () => void;
  totalCount: number;
  count: number;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Movie[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('utv_cart');
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch {
      // Игнорируем ошибки парсинга
    } finally {
      setIsReady(true);
    }
  }, []);

  const saveToStorage = (updated: Movie[]) => {
    setItems(updated);
    try {
      localStorage.setItem('utv_cart', JSON.stringify(updated));
    } catch {
      // Игнорируем ошибки записи
    }
  };

  const has = (movieId: string | number): boolean => {
    return items.some((m) => String(m.id) === String(movieId));
  };

  const addToCart = (movie: Movie) => {
    if (!has(movie.id)) {
      saveToStorage([...items, movie]);
    }
  };

  const removeFromCart = (movieId: string | number) => {
    saveToStorage(items.filter((m) => String(m.id) !== String(movieId)));
  };

  const toggle = (movie: Movie) => {
    if (has(movie.id)) {
      removeFromCart(movie.id);
    } else {
      addToCart(movie);
    }
  };

  const clearCart = () => {
    saveToStorage([]);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        isReady,
        has,
        toggle,
        addToCart,
        removeFromCart,
        remove: removeFromCart,
        isInCart: has,
        clearCart,
        clear: clearCart,
        totalCount: items.length,
        count: items.length,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    return {
      items: [],
      isReady: true,
      has: () => false,
      toggle: () => {},
      addToCart: () => {},
      removeFromCart: () => {},
      remove: () => {},
      isInCart: () => false,
      clearCart: () => {},
      clear: () => {},
      totalCount: 0,
      count: 0,
    };
  }
  return context;
}