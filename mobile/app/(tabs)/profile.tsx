import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, Modal, TextInput, ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { fazendeiroApi } from '@/services/api';
import ScreenBackground from '@/components/ScreenBackground';
import AppHeader from '@/components/AppHeader';

type HarvestPhase = 'INICIAL' | 'DESENVOLVIMENTO' | 'MATURACAO';

const HARVEST_PHASES: { label: string; value: HarvestPhase }[] = [
  { label: 'Inicial', value: 'INICIAL' },
  { label: 'Desenvolvimento', value: 'DESENVOLVIMENTO' },
  { label: 'Maturação', value: 'MATURACAO' },
];

const SOIL_LABELS: Record<string, string> = {
  MEDIO: 'Médio', ARGILOSO: 'Argiloso', ARENOSO: 'Arenoso',
};
const HARVEST_LABELS: Record<string, string> = {
  INICIAL: 'Inicial', DESENVOLVIMENTO: 'Desenvolvimento', MATURACAO: 'Maturação',
};
const GENDER_LABELS: Record<string, string> = {
  MASCULINO: 'Masculino', FEMININO: 'Feminino', OUTRO: 'Outro', NAO_INFORMAR: 'Não informado',
};

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const router = useRouter();

  const [showHarvestModal, setShowHarvestModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<HarvestPhase | null>(
    (user?.harvestPhase as HarvestPhase) ?? null
  );
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    const doLogout = async () => {
      await logout();
      router.replace('/(auth)/login' as any);
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Deseja realmente sair?')) await doLogout();
      return;
    }

    Alert.alert('Sair', 'Deseja realmente sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: doLogout },
    ]);
  };

  const handleUpdateHarvest = async () => {
    if (!selectedPhase) { Alert.alert('Atenção', 'Selecione uma fase.'); return; }
    setLoading(true);
    try {
      await fazendeiroApi.updateHarvestPhase({ harvestPhase: selectedPhase });
      await refreshUser();
      Alert.alert('Sucesso', 'Fase da colheita atualizada!');
      setShowHarvestModal(false);
    } catch (e: any) {
      Alert.alert('Erro', e.message ?? 'Falha ao atualizar.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) { Alert.alert('Atenção', 'Preencha todos os campos.'); return; }
    if (newPassword.length < 6) { Alert.alert('Atenção', 'Nova senha deve ter ao menos 6 caracteres.'); return; }
    setLoading(true);
    try {
      await fazendeiroApi.changePassword({ old_password: oldPassword, new_password: newPassword });
      Alert.alert('Sucesso', 'Senha alterada com sucesso!');
      setShowPasswordModal(false);
      setOldPassword(''); setNewPassword('');
    } catch (e: any) {
      Alert.alert('Erro', e.message ?? 'Falha ao alterar senha.');
    } finally {
      setLoading(false);
    }
  };

  const initial = user?.name?.[0]?.toUpperCase() ?? '?';

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <AppHeader />
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          {/* Profile card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarLargeText}>{initial}</Text>
            </View>
            <View>
              <Text style={styles.userName}>{user?.name}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
          </View>

          {/* Info section */}
          <View style={styles.infoCard}>
            <InfoRow label="Fazenda" value={user?.farmName ?? '-'} />
            <InfoRow label="Gênero" value={GENDER_LABELS[user?.gender ?? ''] ?? '-'} />
            <InfoRow label="Tipo de solo" value={SOIL_LABELS[user?.soilType ?? ''] ?? 'Não configurado'} />
            <InfoRow label="Fase da colheita" value={HARVEST_LABELS[user?.harvestPhase ?? ''] ?? 'Não configurado'} last />
          </View>

          {/* Actions */}
          <View style={styles.actionsCard}>
            <MenuRow
              icon="leaf-outline"
              label="Alterar fase da colheita"
              onPress={() => setShowHarvestModal(true)}
            />
            <MenuRow
              icon="lock-closed-outline"
              label="Alterar senha"
              onPress={() => setShowPasswordModal(true)}
            />
            <MenuRow
              icon="log-out-outline"
              label="Sair"
              onPress={handleLogout}
              danger
              last
            />
          </View>

          <View style={styles.bottomPad} />
        </ScrollView>
      </SafeAreaView>

      {/* Harvest phase modal */}
      <Modal visible={showHarvestModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Alterar fase da colheita</Text>
            {HARVEST_PHASES.map(h => (
              <TouchableOpacity
                key={h.value}
                style={[styles.phaseOption, selectedPhase === h.value && styles.phaseOptionActive]}
                onPress={() => setSelectedPhase(h.value)}
              >
                <View style={styles.radioOuter}>
                  {selectedPhase === h.value && <View style={styles.radioInner} />}
                </View>
                <Text style={[styles.phaseLabel, selectedPhase === h.value && styles.phaseLabelActive]}>
                  {h.label}
                </Text>
              </TouchableOpacity>
            ))}
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowHarvestModal(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateHarvest} disabled={loading}>
                {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveBtnText}>Salvar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Change password modal */}
      <Modal visible={showPasswordModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Alterar senha</Text>
            <View style={styles.passField}>
              <Text style={styles.passLabel}>Senha atual</Text>
              <TextInput
                style={styles.passInput}
                value={oldPassword}
                onChangeText={setOldPassword}
                secureTextEntry
                placeholder="Digite sua senha atual"
                placeholderTextColor={Colors.mediumGray}
              />
            </View>
            <View style={styles.passField}>
              <Text style={styles.passLabel}>Nova senha</Text>
              <TextInput
                style={styles.passInput}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={Colors.mediumGray}
              />
            </View>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowPasswordModal(false); setOldPassword(''); setNewPassword(''); }}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleChangePassword} disabled={loading}>
                {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveBtnText}>Salvar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenBackground>
  );
}

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowBorder]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function MenuRow({ icon, label, onPress, danger, last }: { icon: any; label: string; onPress: () => void; danger?: boolean; last?: boolean }) {
  return (
    <TouchableOpacity style={[styles.menuRow, !last && styles.menuRowBorder]} onPress={onPress}>
      <Ionicons name={icon} size={20} color={danger ? '#E53E3E' : Colors.primary} />
      <Text style={[styles.menuLabel, danger && { color: '#E53E3E' }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={danger ? '#E53E3E' : Colors.mediumGray} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 16, gap: 14 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  avatarLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLargeText: { fontSize: 24, fontFamily: 'Quicksand_700Bold', color: Colors.white },
  userName: { fontSize: 18, fontFamily: 'Quicksand_700Bold', color: Colors.black },
  userEmail: { fontSize: 13, fontFamily: 'Quicksand_500Medium', color: Colors.darkGray, marginTop: 2 },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingHorizontal: 16,
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  infoRow: { paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.lightGray },
  infoLabel: { fontSize: 14, fontFamily: 'Quicksand_500Medium', color: Colors.darkGray },
  infoValue: { fontSize: 14, fontFamily: 'Quicksand_700Bold', color: Colors.black },
  actionsCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingHorizontal: 16,
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, gap: 12 },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.lightGray },
  menuLabel: { flex: 1, fontSize: 16, fontFamily: 'Quicksand_600SemiBold', color: Colors.black },
  bottomPad: { height: 90 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: Colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, gap: 14 },
  modalTitle: { fontSize: 20, fontFamily: 'Quicksand_700Bold', color: Colors.black, marginBottom: 4 },
  phaseOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    borderRadius: 10, borderWidth: 1.5, borderColor: Colors.mediumGray,
    backgroundColor: Colors.lightGray,
  },
  phaseOptionActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  phaseLabel: { fontSize: 15, fontFamily: 'Quicksand_600SemiBold', color: Colors.black },
  phaseLabelActive: { color: Colors.primary },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: { flex: 1, borderRadius: 10, height: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: Colors.mediumGray },
  cancelBtnText: { fontSize: 15, fontFamily: 'Quicksand_600SemiBold', color: Colors.darkGray },
  saveBtn: { flex: 1, borderRadius: 10, height: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary },
  saveBtnText: { fontSize: 15, fontFamily: 'Quicksand_700Bold', color: Colors.white },
  passField: { gap: 6 },
  passLabel: { fontSize: 14, fontFamily: 'Quicksand_600SemiBold', color: Colors.black },
  passInput: {
    borderWidth: 1, borderColor: Colors.mediumGray, borderRadius: 10,
    paddingHorizontal: 14, height: 48, fontFamily: 'Quicksand_500Medium',
    fontSize: 14, color: Colors.black, backgroundColor: Colors.lightGray,
  },
});
