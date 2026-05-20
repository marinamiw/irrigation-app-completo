import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Colors } from '@/constants/Colors';
import { fazendeiroApi, IrrigacaoClimaResponse } from '@/services/api';
import ScreenBackground from '@/components/ScreenBackground';
import AppHeader from '@/components/AppHeader';

export default function CalendarScreen() {
  const router = useRouter();
  const [clima, setClima] = useState<IrrigacaoClimaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locationError, setLocationError] = useState(false);

  const loadClima = async () => {
    setLocationError(false);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setLocationError(true); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const data = await fazendeiroApi.recomendacao(loc.coords.latitude, loc.coords.longitude);
      setClima(data);
    } catch {
      setLocationError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadClima(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadClima();
    setRefreshing(false);
  };

  const getTempCategory = (temp: number) => {
    if (temp < 15) return { label: 'Frio', color: '#00afef', icon: 'snow-outline' };
    if (temp < 25) return { label: 'Ameno', color: Colors.success, icon: 'partly-sunny-outline' };
    if (temp < 32) return { label: 'Quente', color: '#F6AD55', icon: 'sunny-outline' };
    return { label: 'Muito quente', color: '#E53E3E', icon: 'flame-outline' };
  };

  const getPrecipCategory = (precip: number) => {
    if (precip < 2) return { label: 'Seco', color: '#E53E3E' };
    if (precip < 5) return { label: 'Leve', color: '#F6AD55' };
    if (precip < 10) return { label: 'Moderado', color: Colors.success };
    return { label: 'Intenso', color: Colors.primary };
  };

  const tempCat = clima ? getTempCategory(clima.temperatura_media) : null;
  const precipCat = clima ? getPrecipCategory(clima.precipitacao_total) : null;

  const recColor = clima
    ? clima.recomendacao.includes('irrigar')
      ? Colors.primary
      : clima.recomendacao.includes('Chuva')
        ? Colors.success
        : Colors.accent
    : Colors.darkGray;

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <AppHeader />
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.white} />}
        >
          {/* Back + title */}
          <View style={styles.titleRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.screenTitle}>Calendário Térmico</Text>
          </View>

          {loading ? (
            <View style={styles.loadingCenter}>
              <ActivityIndicator color={Colors.primary} size="large" />
              <Text style={styles.loadingText}>Buscando dados climáticos via NASA POWER...</Text>
            </View>
          ) : locationError ? (
            <View style={styles.errorCard}>
              <Ionicons name="location-outline" size={48} color={Colors.mediumGray} />
              <Text style={styles.errorText}>Permissão de localização necessária</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={loadClima}>
                <Text style={styles.retryBtnText}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          ) : clima ? (
            <>
              {/* Date header */}
              <View style={styles.dateCard}>
                <Ionicons name="calendar" size={20} color={Colors.primary} />
                <Text style={styles.dateText}>Dados de hoje — {clima.data}</Text>
              </View>

              {/* Temp card */}
              <View style={[styles.metricCard, { borderLeftColor: tempCat!.color }]}>
                <View style={styles.metricHeader}>
                  <Ionicons name={tempCat!.icon as any} size={28} color={tempCat!.color} />
                  <View>
                    <Text style={styles.metricTitle}>Temperatura média</Text>
                    <Text style={[styles.metricBadge, { color: tempCat!.color }]}>{tempCat!.label}</Text>
                  </View>
                  <Text style={[styles.metricBig, { color: tempCat!.color }]}>
                    {clima.temperatura_media.toFixed(1)}°C
                  </Text>
                </View>
                <View style={styles.tempScale}>
                  {[
                    { range: '< 15°C', label: 'Frio', color: '#00afef' },
                    { range: '15–25°C', label: 'Ameno', color: Colors.success },
                    { range: '25–32°C', label: 'Quente', color: '#F6AD55' },
                    { range: '> 32°C', label: 'Extremo', color: '#E53E3E' },
                  ].map(item => (
                    <View key={item.label} style={styles.tempScaleItem}>
                      <View style={[styles.tempScaleDot, { backgroundColor: item.color }]} />
                      <Text style={styles.tempScaleText}>{item.range}</Text>
                      <Text style={[styles.tempScaleLabel, { color: item.color }]}>{item.label}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Precipitation card */}
              <View style={[styles.metricCard, { borderLeftColor: precipCat!.color }]}>
                <View style={styles.metricHeader}>
                  <Ionicons name="rainy-outline" size={28} color={precipCat!.color} />
                  <View>
                    <Text style={styles.metricTitle}>Precipitação total</Text>
                    <Text style={[styles.metricBadge, { color: precipCat!.color }]}>{precipCat!.label}</Text>
                  </View>
                  <Text style={[styles.metricBig, { color: precipCat!.color }]}>
                    {clima.precipitacao_total.toFixed(1)} mm
                  </Text>
                </View>
              </View>

              {/* Humidity card */}
              <View style={[styles.metricCard, { borderLeftColor: Colors.secondary }]}>
                <View style={styles.metricHeader}>
                  <Ionicons name="water-outline" size={28} color={Colors.secondary} />
                  <View>
                    <Text style={styles.metricTitle}>Umidade média</Text>
                    <Text style={[styles.metricBadge, { color: Colors.secondary }]}>
                      {clima.umidade_media >= 60 ? 'Boa' : 'Baixa'}
                    </Text>
                  </View>
                  <Text style={[styles.metricBig, { color: Colors.secondary }]}>
                    {clima.umidade_media.toFixed(0)}%
                  </Text>
                </View>
                <View style={styles.humidBar}>
                  <View style={[styles.humidFill, { width: `${Math.min(100, clima.umidade_media)}%` as any }]} />
                </View>
              </View>

              {/* Recommendation card */}
              <View style={[styles.recCard, { borderColor: recColor }]}>
                <View style={styles.recHeader}>
                  <Ionicons name="bulb" size={22} color={recColor} />
                  <Text style={[styles.recTitle, { color: recColor }]}>Recomendação</Text>
                </View>
                <Text style={styles.recText}>{clima.recomendacao}</Text>
              </View>
            </>
          ) : null}

          <View style={{ height: 90 }} />
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 8, gap: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  backBtn: { padding: 4 },
  screenTitle: { fontSize: 20, fontFamily: 'Quicksand_700Bold', color: Colors.black },
  loadingCenter: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  loadingText: { fontSize: 14, fontFamily: 'Quicksand_500Medium', color: Colors.darkGray, textAlign: 'center' },
  errorCard: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  errorText: { fontSize: 16, fontFamily: 'Quicksand_600SemiBold', color: Colors.darkGray },
  retryBtn: { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  retryBtnText: { fontSize: 14, fontFamily: 'Quicksand_700Bold', color: Colors.white },
  dateCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.primary + '15', borderRadius: 10,
    padding: 12,
  },
  dateText: { fontSize: 14, fontFamily: 'Quicksand_600SemiBold', color: Colors.primary },
  metricCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    gap: 12,
  },
  metricHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  metricTitle: { fontSize: 13, fontFamily: 'Quicksand_500Medium', color: Colors.darkGray },
  metricBadge: { fontSize: 12, fontFamily: 'Quicksand_700Bold', marginTop: 2 },
  metricBig: { fontSize: 28, fontFamily: 'Quicksand_700Bold', marginLeft: 'auto' },
  tempScale: { gap: 6 },
  tempScaleItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tempScaleDot: { width: 10, height: 10, borderRadius: 5 },
  tempScaleText: { fontSize: 12, fontFamily: 'Quicksand_500Medium', color: Colors.darkGray, width: 64 },
  tempScaleLabel: { fontSize: 12, fontFamily: 'Quicksand_700Bold' },
  humidBar: { height: 8, backgroundColor: Colors.lightGray, borderRadius: 4, overflow: 'hidden' },
  humidFill: { height: '100%', backgroundColor: Colors.secondary, borderRadius: 4 },
  recCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    gap: 8,
  },
  recHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recTitle: { fontSize: 16, fontFamily: 'Quicksand_700Bold' },
  recText: { fontSize: 14, fontFamily: 'Quicksand_500Medium', color: Colors.darkGray },
});
