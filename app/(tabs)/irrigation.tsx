import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, Modal,
  RefreshControl, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getCurrentCoords } from '@/utils/location';
import { Colors } from '@/constants/Colors';
import { fazendeiroApi, IrrigacaoClimaResponse, IrrigacaoRecord } from '@/services/api';
import ScreenBackground from '@/components/ScreenBackground';
import AppHeader from '@/components/AppHeader';

export default function IrrigationScreen() {
  const [clima, setClima] = useState<IrrigacaoClimaResponse | null>(null);
  const [historico, setHistorico] = useState<IrrigacaoRecord[]>([]);
  const [loadingClima, setLoadingClima] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const hist = await fazendeiroApi.historicoIrrigacao();
      setHistorico(hist);
    } catch {}

    setLoadingClima(true);
    try {
      const loc = location ?? await getCurrentCoords().then(c => ({ lat: c.latitude, lon: c.longitude }));
      if (!location) setLocation(loc);
      const data = await fazendeiroApi.recomendacao(loc!.lat, loc!.lon);
      setClima(data);
    } catch {
    } finally {
      setLoadingClima(false);
    }
  }, [location]);

  useEffect(() => { loadData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleRegisterIrrigation = async () => {
    setRegistering(true);
    try {
      await fazendeiroApi.registrarIrrigacao();
      const hist = await fazendeiroApi.historicoIrrigacao();
      setHistorico(hist);
      setShowModal(false);
      Alert.alert('Sucesso', 'Irrigação registrada com sucesso!');
    } catch (e: any) {
      Alert.alert('Erro', e.message ?? 'Falha ao registrar irrigação.');
    } finally {
      setRegistering(false);
    }
  };

  const lastIrr = historico[0];
  const nextIrrDate = lastIrr
    ? new Date(new Date(lastIrr.irrigatedAt).getTime() + 34.5 * 60 * 60 * 1000)
    : null;

  const getNextIrrText = () => {
    if (!nextIrrDate) return 'Nenhuma irrigação registrada';
    const diff = nextIrrDate.getTime() - Date.now();
    if (diff <= 0) return 'Hora de irrigar!';
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(hours / 24);
    const remaining = hours % 24;
    if (days > 0) return `${days}d ${remaining}h ${Math.floor((diff % 3600000) / 60000)}min`;
    return `${hours}h ${Math.floor((diff % 3600000) / 60000)}min`;
  };

  const humidityLevel = clima ? Math.min(100, Math.max(0, clima.umidade_media)) : 0;

  const recColor = clima
    ? clima.recomendacao.includes('irrigar')
      ? Colors.primary
      : clima.recomendacao.includes('não necessária') || clima.recomendacao.includes('Chuva')
        ? Colors.success
        : Colors.accent
    : Colors.darkGray;

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <AppHeader />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.white} />}
        >
          {/* Timer card */}
          <View style={styles.card}>
            <View style={styles.cardIconArea}>
              <View style={styles.iconBg}>
                <Ionicons name="timer-outline" size={40} color={Colors.white} />
              </View>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardLabel}>Tempo até próxima irrigação</Text>
              <Text style={styles.cardValue}>{getNextIrrText()}</Text>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setShowModal(true)}>
                <Text style={styles.actionBtnText}>Registrar irrigação</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Water level card */}
          <View style={styles.card}>
            <View style={styles.cardInfo}>
              <Text style={styles.cardLabel}>Nível de umidade atual</Text>
              {loadingClima ? (
                <ActivityIndicator color={Colors.primary} style={{ marginTop: 8 }} />
              ) : (
                <>
                  <Text style={styles.cardValue}>{clima ? `${clima.umidade_media.toFixed(0)}%` : 'N/A'}</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${humidityLevel}%` }]} />
                  </View>
                </>
              )}
            </View>
            <View style={styles.cardIconArea}>
              <View style={styles.iconBg}>
                <MaterialCommunityIcons name="water-percent" size={40} color={Colors.white} />
              </View>
            </View>
          </View>

          {/* Recommendation card */}
          {loadingClima ? (
            <View style={[styles.recCard, { alignItems: 'center', justifyContent: 'center' }]}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : clima ? (
            <View style={[styles.recCard, { borderLeftColor: recColor }]}>
              <View style={styles.recRow}>
                <View style={styles.recContent}>
                  <Text style={[styles.recTitle, { color: recColor }]}>
                    {clima.recomendacao.includes('irrigar') ? '🌡️ Hora de irrigar!' :
                      clima.recomendacao.includes('Chuva') ? '🌧️ Chuva intensa' :
                        '💧 Solo úmido'}
                  </Text>
                  <Text style={styles.recDesc}>{clima.recomendacao}</Text>
                  <View style={styles.recStats}>
                    <Text style={styles.recStat}>🌡 {clima.temperatura_media.toFixed(1)}°C</Text>
                    <Text style={styles.recStat}>🌧 {clima.precipitacao_total.toFixed(1)}mm</Text>
                    <Text style={styles.recStat}>💧 {clima.umidade_media.toFixed(0)}%</Text>
                  </View>
                </View>
                <Image
                  source={require('@/assets/images/character.png')}
                  style={styles.characterImg}
                  resizeMode="contain"
                />
              </View>
            </View>
          ) : (
            <View style={styles.recCard}>
              <Text style={styles.recDesc}>Ative a localização para obter recomendações de irrigação.</Text>
            </View>
          )}

          {/* History */}
          {historico.length > 0 && (
            <View style={styles.historySection}>
              <Text style={styles.historyTitle}>Histórico de irrigações</Text>
              {historico.slice(0, 5).map(item => (
                <View key={item.id} style={styles.historyItem}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                  <Text style={styles.historyDate}>
                    {new Date(item.irrigatedAt).toLocaleString('pt-BR')}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.bottomPad} />
        </ScrollView>
      </SafeAreaView>

      {/* Register irrigation modal */}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowModal(false)}>
              <Ionicons name="arrow-back" size={24} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Registrar irrigação</Text>
            {clima && (
              <View style={styles.modalNeedRow}>
                <Text style={styles.modalNeedLabel}>Atualmente, seu solo precisa de:</Text>
                <View style={styles.modalNeedBadge}>
                  <Text style={styles.modalNeedValue}>
                    {clima.recomendacao.includes('irrigar') ? '💧 Irrigação' : '✅ Nenhuma ação'}
                  </Text>
                </View>
              </View>
            )}
            <Text style={styles.modalDesc}>Confirmar registro de irrigação para sua fazenda?</Text>
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={handleRegisterIrrigation}
              disabled={registering}
            >
              {registering
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={styles.confirmBtnText}>Confirmar irrigação</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 16, gap: 14 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    gap: 14,
  },
  cardIconArea: { alignItems: 'center' },
  iconBg: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1, gap: 6 },
  cardLabel: { fontSize: 12, fontFamily: 'Quicksand_500Medium', color: Colors.darkGray },
  cardValue: { fontSize: 16, fontFamily: 'Quicksand_700Bold', color: Colors.black },
  actionBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
  },
  actionBtnText: { fontSize: 13, fontFamily: 'Quicksand_600SemiBold', color: Colors.white },
  progressBar: {
    height: 8,
    backgroundColor: Colors.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  recCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    gap: 8,
    minHeight: 80,
  },
  recTitle: { fontSize: 16, fontFamily: 'Quicksand_700Bold' },
  recDesc: { fontSize: 14, fontFamily: 'Quicksand_500Medium', color: Colors.darkGray },
  recStats: { flexDirection: 'row', gap: 16, marginTop: 4 },
  recStat: { fontSize: 13, fontFamily: 'Quicksand_600SemiBold', color: Colors.black },
  recRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  recContent: { flex: 1, gap: 6 },
  characterImg: { width: 52, height: 65 },
  historySection: { gap: 8 },
  historyTitle: { fontSize: 14, fontFamily: 'Quicksand_700Bold', color: Colors.black },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  historyDate: { fontSize: 13, fontFamily: 'Quicksand_500Medium', color: Colors.darkGray },
  bottomPad: { height: 90 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    width: '100%',
    gap: 14,
  },
  modalClose: { alignSelf: 'flex-start' },
  modalTitle: { fontSize: 20, fontFamily: 'Quicksand_700Bold', color: Colors.black },
  modalNeedRow: { gap: 6 },
  modalNeedLabel: { fontSize: 14, fontFamily: 'Quicksand_500Medium', color: Colors.black },
  modalNeedBadge: {
    backgroundColor: Colors.primary + '20',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  modalNeedValue: { fontSize: 14, fontFamily: 'Quicksand_700Bold', color: Colors.primary },
  modalDesc: { fontSize: 14, fontFamily: 'Quicksand_500Medium', color: Colors.darkGray },
  confirmBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  confirmBtnText: { fontSize: 16, fontFamily: 'Quicksand_700Bold', color: Colors.white },
});
