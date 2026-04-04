import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocation } from '../../context/LocationContext';
import { customerAPI } from '../../services/customerAPI';
import { APP_CONFIG } from '../../config';

const SearchScreen = ({ route, navigation }) => {
  const { module } = route.params || {};
  const { location } = useLocation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ stores: [], items: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length >= 2) {
      const debounce = setTimeout(() => {
        handleSearch();
      }, 500);
      return () => clearTimeout(debounce);
    } else {
      setResults({ stores: [], items: [] });
    }
  }, [query]);

  const handleSearch = async () => {
    if (!location || query.length < 2) return;

    try {
      setLoading(true);
      const response = await customerAPI.search(
        query,
        location.latitude,
        location.longitude,
        module
      );
      setResults(response.data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStoreItem = ({ item }) => (
    <TouchableOpacity
      style={styles.resultCard}
      onPress={() => navigation.navigate('StoreDetails', { storeId: item.id, module: item.store_type })}
    >
      <View style={styles.storeLogo}>
        <Text style={styles.storeLogoText}>{item.name.charAt(0)}</Text>
      </View>
      <View style={styles.resultInfo}>
        <Text style={styles.resultName}>{item.name}</Text>
        <Text style={styles.resultMeta}>
          {item.distance_km ? `${item.distance_km} km` : ''} • {item.store_type}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderItemResult = ({ item }) => (
    <TouchableOpacity
      style={styles.resultCard}
      onPress={() => navigation.navigate('StoreDetails', { storeId: item.store_id, module: item.store_type })}
    >
      <View style={styles.itemIcon}>
        <Text style={styles.itemIconText}>🍽️</Text>
      </View>
      <View style={styles.resultInfo}>
        <Text style={styles.resultName}>{item.name}</Text>
        <Text style={styles.resultMeta}>
          ₹{item.base_price} • {item.store_name}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for stores or items..."
          value={query}
          onChangeText={setQuery}
          autoFocus
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading && (
        <ActivityIndicator size="large" color={APP_CONFIG.PRIMARY_COLOR} style={styles.loader} />
      )}

      {!loading && query.length >= 2 && (
        <FlatList
          ListHeaderComponent={
            <View>
              {results.stores.length > 0 && (
                <View>
                  <Text style={styles.sectionTitle}>Stores ({results.stores.length})</Text>
                  <FlatList
                    data={results.stores}
                    renderItem={renderStoreItem}
                    keyExtractor={(item) => item.id}
                  />
                </View>
              )}
              {results.items.length > 0 && (
                <View>
                  <Text style={styles.sectionTitle}>Items ({results.items.length})</Text>
                </View>
              )}
            </View>
          }
          data={results.items}
          renderItem={renderItemResult}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            query.length >= 2 && !loading ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>😕</Text>
                <Text style={styles.emptyText}>No results found</Text>
                <Text style={styles.emptySubtext}>Try searching for something else</Text>
              </View>
            ) : null
          }
        />
      )}

      {query.length < 2 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyText}>Start typing to search</Text>
          <Text style={styles.emptySubtext}>Search for stores, items, or cuisines</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  clearIcon: {
    fontSize: 20,
    color: '#9CA3AF',
    padding: 4,
  },
  loader: {
    marginTop: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  resultCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  storeLogo: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: APP_CONFIG.PRIMARY_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  storeLogoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  itemIcon: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemIconText: {
    fontSize: 24,
  },
  resultInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  resultMeta: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
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
  },
});

export default SearchScreen;
