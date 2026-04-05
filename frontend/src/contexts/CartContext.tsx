import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback, useRef } from 'react';
import { customerAPI } from '../services/api';
import { useAuth } from './AuthContext';

interface CartItem {
  id: string;
  item_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  variant_id?: string;
}

interface Cart {
  id: string;
  user_id: string;
  store_id: string;
  module?: string;
  items: CartItem[];
}

interface Store {
  id: string;
  name: string;
  store_type?: string;
}

interface CartContextType {
  cart: Cart | null;
  store: Store | null;
  subtotal: number;
  itemCount: number;
  loading: boolean;
  lastAction: { type: string; message: string; success: boolean } | null;
  loadCart: () => Promise<void>;
  addToCart: (storeId: string, itemId: string, quantity?: number, variantId?: string) => Promise<{ success: boolean; conflict?: boolean; message?: string }>;
  updateQuantity: (itemId: string, quantity: number) => Promise<{ success: boolean; message?: string }>;
  removeItem: (itemId: string) => Promise<{ success: boolean; message?: string }>;
  clearCart: () => Promise<{ success: boolean; message?: string }>;
  clearLastAction: () => void;
  getItemQuantity: (itemId: string) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, appMode } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(false);
  const [subtotal, setSubtotal] = useState(0);
  const [itemCount, setItemCount] = useState(0);
  const [lastAction, setLastAction] = useState<{ type: string; message: string; success: boolean } | null>(null);
  const actionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearLastAction = useCallback(() => {
    setLastAction(null);
    if (actionTimeoutRef.current) {
      clearTimeout(actionTimeoutRef.current);
    }
  }, []);

  const showAction = useCallback((type: string, message: string, success: boolean) => {
    setLastAction({ type, message, success });
    if (actionTimeoutRef.current) clearTimeout(actionTimeoutRef.current);
    actionTimeoutRef.current = setTimeout(() => setLastAction(null), 3000);
  }, []);

  const loadCart = useCallback(async () => {
    if (!isAuthenticated || appMode !== 'customer') {
      setCart(null);
      setStore(null);
      setSubtotal(0);
      setItemCount(0);
      return;
    }
    
    try {
      const response = await customerAPI.getCart();
      const { cart: cartData, store: storeData, subtotal: sub, item_count } = response.data;
      
      setCart(cartData);
      setStore(storeData);
      setSubtotal(sub || 0);
      setItemCount(item_count || (cartData?.items?.length || 0));
    } catch (error) {
      console.error('Error loading cart:', error);
      setCart(null);
      setStore(null);
      setSubtotal(0);
      setItemCount(0);
    }
  }, [isAuthenticated, appMode]);

  useEffect(() => {
    if (isAuthenticated && appMode === 'customer') {
      loadCart();
    } else {
      setCart(null);
      setStore(null);
      setSubtotal(0);
      setItemCount(0);
    }
  }, [isAuthenticated, appMode, loadCart]);

  const addToCart = async (storeId: string, itemId: string, quantity = 1, variantId?: string) => {
    try {
      // Check for store conflict before making API call
      // Use cart.store_id directly (don't require store object)
      if (cart && cart.items && cart.items.length > 0 && cart.store_id && cart.store_id !== storeId) {
        const storeName = store?.name || cart.store_id;
        return {
          success: false,
          conflict: true,
          message: `Your cart has items from ${storeName}. Clear cart to add from a different category.`,
        };
      }

      const response = await customerAPI.addToCart({
        store_id: storeId,
        item_id: itemId,
        quantity,
        variant_id: variantId,
      });
      
      if (response.data.success) {
        await loadCart();
        showAction('add', 'Added to cart', true);
        return { success: true };
      } else if (response.data.error === 'cart_conflict') {
        return {
          success: false,
          conflict: true,
          message: response.data.message,
        };
      }
      showAction('add', 'Failed to add item', false);
      return { success: false, message: 'Failed to add to cart' };
    } catch (error: any) {
      console.error('Add to cart error:', error);
      const msg = error.response?.data?.detail || 'Failed to add to cart';
      showAction('add', msg, false);
      return { success: false, message: msg };
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      await customerAPI.updateCartItem({ item_id: itemId, quantity });
      await loadCart();
      return { success: true };
    } catch (error) {
      console.error('Update quantity error:', error);
      showAction('update', 'Failed to update', false);
      return { success: false, message: 'Failed to update quantity' };
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      await customerAPI.removeFromCart(itemId);
      await loadCart();
      showAction('remove', 'Item removed', true);
      return { success: true };
    } catch (error) {
      console.error('Remove item error:', error);
      showAction('remove', 'Failed to remove', false);
      return { success: false, message: 'Failed to remove item' };
    }
  };

  const clearCart = async () => {
    try {
      await customerAPI.clearCart();
      setCart(null);
      setStore(null);
      setSubtotal(0);
      setItemCount(0);
      showAction('clear', 'Cart cleared', true);
      return { success: true };
    } catch (error) {
      console.error('Clear cart error:', error);
      showAction('clear', 'Failed to clear cart', false);
      return { success: false, message: 'Failed to clear cart' };
    }
  };

  const getItemQuantity = useCallback((itemId: string): number => {
    if (!cart?.items) return 0;
    const item = cart.items.find(i => i.item_id === itemId);
    return item?.quantity || 0;
  }, [cart]);

  return (
    <CartContext.Provider
      value={{
        cart,
        store,
        subtotal,
        itemCount,
        loading,
        lastAction,
        loadCart,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        clearLastAction,
        getItemQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
