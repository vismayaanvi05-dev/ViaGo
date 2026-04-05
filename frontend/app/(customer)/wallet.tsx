import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, RefreshControl, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { customerAPI } from '@/src/services/api';
import { APP_CONFIG } from '@/src/config';

const P = APP_CONFIG.PRIMARY_COLOR;
const AMOUNTS = [100, 200, 500, 1000];

export default function WalletScreen() {
  const router = useRouter();
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [topupModal, setTopupModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');
  const [topping, setTopping] = useState(false);
  const [toast, setToast] = useState('');

  const loadWallet = useCallback(async () => {
    try {
      const res = await customerAPI.getWallet();
      setWallet(res.data.wallet);
      setTransactions(res.data.transactions || []);
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadWallet(); }, [loadWallet]);

  const handleTopup = async () => {
    const amount = parseFloat(topupAmount);
    if (!amount || amount <= 0) return;
    setTopping(true);
    try {
      await customerAPI.topupWallet(amount);
      setTopupModal(false);
      setTopupAmount('');
      setToast(`₹${amount} added to wallet`);
      setTimeout(() => setToast(''), 3000);
      loadWallet();
    } catch (e) {
      console.error(e);
    } finally { setTopping(false); }
  };

  if (loading) return (
    <SafeAreaView style={s.c}><View style={s.center}><ActivityIndicator size="large" color={P} /></View></SafeAreaView>
  );

  return (
    <SafeAreaView style={s.c}>
      <View style={s.hdr}>
        <TouchableOpacity style={s.back} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#1E293B" />
        </TouchableOpacity>
        <Text style={s.hdrTitle}>Wallet</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadWallet(); }} colors={[P]} />}>
        {/* Balance Card */}
        <View style={s.balCard}>
          <View style={s.balIcon}><Ionicons name="wallet" size={28} color="#fff" /></View>
          <Text style={s.balLabel}>Available Balance</Text>
          <Text style={s.balAmount}>{'\u20B9'}{wallet?.balance || 0}</Text>
          <TouchableOpacity style={s.topupBtn} onPress={() => setTopupModal(true)}>
            <Ionicons name="add-circle" size={18} color="#fff" />
            <Text style={s.topupText}>Add Money</Text>
          </TouchableOpacity>
        </View>

        {/* Promo Coupons Quick View */}
        <View style={s.promoSection}>
          <Text style={s.secTitle}>Available Coupons</Text>
          <CouponsList />
        </View>

        {/* Transactions */}
        <View style={s.txnSection}>
          <Text style={s.secTitle}>Transaction History</Text>
          {transactions.length === 0 ? (
            <View style={s.empty}>
              <Ionicons name="receipt-outline" size={36} color="#D1D5DB" />
              <Text style={s.emptyText}>No transactions yet</Text>
            </View>
          ) : transactions.map((t, i) => (
            <View key={t.id || i} style={s.txnItem}>
              <View style={[s.txnIcon, t.type === 'credit' ? { backgroundColor: '#D1FAE5' } : { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name={t.type === 'credit' ? 'arrow-down' : 'arrow-up'} size={16} color={t.type === 'credit' ? '#059669' : '#EF4444'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.txnDesc}>{t.description}</Text>
                <Text style={s.txnTime}>{t.created_at ? new Date(t.created_at).toLocaleDateString() : ''}</Text>
              </View>
              <Text style={[s.txnAmt, t.type === 'credit' ? { color: '#059669' } : { color: '#EF4444' }]}>
                {t.type === 'credit' ? '+' : '-'}{'\u20B9'}{t.amount}
              </Text>
            </View>
          ))}
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Top-up Modal */}
      <Modal visible={topupModal} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modal}>
            <View style={s.modalHdr}>
              <Text style={s.modalTitle}>Add Money</Text>
              <TouchableOpacity onPress={() => setTopupModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <View style={s.quickAmounts}>
              {AMOUNTS.map(a => (
                <TouchableOpacity key={a} style={[s.quickBtn, topupAmount === String(a) && { backgroundColor: P, borderColor: P }]}
                  onPress={() => setTopupAmount(String(a))}>
                  <Text style={[s.quickBtnText, topupAmount === String(a) && { color: '#fff' }]}>{'\u20B9'}{a}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.inputRow}>
              <Text style={s.rupee}>{'\u20B9'}</Text>
              <TextInput style={s.input} placeholder="Enter amount" keyboardType="numeric"
                value={topupAmount} onChangeText={setTopupAmount} placeholderTextColor="#94A3B8" />
            </View>
            <TouchableOpacity style={[s.addBtn, { backgroundColor: P }]} onPress={handleTopup} disabled={topping}>
              {topping ? <ActivityIndicator color="#fff" /> : <Text style={s.addBtnText}>Add {'\u20B9'}{topupAmount || '0'}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {toast ? (
        <View style={s.toast}><Ionicons name="checkmark-circle" size={16} color="#fff" /><Text style={s.toastText}>{toast}</Text></View>
      ) : null}
    </SafeAreaView>
  );
}

function CouponsList() {
  const [coupons, setCoupons] = useState<any[]>([]);
  useEffect(() => {
    customerAPI.getCoupons().then(r => setCoupons(r.data.coupons || [])).catch(() => {});
  }, []);
  if (coupons.length === 0) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
      {coupons.map((c, i) => (
        <View key={c.id || i} style={s.couponCard}>
          <View style={s.couponBadge}>
            <Text style={s.couponCode}>{c.code}</Text>
          </View>
          <Text style={s.couponDesc}>{c.description}</Text>
          <Text style={s.couponMin}>Min order: {'\u20B9'}{c.min_order_value}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hdr: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  back: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  hdrTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  balCard: { alignItems: 'center', backgroundColor: '#fff', paddingVertical: 28, marginBottom: 8 },
  balIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: APP_CONFIG.PRIMARY_COLOR, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  balLabel: { fontSize: 13, color: '#94A3B8', fontWeight: '600' },
  balAmount: { fontSize: 40, fontWeight: '800', color: '#0F172A', marginVertical: 6 },
  topupBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: APP_CONFIG.PRIMARY_COLOR, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 12 },
  topupText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  promoSection: { paddingHorizontal: 16, paddingTop: 16 },
  secTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 8 },
  couponCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginRight: 10, width: 180, borderWidth: 1, borderColor: '#F1F5F9' },
  couponBadge: { backgroundColor: '#F3E8FF', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginBottom: 8 },
  couponCode: { fontSize: 13, fontWeight: '800', color: '#8B5CF6', letterSpacing: 0.5 },
  couponDesc: { fontSize: 12, color: '#334155', lineHeight: 16, marginBottom: 4 },
  couponMin: { fontSize: 11, color: '#94A3B8' },
  txnSection: { paddingHorizontal: 16, paddingTop: 16 },
  empty: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { fontSize: 14, color: '#94A3B8', marginTop: 8 },
  txnItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 6, gap: 12 },
  txnIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  txnDesc: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  txnTime: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  txnAmt: { fontSize: 16, fontWeight: '800' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  quickAmounts: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  quickBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1.5, borderColor: '#E2E8F0' },
  quickBtnText: { fontSize: 15, fontWeight: '700', color: '#334155' },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 14, marginBottom: 16, backgroundColor: '#F8FAFC' },
  rupee: { fontSize: 20, fontWeight: '700', color: '#0F172A', paddingLeft: 16 },
  input: { flex: 1, padding: 16, fontSize: 20, fontWeight: '700', color: '#0F172A' },
  addBtn: { paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  toast: { position: 'absolute', top: 60, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: '#10B981', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, gap: 8, elevation: 8 },
  toastText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
