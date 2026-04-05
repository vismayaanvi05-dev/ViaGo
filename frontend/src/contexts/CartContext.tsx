import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
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
  items: CartItem[];
}

interface Store {
  id: string;
  name: string;
}

interface CartContextType {
  cart: Cart | null;
  store: Store | null;
  subtotal: number;
  itemCount: number;
  loading: boolean;
  loadCart: () => Promise<void>;
  addToCart: (storeId: string, itemId: string, quantity?: number, variantId?: string) => Promise<{ success: boolean; conflict?: boolean; message?: string }>;
  updateQuantity: (itemId: string, quantity: number) => Promise<{ success: boolean; message?: string }>;
  removeItem: (itemId: string) => Promise<{ success: boolean; message?: string }>;
  clearCart: () => Promise<{ success: boolean; message?: string }>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, appMode } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(false);
  const [subtotal, setSubtotal] = useState(0);
  const [itemCount, setItemCount] = useState(0);

  const loadCart = useCallback(async () => {
    if (!isAuthenticated || appMode !== 'customer') {
      setCart(null);
      setStore(null);
      setSubtotal(0);
      setItemCount(0);
      return;
    }
    
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
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
      setLoading(true);
      const response = await customerAPI.addToCart({
        store_id: storeId,
        item_id: itemId,
        quantity,
        variant_id: variantId,
      });
      
      if (response.data.success) {
        await loadCart();
        return { success: true };
      } else if (response.data.error === 'cart_conflict') {
        return {
          success: false,
          conflict: true,
          message: response.data.message,
        };
      }
      return { success: false, message: 'Failed to add to cart' };
    } catch (error: any) {
      console.error('Add to cart error:', error);
      return {
        success: false,
        message: error.response?.data?.detail || 'Failed to add to cart',
      };
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      setLoading(true);
      await customerAPI.updateCartItem({ item_id: itemId, quantity });
      await loadCart();
      return { success: true };
    } catch (error) {
      console.error('Update quantity error:', error);
      return { success: false, message: 'Failed to update quantity' };
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      setLoading(true);
      await customerAPI.removeFromCart(itemId);
      await loadCart();
      return { success: true };
    } catch (error) {
      console.error('Remove item error:', error);
      return { success: false, message: 'Failed to remove item' };
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      setLoading(true);
      await customerAPI.clearCart();
      setCart(null);
      setStore(null);
      setSubtotal(0);
      setItemCount(0);
      return { success: true };
    } catch (error) {
      console.error('Clear cart error:', error);
      return { success: false, message: 'Failed to clear cart' };
    } finally {
      setLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        store,
        subtotal,
        itemCount,
        loading,
        loadCart,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
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
