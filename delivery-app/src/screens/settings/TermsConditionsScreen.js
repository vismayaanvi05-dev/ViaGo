import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

const TermsConditionsScreen = ({ route }) => {
  const { content } = route.params || {};

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.text}>{content || 'Terms and conditions not available.'}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 20,
  },
  text: {
    fontSize: 14,
    lineHeight: 24,
    color: '#374151',
  },
});

export default TermsConditionsScreen;
