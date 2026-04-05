import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { customerAPI } from '@/src/services/api';
import { useLocation } from '@/src/contexts/LocationContext';
import { useCart } from '@/src/contexts/CartContext';

const TENANT_ID = 'b331f4e9-00f2-495b-bc46-3e43ef7fb008';
const VIRTUAL_STORE_ID = `${TENANT_ID}_laundry`;

const SERVICE_ICONS: Record<string, string> = {
  'wash': 'water',
  'dry clean': 'sparkles',
  'ironing': 'flame',
  'iron': 'flame',
  'steam press': 'cloud',
  'fold': 'layers',
};

const getServiceIcon = (name: string) => {
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(SERVICE_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return 'shirt';
};

interface LaundryItem {
  id: string;
  name: string;
  category?: string;
  price: number;
  pricing_type: string;
  is_active: boolean;
  image_url?: string;
  tenant_id?: string;
}

interface LaundryService {
  id: string;
  name: string;
  description?: string;
  turnaround_time_hours?: number;
  is_active: boolean;
  items?: LaundryItem[];
}

export default function LaundryView({ searchQuery }: { searchQuery?: string }) {
  const { location, address } = useLocation();
  const { addToCart, getItemQuantity, updateQuantity, removeItem, cart } = useCart();
  const [services, setServices] = useState<LaundryService[]>([]);
  const [allItems, setAllItems] = useState<LaundryItem[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Derive virtual store id from first item's tenant_id
  const virtualStoreId = allItems[0]?.tenant_id
    ? `${allItems[0].tenant_id}_laundry`
    : VIRTUAL_STORE_ID;

  const loadData = useCallback(async () => {
    try {
      const city = address?.city || undefined;
      const response = await customerAPI.getLaundry(
        city, searchQuery || undefined,
        location?.latitude, location?.longitude
      );
      setServices(response.data.services || []);
      setAllItems(response.data.items || []);
    } catch (error) {
      console.error('Error loading laundry:', error);
    } finally {
      setLoading(false);
    }
  }, [address, location, searchQuery]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Build filter options from item categories
  const itemCategories = [...new Set(allItems.map(i => i.category || 'General').filter(Boolean))];

  // Filter items
  const displayItems = selectedFilter === 'all'
    ? allItems
    : allItems.filter(i => (i.category || 'General') === selectedFilter);

  const handleAdd = async (item: LaundryItem) => {
    const storeId = item.tenant_id ? `${item.tenant_id}_laundry` : virtualStoreId;
    await addToCart(storeId, item.id, 1);
  };

  const handleIncrement = async (item: LaundryItem) => {
    const storeId = item.tenant_id ? `${item.tenant_id}_laundry` : virtualStoreId;
    const qty = getItemQuantity(item.id);
    const cartItem = cart?.items?.find(i => i.item_id === item.id);
    if (cartItem) {
      await updateQuantity(cartItem.item_id, qty + 1);
    } else {
      await addToCart(storeId, item.id, 1);
    }
  };

  const handleDecrement = async (item: LaundryItem) => {
    const qty = getItemQuantity(item.id);
    const cartItem = cart?.items?.find(i => i.item_id === item.id);
    if (cartItem) {
      if (qty <= 1) {
        await removeItem(cartItem.item_id);
      } else {
        await updateQuantity(cartItem.item_id, qty - 1);
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading laundry services...</Text>
      </View>
    );
  }

  if (allItems.length === 0 && services.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <View style={styles.emptyIcon}>
          <Ionicons name="shirt-outline" size={44} color="#3B82F6" />
        </View>
        <Text style={styles.emptyTitle}>No laundry services</Text>
        <Text style={styles.emptySub}>No laundry services available in your area yet</Text>
      </View>
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />}
    >
      {/* Services Banner */}
      {services.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.servicesRow}
          contentContainerStyle={styles.servicesContent}
        >
          {services.map(svc => (
            <View key={svc.id} style={styles.serviceCard}>
              <View style={styles.serviceIconWrap}>
                <Ionicons name={getServiceIcon(svc.name) as any} size={22} color="#3B82F6" />
              </View>
              <Text style={styles.serviceName}>{svc.name}</Text>
              {svc.turnaround_time_hours && (
                <Text style={styles.serviceTurnaround}>{svc.turnaround_time_hours}h delivery</Text>
              )}
            </View>
          ))}
        </ScrollView>
      )}

      {/* Category Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsRow}
        contentContainerStyle={styles.chipsContent}
      >
        <TouchableOpacity
          style={[styles.chip, selectedFilter === 'all' && styles.chipActive]}
          onPress={() => setSelectedFilter('all')}
        >
          <Text style={[styles.chipText, selectedFilter === 'all' && styles.chipTextActive]}>
            All Items ({allItems.length})
          </Text>
        </TouchableOpacity>
        {itemCategories.map(cat => {
          const count = allItems.filter(i => (i.category || 'General') === cat).length;
          const isActive = selectedFilter === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => setSelectedFilter(cat)}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {cat} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Items List */}
      <View style={styles.itemList}>
        {displayItems.map(item => {
          const qty = getItemQuantity(item.id);
          const pricingLabel = item.pricing_type === 'per_kg' ? '/kg' : '/item';

          return (
            <View key={item.id} style={styles.itemCard}>
              {/* Item Icon */}
              <View style={styles.itemIconWrap}>
                <Ionicons name="shirt" size={22} color="#3B82F6" />
              </View>

              {/* Item Info */}
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                {item.category && (
                  <Text style={styles.itemCategory}>{item.category}</Text>
                )}
                <View style={styles.itemPriceRow}>
                  <Text style={styles.itemPrice}>{'\u20B9'}{item.price}</Text>
                  <Text style={styles.itemPriceUnit}>{pricingLabel}</Text>
                </View>
              </View>

              {/* Add / Qty Controls */}
              <View style={styles.actionCol}>
                {qty === 0 ? (
                  <TouchableOpacity style={styles.addBtn} onPress={() => handleAdd(item)}>
                    <Text style={styles.addBtnText}>ADD</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.qtyControl}>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => handleDecrement(item)}>
                      <Ionicons name="remove" size={16} color="#3B82F6" />
                    </TouchableOpacity>
                    <Text style={styles.qtyNum}>{qty}</Text>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => handleIncrement(item)}>
                      <Ionicons name="add" size={16} color="#3B82F6" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingWrap: { alignItems: 'center', paddingVertical: 50 },
  loadingText: { marginTop: 10, color: '#9CA3AF', fontSize: 14 },
  emptyWrap: { alignItems: 'center', paddingVertical: 50 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#3B82F612',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: '#1F2937', marginBottom: 4 },
  emptySub: { fontSize: 13, color: '#9CA3AF' },

  // Services banner
  servicesRow: { marginBottom: 16 },
  servicesContent: { paddingHorizontal: 4, gap: 12 },
  serviceCard: {
    alignItems: 'center', width: 100, paddingVertical: 16,
    backgroundColor: '#EFF6FF', borderRadius: 16,
  },
  serviceIconWrap: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  serviceName: { fontSize: 13, fontWeight: '600', color: '#1E40AF', marginBottom: 2 },
  serviceTurnaround: { fontSize: 11, color: '#60A5FA' },

  // Category Chips
  chipsRow: { marginBottom: 12 },
  chipsContent: { paddingHorizontal: 4, gap: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, backgroundColor: '#F3F4F6',
    borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  chipActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  chipTextActive: { color: '#fff' },

  // Item List
  itemList: { gap: 1 },
  itemCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', padding: 14,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  itemIconWrap: {
    width: 48, height: 48, borderRadius: 12, backgroundColor: '#3B82F610',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#1F2937', marginBottom: 2 },
  itemCategory: { fontSize: 12, color: '#9CA3AF', marginBottom: 4 },
  itemPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  itemPrice: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  itemPriceUnit: { fontSize: 12, color: '#9CA3AF' },

  // Action column
  actionCol: { marginLeft: 12, alignItems: 'center' },
  addBtn: {
    borderWidth: 1.5, borderColor: '#3B82F6', borderRadius: 8,
    paddingHorizontal: 20, paddingVertical: 8, backgroundColor: '#3B82F608',
  },
  addBtnText: { fontSize: 14, fontWeight: '700', color: '#3B82F6' },
  qtyControl: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#3B82F6', borderRadius: 8,
    overflow: 'hidden',
  },
  qtyBtn: {
    width: 32, height: 32, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#3B82F610',
  },
  qtyNum: { fontSize: 14, fontWeight: '700', color: '#3B82F6', minWidth: 24, textAlign: 'center' },
});
