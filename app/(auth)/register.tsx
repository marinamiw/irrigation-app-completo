import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator, Alert, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/Colors';

const SOIL_IMAGES: Record<string, any> = {
  ARGILOSO: require('@/assets/images/soil_argiloso.png'),
  ARENOSO: require('@/assets/images/soil_arenoso.png'),
};

const HARVEST_IMAGES: Record<string, any> = {
  INICIAL: require('@/assets/images/harvest_inicial.png'),
  DESENVOLVIMENTO: require('@/assets/images/harvest_desenvolvimento.png'),
  MATURACAO: require('@/assets/images/harvest_maturacao.png'),
};
import { RegisterPayload } from '@/services/api';

type Gender = 'MASCULINO' | 'FEMININO' | 'OUTRO' | 'NAO_INFORMAR';
type SoilType = 'MEDIO' | 'ARGILOSO' | 'ARENOSO';
type HarvestPhase = 'INICIAL' | 'DESENVOLVIMENTO' | 'MATURACAO';

const GENDERS: { label: string; value: Gender }[] = [
  { label: 'Masculino', value: 'MASCULINO' },
  { label: 'Feminino', value: 'FEMININO' },
  { label: 'Outro', value: 'OUTRO' },
  { label: 'Prefiro não informar', value: 'NAO_INFORMAR' },
];

const SOIL_TYPES: { label: string; value: SoilType; desc: string }[] = [
  { label: 'Médio', value: 'MEDIO', desc: 'Solo equilibrado entre areia e argila' },
  { label: 'Argiloso', value: 'ARGILOSO', desc: 'Retém mais água e nutrientes' },
  { label: 'Arenoso', value: 'ARENOSO', desc: 'Drena rapidamente, precisa de mais irrigação' },
];

const HARVEST_PHASES: { label: string; value: HarvestPhase; desc: string }[] = [
  { label: 'Inicial', value: 'INICIAL', desc: 'Germinação e estabelecimento' },
  { label: 'Desenvolvimento', value: 'DESENVOLVIMENTO', desc: 'Crescimento vegetativo' },
  { label: 'Maturação', value: 'MATURACAO', desc: 'Formação e colheita dos frutos' },
];

