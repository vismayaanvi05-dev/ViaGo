import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CartConflictModalProps {
  visible: boolean;
  currentStoreName: string;
  newStoreName: string;
  accentColor: string;
  onKeepCurrent: () => void;
  onClearAndAdd: () => void;
}

export default function CartConflictModal({
  visible,
  currentStoreName,
  newStoreName,
  accentColor,
  onKeepCurrent,
  onClearAndAdd,
}: CartConflictModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.conflictOverlay}>
        <View style={styles.conflictModal}>
          <View style={styles.conflictIconContainer}>
            <Ionicons name="swap-horizontal" size={32} color="#F59E0B" />
          </View>
          <Text style={styles.conflictTitle}>Replace cart?</Text>
          <Text style={styles.conflictMessage}>
            Your cart has items from {currentStoreName}. Do you want to clear it and add items from {newStoreName}?
          </Text>
          <View style={styles.conflictActions}>
            <TouchableOpacity
              style={styles.conflictCancelBtn}
              onPress={onKeepCurrent}
            >
              <Text style={styles.conflictCancelText}>Keep Current</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.conflictConfirmBtn, { backgroundColor: accentColor }]}
              onPress={onClearAndAdd}
            >
              <Text style={styles.conflictConfirmText}>Clear & Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  conflictOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
    padding: 24,
  },
  conflictModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  conflictIconContainer: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#FEF3C7',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  conflictTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 8 },
  conflictMessage: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  conflictActions: { flexDirection: 'row', gap: 12, width: '100%' },
  conflictCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  conflictCancelText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  conflictConfirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  conflictConfirmText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
