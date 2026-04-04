import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { APP_CONFIG } from '../config';

const SplashScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🚀</Text>
      <Text style={styles.title}>{APP_CONFIG.APP_NAME}</Text>
      <Text style={styles.subtitle}>Multi-Tenant Super App</Text>
      <ActivityIndicator size="large" color={APP_CONFIG.PRIMARY_COLOR} style={styles.loader} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_CONFIG.PRIMARY_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#E9D5FF',
    marginBottom: 40,
  },
  loader: {
    marginTop: 20,
  },
});

export default SplashScreen;