export default function RegisterScreen() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [farmName, setFarmName] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [soilType, setSoilType] = useState<SoilType | null>(null);
  const [harvestPhase, setHarvestPhase] = useState<HarvestPhase | null>(null);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const router = useRouter();

  const validateStep1 = () => {
    if (!name.trim()) return 'Informe seu nome.';
    if (!email.trim()) return 'Informe seu email.';
    if (!password || password.length < 6) return 'Senha deve ter ao menos 6 caracteres.';
    if (!farmName.trim()) return 'Informe o nome da fazenda.';
    if (!gender) return 'Selecione o gênero.';
    return null;
  };

  const goNext = () => {
    if (step === 1) {
      const err = validateStep1();
      if (err) { Alert.alert('Atenção', err); return; }
    }
    if (step === 2 && !soilType) { Alert.alert('Atenção', 'Selecione o tipo de solo.'); return; }
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    if (!harvestPhase) { Alert.alert('Atenção', 'Selecione a fase da colheita.'); return; }
    setLoading(true);
    try {
      const payload: RegisterPayload = {
        name: name.trim(),
        email: email.trim(),
        password,
        farmName: farmName.trim(),
        gender: gender!,
        soilType: soilType!,
        harvestPhase,
      };
      await register(payload);
      router.replace('/(tabs)/');
    } catch (e: any) {
      Alert.alert('Erro', e.message ?? 'Falha no cadastro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          {step > 1 ? (
            <TouchableOpacity onPress={() => setStep(s => s - 1)} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={Colors.black} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={Colors.black} />
            </TouchableOpacity>
          )}
          <Text style={styles.stepIndicator}>Passo {step} de 3</Text>
        </View>

        <Text style={styles.title}>
          {step === 1 ? 'Olá, produtor!' : step === 2 ? 'Tipo de solo' : 'Fase da colheita'}
        </Text>
        <Text style={styles.subtitle}>
          {step === 1 ? 'Vamos começar seu cadastro' : step === 2 ? 'Selecione o tipo de solo da sua fazenda' : 'Selecione a fase atual da sua plantação'}
        </Text>

        {/* Step 1 */}
        {step === 1 && (
          <View style={styles.fields}>
            <InputField label="Nome completo" value={name} onChangeText={setName} placeholder="Seu nome" />
            <InputField label="Email" value={email} onChangeText={setEmail} placeholder="seu@email.com" keyboardType="email-address" autoCapitalize="none" />
            <View>
              <Text style={styles.fieldLabel}>Senha</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor={Colors.mediumGray}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(v => !v)}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.mediumGray} />
                </TouchableOpacity>
              </View>
            </View>
            <InputField label="Nome da fazenda" value={farmName} onChangeText={setFarmName} placeholder="Ex: Fazenda São João" />
            <View>
              <Text style={styles.fieldLabel}>Gênero</Text>
              <View style={styles.optionGrid}>
                {GENDERS.map(g => (
                  <TouchableOpacity
                    key={g.value}
                    style={[styles.genderOption, gender === g.value && styles.genderOptionActive]}
                    onPress={() => setGender(g.value)}
                  >
                    <Text style={[styles.genderOptionText, gender === g.value && styles.genderOptionTextActive]}>
                      {g.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <View style={styles.fields}>
            {SOIL_TYPES.map(s => (
              <TouchableOpacity
                key={s.value}
                style={[styles.selectionCard, soilType === s.value && styles.selectionCardActive]}
                onPress={() => setSoilType(s.value)}
              >
                <View style={styles.radioOuter}>
                  {soilType === s.value && <View style={styles.radioInner} />}
                </View>
                <View style={styles.selectionInfo}>
                  <Text style={[styles.selectionLabel, soilType === s.value && styles.selectionLabelActive]}>
                    {s.label}
                  </Text>
                  <Text style={styles.selectionDesc}>{s.desc}</Text>
                </View>
                {SOIL_IMAGES[s.value] && (
                  <Image source={SOIL_IMAGES[s.value]} style={styles.selectionImage} resizeMode="cover" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <View style={styles.fields}>
            {HARVEST_PHASES.map(h => (
              <TouchableOpacity
                key={h.value}
                style={[styles.selectionCard, harvestPhase === h.value && styles.selectionCardActive]}
                onPress={() => setHarvestPhase(h.value)}
              >
                <View style={styles.radioOuter}>
                  {harvestPhase === h.value && <View style={styles.radioInner} />}
                </View>
                <View style={styles.selectionInfo}>
                  <Text style={[styles.selectionLabel, harvestPhase === h.value && styles.selectionLabelActive]}>
                    {h.label}
                  </Text>
                  <Text style={styles.selectionDesc}>{h.desc}</Text>
                </View>
                {HARVEST_IMAGES[h.value] && (
                  <Image source={HARVEST_IMAGES[h.value]} style={styles.selectionImage} resizeMode="contain" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.nextBtn}
          onPress={step < 3 ? goNext : handleSubmit}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={Colors.white} />
            : <Text style={styles.nextBtnText}>{step < 3 ? 'Próximo passo' : 'Finalizar'}</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function InputField({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput style={styles.input} placeholderTextColor={Colors.mediumGray} {...props} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.white },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 12 },
  backBtn: { padding: 4 },
  stepIndicator: { fontSize: 16, fontFamily: 'Quicksand_600SemiBold', color: Colors.black },
  title: { fontSize: 32, fontFamily: 'Quicksand_700Bold', color: Colors.black, marginBottom: 4 },
  subtitle: { fontSize: 20, fontFamily: 'Quicksand_500Medium', color: Colors.darkGray, marginBottom: 28 },
  fields: { gap: 14, marginBottom: 28 },
  fieldLabel: { fontSize: 14, fontFamily: 'Quicksand_600SemiBold', color: Colors.black, marginBottom: 6 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.mediumGray,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 50,
    backgroundColor: Colors.lightGray,
  },
  input: { flex: 1, fontSize: 15, fontFamily: 'Quicksand_500Medium', color: Colors.black },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  genderOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.mediumGray,
    backgroundColor: Colors.lightGray,
  },
  genderOptionActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  genderOptionText: { fontSize: 13, fontFamily: 'Quicksand_600SemiBold', color: Colors.darkGray },
  genderOptionTextActive: { color: Colors.white },
  selectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.mediumGray,
    borderRadius: 12,
    backgroundColor: Colors.lightGray,
    gap: 14,
  },
  selectionCardActive: { borderColor: Colors.primary, backgroundColor: 'rgba(8,103,144,0.06)' },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.primary },
  selectionInfo: { flex: 1 },
  selectionLabel: { fontSize: 16, fontFamily: 'Quicksand_700Bold', color: Colors.black },
  selectionLabelActive: { color: Colors.primary },
  selectionDesc: { fontSize: 13, fontFamily: 'Quicksand_400Regular', color: Colors.darkGray, marginTop: 2 },
  selectionImage: { width: 60, height: 60, borderRadius: 8 },
  nextBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: { fontSize: 16, fontFamily: 'Quicksand_700Bold', color: Colors.white },
});
