import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocation } from '../context/LocationContext';
import { APP_CONFIG } from '../config';

const LocationScreen = () => {
  const { getCurrentLocation, setManualLocation, loading } = useLocation();
  const [detecting, setDetecting] = useState(false);

  const handleDetectLocation = async () => {
    setDetecting(true);
    await getCurrentLocation();
    setDetecting(false);
  };

  const handleManualLocation = () => {
    Alert.alert(
      'Manual Location',
      'This feature allows you to manually set your location. For now, using default location.',
      [
        {
          text: 'OK',
          onPress: () => {
            // Set default location (Bangalore)
            setManualLocation(
              { latitude: 12.9716, longitude: 77.5946 },
              'Bangalore, Karnataka'
            );
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>📍</Text>
        <Text style={styles.title}>Enable Location</Text>
        <Text style={styles.description}>
          We need your location to show nearby stores and accurate delivery estimates.
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleDetectLocation}
          disabled={detecting || loading}
        >
          {detecting || loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Detect My Location</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleManualLocation}
        >
          <Text style={styles.secondaryButtonText}>Enter Location Manually</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  icon: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  primaryButton: {
    backgroundColor: APP_CONFIG.PRIMARY_COLOR,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: APP_CONFIG.PRIMARY_COLOR,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LocationScreen;
