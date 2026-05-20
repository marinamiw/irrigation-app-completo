import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getCurrentCoords } from '@/utils/location';
import { Colors } from '@/constants/Colors';
import { fazendeiroApi, IrrigacaoClimaResponse } from '@/services/api';
import ScreenBackground from '@/components/ScreenBackground';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function buildCalendar(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function parseDateFromNasa(dateStr: string): Date | null {
  if (!dateStr || dateStr.length !== 8) return null;
  const y = parseInt(dateStr.slice(0, 4));
  const m = parseInt(dateStr.slice(4, 6)) - 1;
  const d = parseInt(dateStr.slice(6, 8));
  return new Date(y, m, d);
}

export default function CalendarScreen() {
  const router = useRouter();
  const [clima, setClima] = useState<IrrigacaoClimaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const [viewYear] = useState(today.getFullYear());
  const [viewMonth] = useState(today.getMonth());

  const loadClima = async () => {
    setError(null);
    try {
      const coords = await getCurrentCoords();
      const data = await fazendeiroApi.recomendacao(coords.latitude, coords.longitude);
      setClima(data);
    } catch (e: any) {
      setError(e.message ?? 'Não foi possível carregar os dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadClima(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    setLoading(true);
    await loadClima();
    setRefreshing(false);
  };

  const nasaDate = clima ? parseDateFromNasa(clima.data) : null;
  const daysAgo = nasaDate ? Math.round((today.getTime() - nasaDate.getTime()) / 86400000) : null;

  const getTempCategory = (temp: number) => {
    if (temp < 15) return { label: 'Frio', color: '#00afef', icon: 'snow-outline' as const };
    if (temp < 25) return { label: 'Ameno', color: Colors.success, icon: 'partly-sunny-outline' as const };
    if (temp < 32) return { label: 'Quente', color: '#F6AD55', icon: 'sunny-outline' as const };
    return { label: 'Muito quente', color: '#E53E3E', icon: 'flame-outline' as const };
  };

  const getPrecipCategory = (precip: number) => {
    if (precip < 2) return { label: 'Sem chuva', color: '#E53E3E' };
    if (precip < 5) return { label: 'Chuva leve', color: '#F6AD55' };
    if (precip < 10) return { label: 'Chuva moderada', color: Colors.success };
    return { label: 'Chuva intensa', color: Colors.primary };
  };

  const recColor = clima
    ? clima.recomendacao.includes('irrigar') ? Colors.primary
      : clima.recomendacao.includes('Chuva') ? Colors.success
      : Colors.accent
    : Colors.darkGray;

  const cells = buildCalendar(viewYear, viewMonth);
  const tempCat = clima ? getTempCategory(clima.temperatura_media) : null;
  const precipCat = clima ? getPrecipCategory(clima.precipitacao_total) : null;

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Fixed header with back button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Calendário Térmico</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.white} />}
        >
          {/* NASA delay notice */}
          <View style={styles.noticeCard}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
            <Text style={styles.noticeText}>
              {daysAgo != null
                ? `Os dados exibidos são de ${daysAgo} dias atrás. O satélite da NASA leva alguns dias para processar e liberar as informações — isso é normal!`
                : 'Os dados climáticos vêm do satélite da NASA e levam alguns dias para serem processados. Por isso, são sempre de dias anteriores.'}
            </Text>
          </View>

          {/* Calendar grid */}
          <View style={styles.calendarCard}>
            <Text style={styles.calendarMonth}>{MONTHS[viewMonth]} {viewYear}</Text>
            <View style={styles.weekRow}>
              {WEEKDAYS.map(d => (
                <Text key={d} style={styles.weekDay}>{d}</Text>
              ))}
            </View>
            <View style={styles.daysGrid}>
              {cells.map((day, i) => {
                const isToday = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
                const isNasaDay = nasaDate && day === nasaDate.getDate() && viewMonth === nasaDate.getMonth() && viewYear === nasaDate.getFullYear();
                return (
                  <View key={i} style={styles.dayCell}>
                    {day !== null && (
                      <View style={[
                        styles.dayInner,
                        isNasaDay && { backgroundColor: tempCat?.color ?? Colors.primary },
                        isToday && !isNasaDay && styles.dayToday,
                      ]}>
                        <Text style={[
                          styles.dayText,
                          isNasaDay && styles.dayTextOnColor,
                          isToday && !isNasaDay && styles.dayTextToday,
                        ]}>{day}</Text>
                        {isNasaDay && (
                          <View style={styles.dayDot} />
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
            {nasaDate && (
              <View style={styles.calendarLegend}>
                <View style={[styles.legendDot, { backgroundColor: tempCat?.color ?? Colors.primary }]} />
                <Text style={styles.legendText}>Dados disponíveis</Text>
                <View style={[styles.legendDot, { backgroundColor: Colors.lightGray, borderWidth: 1.5, borderColor: Colors.primary }]} />
                <Text style={styles.legendText}>Hoje</Text>
              </View>
            )}
          </View>

          {/* Climate data */}
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={Colors.primary} size="large" />
              <Text style={styles.loadingText}>Buscando dados climáticos via satélite NASA...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorCard}>
              <Ionicons name="location-outline" size={48} color={Colors.mediumGray} />
              <Text style={styles.errorTitle}>Não foi possível carregar</Text>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
                <Text style={styles.retryBtnText}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          ) : clima ? (
            <>
              {/* Date badge */}
              <View style={styles.dateBadge}>
                <Ionicons name="calendar-outline" size={16} color={Colors.primary} />
                <Text style={styles.dateText}>
                  Referente a{' '}
                  {nasaDate
                    ? nasaDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
                    : clima.data}
                </Text>
              </View>

              {/* Temperature */}
              <View style={[styles.metricCard, { borderLeftColor: tempCat!.color }]}>
                <View style={styles.metricTop}>
                  <View style={[styles.metricIconBg, { backgroundColor: tempCat!.color + '20' }]}>
                    <Ionicons name={tempCat!.icon} size={28} color={tempCat!.color} />
                  </View>
                  <View style={styles.metricInfo}>
                    <Text style={styles.metricLabel}>Temperatura média</Text>
                    <Text style={[styles.metricBadge, { color: tempCat!.color }]}>{tempCat!.label}</Text>
                  </View>
                  <Text style={[styles.metricValue, { color: tempCat!.color }]}>
                    {clima.temperatura_media.toFixed(1)}°C
                  </Text>
                </View>
                <View style={styles.scaleRow}>
                  {[
                    { range: '< 15°C', label: 'Frio', color: '#00afef' },
                    { range: '15–25°C', label: 'Ameno', color: Colors.success },
                    { range: '25–32°C', label: 'Quente', color: '#F6AD55' },
                    { range: '> 32°C', label: 'Extremo', color: '#E53E3E' },
                  ].map(item => (
                    <View key={item.label} style={styles.scaleItem}>
                      <View style={[styles.scaleDot, { backgroundColor: item.color }]} />
                      <Text style={styles.scaleRange}>{item.range}</Text>
                      <Text style={[styles.scaleLabel, { color: item.color }]}>{item.label}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Precipitation */}
              <View style={[styles.metricCard, { borderLeftColor: precipCat!.color }]}>
                <View style={styles.metricTop}>
                  <View style={[styles.metricIconBg, { backgroundColor: precipCat!.color + '20' }]}>
                    <Ionicons name="rainy-outline" size={28} color={precipCat!.color} />
                  </View>
                  <View style={styles.metricInfo}>
                    <Text style={styles.metricLabel}>Precipitação total</Text>
                    <Text style={[styles.metricBadge, { color: precipCat!.color }]}>{precipCat!.label}</Text>
                  </View>
                  <Text style={[styles.metricValue, { color: precipCat!.color }]}>
                    {clima.precipitacao_total.toFixed(1)} mm
                  </Text>
                </View>
              </View>

              {/* Humidity */}
              <View style={[styles.metricCard, { borderLeftColor: Colors.secondary }]}>
                <View style={styles.metricTop}>
                  <View style={[styles.metricIconBg, { backgroundColor: Colors.secondary + '20' }]}>
                    <Ionicons name="water-outline" size={28} color={Colors.secondary} />
                  </View>
                  <View style={styles.metricInfo}>
                    <Text style={styles.metricLabel}>Umidade do ar</Text>
                    <Text style={[styles.metricBadge, { color: Colors.secondary }]}>
                      {clima.umidade_media >= 60 ? 'Boa' : 'Baixa'}
                    </Text>
                  </View>
                  <Text style={[styles.metricValue, { color: Colors.secondary }]}>
                    {clima.umidade_media.toFixed(0)}%
                  </Text>
                </View>
                <View style={styles.humidBar}>
                  <View style={[styles.humidFill, { width: `${Math.min(100, clima.umidade_media)}%` as any }]} />
                </View>
              </View>

              {/* Recommendation */}
              <View style={[styles.recCard, { borderColor: recColor }]}>
                <View style={styles.recHeader}>
                  <Ionicons name="bulb" size={22} color={recColor} />
                  <Text style={[styles.recTitle, { color: recColor }]}>Recomendação para sua lavoura</Text>
                </View>
                <Text style={styles.recText}>{clima.recomendacao}</Text>
              </View>
            </>
          ) : null}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontFamily: 'Quicksand_700Bold', color: Colors.white },
  content: { paddingHorizontal: 16, paddingTop: 4, gap: 14 },
  noticeCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    alignItems: 'flex-start',
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Quicksand_500Medium',
    color: Colors.darkGray,
    lineHeight: 19,
  },
  calendarCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  calendarMonth: { fontSize: 16, fontFamily: 'Quicksand_700Bold', color: Colors.black, textAlign: 'center', marginBottom: 12 },
  weekRow: { flexDirection: 'row', marginBottom: 6 },
  weekDay: { flex: 1, textAlign: 'center', fontSize: 11, fontFamily: 'Quicksand_700Bold', color: Colors.mediumGray },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.28%', alignItems: 'center', marginBottom: 4 },
  dayInner: {
    width: 34, height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayToday: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  dayText: { fontSize: 13, fontFamily: 'Quicksand_500Medium', color: Colors.black },
  dayTextOnColor: { color: Colors.white, fontFamily: 'Quicksand_700Bold' },
  dayTextToday: { color: Colors.primary, fontFamily: 'Quicksand_700Bold' },
  dayDot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: Colors.white,
    marginTop: 1,
  },
  calendarLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    justifyContent: 'center',
  },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { fontSize: 11, fontFamily: 'Quicksand_500Medium', color: Colors.darkGray, marginRight: 8 },
  loadingBox: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadingText: { fontSize: 14, fontFamily: 'Quicksand_500Medium', color: Colors.darkGray, textAlign: 'center' },
  errorCard: { alignItems: 'center', paddingVertical: 40, gap: 10, backgroundColor: Colors.white, borderRadius: 16, padding: 24 },
  errorTitle: { fontSize: 16, fontFamily: 'Quicksand_700Bold', color: Colors.black },
  errorText: { fontSize: 14, fontFamily: 'Quicksand_500Medium', color: Colors.darkGray, textAlign: 'center' },
  retryBtn: { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12, marginTop: 4 },
  retryBtnText: { fontSize: 14, fontFamily: 'Quicksand_700Bold', color: Colors.white },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary + '15',
    borderRadius: 10,
    padding: 10,
  },
  dateText: { fontSize: 13, fontFamily: 'Quicksand_600SemiBold', color: Colors.primary },
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
  metricTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  metricIconBg: { width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  metricInfo: { flex: 1 },
  metricLabel: { fontSize: 13, fontFamily: 'Quicksand_500Medium', color: Colors.darkGray },
  metricBadge: { fontSize: 13, fontFamily: 'Quicksand_700Bold', marginTop: 2 },
  metricValue: { fontSize: 26, fontFamily: 'Quicksand_700Bold' },
  scaleRow: { gap: 5 },
  scaleItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scaleDot: { width: 10, height: 10, borderRadius: 5 },
  scaleRange: { fontSize: 12, fontFamily: 'Quicksand_500Medium', color: Colors.darkGray, width: 68 },
  scaleLabel: { fontSize: 12, fontFamily: 'Quicksand_700Bold' },
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
  recTitle: { fontSize: 15, fontFamily: 'Quicksand_700Bold', flex: 1 },
  recText: { fontSize: 14, fontFamily: 'Quicksand_500Medium', color: Colors.darkGray, lineHeight: 20 },
});