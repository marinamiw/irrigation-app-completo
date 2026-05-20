import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, ScrollView,
  StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getCurrentCoords } from '@/utils/location';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { fazendeiroApi, IrrigacaoClimaResponse, IrrigacaoRecord } from '@/services/api';
import ScreenBackground from '@/components/ScreenBackground';
import AppHeader from '@/components/AppHeader';

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [clima, setClima] = useState<IrrigacaoClimaResponse | null>(null);
  const [historico, setHistorico] = useState<IrrigacaoRecord[]>([]);
  const [loadingClima, setLoadingClima] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const hist = await fazendeiroApi.historicoIrrigacao();
      setHistorico(hist);
    } catch {}

    try {
      setLoadingClima(true);
      const coords = await getCurrentCoords();
      const data = await fazendeiroApi.recomendacao(coords.latitude, coords.longitude);
      setClima(data);
    } catch {
    } finally {
      setLoadingClima(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const lastIrrigation = historico[0];

  const getRecomendacaoColor = (rec: string) => {
    if (rec.includes('irrigar')) return Colors.primary;
    if (rec.includes('não necessária') || rec.includes('Chuva')) return Colors.success;
    return Colors.accent;
  };

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <AppHeader />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.white} />}
        >
          {/* Farm card */}
          <View style={styles.farmCard}>
            <Text style={styles.farmCardTitle}>{user?.farmName}</Text>
            <Image
              source={require('@/assets/images/farm.png')}
              style={styles.farmImage}
              resizeMode="cover"
            />

            {/* Climate data */}
            {loadingClima ? (
              <View style={styles.climaLoading}>
                <ActivityIndicator color={Colors.primary} />
                <Text style={styles.climaLoadingText}>Buscando dados climáticos...</Text>
              </View>
            ) : clima ? (
              <View>
                <View style={styles.climaRow}>
                  <ClimateItem icon="thermometer-outline" label="Temperatura" value={`${clima.temperatura_media.toFixed(1)}°C`} />
                  <ClimateItem icon="rainy-outline" label="Precipitação" value={`${clima.precipitacao_total.toFixed(1)} mm`} />
                  <ClimateItem icon="water-outline" label="Umidade" value={`${clima.umidade_media.toFixed(0)}%`} />
                </View>
                <View style={[styles.recBadge, { backgroundColor: getRecomendacaoColor(clima.recomendacao) + '20', borderColor: getRecomendacaoColor(clima.recomendacao) }]}>
                  <Ionicons name="bulb-outline" size={16} color={getRecomendacaoColor(clima.recomendacao)} />
                  <Text style={[styles.recText, { color: getRecomendacaoColor(clima.recomendacao) }]}>{clima.recomendacao}</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.noClima}>Localização necessária para dados climáticos</Text>
            )}

            {/* Calendar link */}
            <TouchableOpacity style={styles.calendarLink} onPress={() => router.push('/calendar')}>
              <Ionicons name="calendar-outline" size={16} color={Colors.primary} />
              <Text style={styles.calendarLinkText}>Ver calendário térmico</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Last irrigation */}
          {lastIrrigation && (
            <View style={styles.lastIrrCard}>
              <View style={styles.lastIrrHeader}>
                <Ionicons name="water" size={20} color={Colors.primary} />
                <Text style={styles.lastIrrTitle}>Última irrigação</Text>
              </View>
              <Text style={styles.lastIrrDate}>
                {new Date(lastIrrigation.irrigatedAt).toLocaleString('pt-BR')}
              </Text>
            </View>
          )}

          <View style={styles.bottomPad} />
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

function ClimateItem({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.climateItem}>
      <Ionicons name={icon} size={22} color={Colors.primary} />
      <Text style={styles.climateValue}>{value}</Text>
      <Text style={styles.climateLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 16 },
  farmCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 16,
    gap: 12,
  },
  farmCardTitle: {
    fontSize: 14,
    fontFamily: 'Quicksand_700Bold',
    color: Colors.black,
  },
  farmImage: {
    width: '100%',
    height: 158,
    borderRadius: 10,
  },
  climaLoading: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  climaLoadingText: { fontSize: 13, fontFamily: 'Quicksand_500Medium', color: Colors.darkGray },
  climaRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  climateItem: { alignItems: 'center', gap: 4 },
  climateValue: { fontSize: 16, fontFamily: 'Quicksand_700Bold', color: Colors.black },
  climateLabel: { fontSize: 11, fontFamily: 'Quicksand_500Medium', color: Colors.darkGray },
  recBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  recText: { fontSize: 13, fontFamily: 'Quicksand_600SemiBold', flex: 1 },
  noClima: { fontSize: 13, fontFamily: 'Quicksand_500Medium', color: Colors.darkGray, textAlign: 'center', paddingVertical: 8 },
  calendarLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
  },
  calendarLinkText: { fontSize: 14, fontFamily: 'Quicksand_600SemiBold', color: Colors.primary, flex: 1 },
  lastIrrCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    gap: 6,
  },
  lastIrrHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lastIrrTitle: { fontSize: 14, fontFamily: 'Quicksand_700Bold', color: Colors.black },
  lastIrrDate: { fontSize: 13, fontFamily: 'Quicksand_500Medium', color: Colors.darkGray, marginLeft: 28 },
  bottomPad: { height: 90 },
});
