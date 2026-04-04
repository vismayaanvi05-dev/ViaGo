import React, { createContext, useState, useEffect, useContext } from 'react';
import { customerAPI } from '../services/customerAPI';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState(null);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [subtotal, setSubtotal] = useState(0);
  const [itemCount, setItemCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      loadCart();
    } else {
      // Clear cart when logged out
      setCart(null);
      setStore(null);
      setSubtotal(0);
      setItemCount(0);
    }
  }, [isAuthenticated]);

  const loadCart = async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      const response = await customerAPI.getCart();
      const { cart: cartData, store: storeData, subtotal: sub, item_count } = response.data;
      
      setCart(cartData);
      setStore(storeData);
      setSubtotal(sub);
      setItemCount(item_count);
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (storeId, itemId, quantity = 1, variantId = null, addOns = []) => {
    try {
      const response = await customerAPI.addToCart({
        store_id: storeId,
        item_id: itemId,
        quantity,
        variant_id: variantId,
        add_ons: addOns,
      });
      
      if (response.data.success) {
        await loadCart();
        return { success: true };
      } else if (response.data.error === 'cart_conflict') {
        return {
          success: false,
          conflict: true,
          message: response.data.message,
          currentStoreId: response.data.current_store_id,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || 'Failed to add to cart',
      };
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    try {
      await customerAPI.updateCartItem({ item_id: itemId, quantity });
      await loadCart();
      return { success: true };
    } catch (error) {
      return { success: false, message: 'Failed to update quantity' };
    }
  };

  const removeItem = async (itemId) => {
    try {
      await customerAPI.removeFromCart(itemId);
      await loadCart();
      return { success: true };
    } catch (error) {
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
      return { success: true };
    } catch (error) {
      return { success: false, message: 'Failed to clear cart' };
    }
  };

  const applyCoupon = async (couponCode) => {
    try {
      const response = await customerAPI.applyCoupon(couponCode);
      await loadCart();
      return { success: true, discount: response.data.discount };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || 'Invalid coupon',
      };
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
        applyCoupon,
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
