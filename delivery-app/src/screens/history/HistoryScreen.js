import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { deliveryAPI } from '../../services/deliveryAPI';
import { APP_CONFIG } from '../../config';

const HistoryScreen = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  const limit = 20;

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async (isRefresh = false) => {
    try {
      const currentSkip = isRefresh ? 0 : skip;
      setLoading(!isRefresh);
      
      const response = await deliveryAPI.getDeliveryHistory(currentSkip, limit);
      const newDeliveries = response.data.deliveries;
      
      if (isRefresh) {
        setDeliveries(newDeliveries);
        setSkip(limit);
      } else {
        setDeliveries([...deliveries, ...newDeliveries]);
        setSkip(currentSkip + limit);
      }
      
      setHasMore(newDeliveries.length === limit);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory(true);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      loadHistory();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderDelivery = ({ item }) => (
    <View style={styles.deliveryCard}>
      <View style={styles.cardHeader}>
        <View style={styles.moduleBadge}>
          <Text style={styles.moduleBadgeText}>{item.module?.toUpperCase()}</Text>
        </View>
        <Text style={styles.earningText}>₹{item.delivery_fee || 50}</Text>
      </View>

      <Text style={styles.orderNumber}>#{item.order_number}</Text>
      {item.store_name && (
        <Text style={styles.storeName}>🏪 {item.store_name}</Text>
      )}
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Delivered on:</Text>
        <Text style={styles.infoValue}>{formatDate(item.delivered_at)}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Order Amount:</Text>
        <Text style={styles.infoValue}>₹{item.total_amount}</Text>
      </View>
      
      <View style={styles.statusBadge}>
        <Text style={styles.statusText}>✅ Delivered</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading && deliveries.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={APP_CONFIG.PRIMARY_COLOR} />
        </View>
      ) : deliveries.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyText}>No delivery history</Text>
          <Text style={styles.emptySubtext}>Your completed deliveries will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={deliveries}
          renderItem={renderDelivery}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loading && deliveries.length > 0 ? (
              <ActivityIndicator style={styles.footerLoader} color={APP_CONFIG.PRIMARY_COLOR} />
            ) : null
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  deliveryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  moduleBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  moduleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  earningText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  storeName: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  statusBadge: {
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  footerLoader: {
    paddingVertical: 20,
  },
});

export default HistoryScreen;
