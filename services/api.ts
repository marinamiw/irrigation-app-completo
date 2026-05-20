import * as SecureStore from 'expo-secure-store';
import { API_URL } from '@/constants/Api';

const TOKEN_KEY = 'climora_token';

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function removeToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  authenticated = true
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (authenticated) {
    const token = await getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Erro desconhecido' }));
    throw new Error(
      typeof error.detail === 'string' ? error.detail : JSON.stringify(error.detail)
    );
  }

  return res.json() as Promise<T>;
}

// Auth
export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  farmName: string;
  gender: 'MASCULINO' | 'FEMININO' | 'OUTRO' | 'NAO_INFORMAR';
  soilType: 'MEDIO' | 'ARGILOSO' | 'ARENOSO';
  harvestPhase: 'INICIAL' | 'DESENVOLVIMENTO' | 'MATURACAO';
}

export interface AuthResponse {
  user: UserProfile;
  token: { access_token: string; token_type: string; expires_in: number };
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  farmName: string;
  gender: string;
  soilType: string | null;
  harvestPhase: string | null;
}

export const authApi = {
  register: (payload: RegisterPayload) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(payload) }, false),

  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }, false),

  me: () => request<UserProfile>('/auth/me'),
};

// Fazendeiro
export interface IrrigacaoClimaResponse {
  temperatura_media: number;
  precipitacao_total: number;
  umidade_media: number;
  data: string;
  recomendacao: string;
}

export interface IrrigacaoRecord {
  id: string;
  userId: number;
  irrigatedAt: string;
}

export interface UpdateHarvestPhasePayload {
  harvestPhase: 'INICIAL' | 'DESENVOLVIMENTO' | 'MATURACAO';
}

export interface ChangePasswordPayload {
  old_password: string;
  new_password: string;
}

export const fazendeiroApi = {
  me: () => request<UserProfile>('/fazendeiro/me'),

  updateHarvestPhase: (payload: UpdateHarvestPhasePayload) =>
    request('/fazendeiro/me/update-harvest-phase', { method: 'PUT', body: JSON.stringify(payload) }),

  changePassword: (payload: ChangePasswordPayload) =>
    request('/fazendeiro/me/change-password', { method: 'PUT', body: JSON.stringify(payload) }),

  registrarIrrigacao: () =>
    request<IrrigacaoRecord>('/fazendeiro/irrigacao/registrar', { method: 'POST' }),

  historicoIrrigacao: () =>
    request<IrrigacaoRecord[]>('/fazendeiro/irrigacao/historico'),

  recomendacao: (latitude: number, longitude: number) =>
    request<IrrigacaoClimaResponse>('/fazendeiro/irrigacao/recomendacao', {
      method: 'POST',
      body: JSON.stringify({ latitude, longitude }),
    }),
};