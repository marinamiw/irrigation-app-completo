# Plano de Melhorias — CLIMORA

## Bugs corrigidos nesta sessão

| Bug | Causa | Correção |
|-----|-------|----------|
| "missing loc, input null" ao alterar fase da colheita | Backend esperava `harvestPhase` como query param na URL, frontend mandava no body JSON | Backend agora aceita body via Pydantic model |
| Perfil não atualizava após salvar fase | `AuthContext` não recarregava o usuário | Adicionado `refreshUser()` chamado após salvar |
| Loading infinito no Android | `getCurrentPositionAsync` sem timeout + sem fallback | Timeout de 10s + fallback para Brasília |
| NASA bloqueava event loop | Código síncrono dentro de handler `async def` | `asyncio.to_thread` para rodar a chamada em thread separada |
| CORS bloqueava dispositivos físicos e web | Lista de origens fixas só com localhost | `allow_origins=["*"]` em dev |

---

## Como testar no navegador (melhor opção agora)

O emulador Android não tem GPS real. O **navegador** tem geolocalização nativa via `navigator.geolocation` e já está tratada no código.

```bash
# Na pasta irrigation-app-mobile
npx expo start --web
```

Abre `http://localhost:8081` no Chrome → aceita permissão de localização → dados climáticos da sua localização real via NASA.

---

## Melhorias prioritárias para ganhar o prêmio

### 1. Recomendação de irrigação inteligente por tipo de solo (ALTA PRIORIDADE)

**Problema atual:** A recomendação ignora completamente o `soilType` do usuário, que já está salvo no banco. Um solo arenoso perde água muito mais rápido que um argiloso.

**O que fazer no backend** (`service.py` → `gerar_recomendacao`):

```python
def gerar_recomendacao(self, dados, soil_type: str = "MEDIO"):
    precip = dados["precipitacao_total"]
    umid = dados["umidade_media"]

    # Limiares por tipo de solo
    thresholds = {
        "ARENOSO":  {"precip_min": 3,  "umid_min": 50},
        "MEDIO":    {"precip_min": 2,  "umid_min": 60},
        "ARGILOSO": {"precip_min": 1,  "umid_min": 70},
    }
    t = thresholds.get(soil_type, thresholds["MEDIO"])

    if precip < t["precip_min"] and umid < t["umid_min"]:
        return "Recomenda-se irrigar hoje."
    elif precip > 10:
        return "Chuva intensa registrada. Irrigação não necessária."
    else:
        return "Solo ainda úmido. Acompanhar nos próximos dias."
```

**No controller**, passar `soilType` do usuário autenticado para a recomendação:
```python
result = await asyncio.to_thread(
    service.consulta_clima_e_recomendacao,
    req.latitude, req.longitude,
    current_user.soilType or "MEDIO"
)
```

**Impacto:** transforma o app de genérico para verdadeiramente personalizado — argumento forte para a apresentação.

---

### 2. Cache das respostas da NASA (ALTA PRIORIDADE — performance)

**Problema atual:** Cada vez que o usuário abre o app, o backend faz até 11 chamadas HTTP à NASA. Os dados mudam no máximo 1x por dia.

**Solução simples no backend** — cache em memória com TTL de 6 horas:

```python
from datetime import datetime, timedelta

_nasa_cache: dict = {}  # chave: (lat_round, lon_round, data)

def get_nasa_power_hourly(self, lat, lon):
    lat_r = round(lat, 2)
    lon_r = round(lon, 2)
    cache_key = (lat_r, lon_r)
    
    if cache_key in _nasa_cache:
        cached_at, result = _nasa_cache[cache_key]
        if datetime.now() - cached_at < timedelta(hours=6):
            return result
    
    result = self._fetch_nasa(lat_r, lon_r)  # lógica atual
    _nasa_cache[cache_key] = (datetime.now(), result)
    return result
```

**Impacto:** primeira chamada demora ~5s, todas as seguintes são instantâneas.

---

### 3. Uma única chamada à NASA com intervalo de datas (performance)

**Problema atual:** O loop testa dias 5 a 15 um por um — 11 chamadas HTTP separadas no pior caso (220 segundos).

**Solução:** Uma única chamada buscando os últimos 10 dias, e pegar o mais recente com dados válidos:

```python
data_fim = (datetime.now() - timedelta(days=3)).strftime("%Y%m%d")
data_inicio = (datetime.now() - timedelta(days=15)).strftime("%Y%m%d")

params = {
    "parameters": "T2M,PRECTOTCORR,RH2M",
    "community": "AG",
    "longitude": lon,
    "latitude": lat,
    "start": data_inicio,
    "end": data_fim,
    "format": "JSON"
}
response = requests.get(url, params=params, timeout=30)
# Percorre os dias do mais recente para o mais antigo
# e retorna o primeiro com dados válidos
```

**Impacto:** tempo de resposta cai de até 220s para ~5-10s.

---

### 4. Localização real no mobile — fluxo completo

**Como deve funcionar:**
1. App pede permissão de localização
2. Se concedida → usa GPS real → dados climáticos da localização exata
3. Se negada → mostra um input para o usuário digitar a cidade/CEP, ou pede para ativar a localização
4. Se GPS demorar mais de 10s → usa `getLastKnownPositionAsync` (última posição conhecida) antes de desistir

**O que adicionar** em `utils/location.ts`:

```typescript
// Tenta última posição conhecida primeiro (muito mais rápido)
const last = await Location.getLastKnownPositionAsync();
if (last) return { latitude: last.coords.latitude, longitude: last.coords.longitude };

// Só então tenta posição atual com timeout
```

**Para o app ficar completo:** quando usar fallback, mostrar um aviso no card: _"Usando localização aproximada. Ative o GPS para dados precisos."_

---

### 5. UX — mostrar data dos dados e localização usada

**Home e Irrigação:** hoje não mostram de quando são os dados. O usuário não sabe se estão atualizados.

Adicionar no card climático:
```
Dados de 5 dias atrás · Jabotiana, Aracaju
```

Isso também educa o usuário sobre o atraso da NASA e aumenta a confiança nos dados.

---

### 6. Tela de irrigação — recomendação com base na fase da colheita

**Problema:** a fase da colheita (Inicial / Desenvolvimento / Maturação) está salva mas nunca é usada.

**Sugestão:** ajustar a mensagem de recomendação conforme a fase:
- **Inicial:** priorize umidade do solo, raízes estão se formando
- **Desenvolvimento:** acompanhe temperatura e precipitação
- **Maturação:** evite excesso de água, pode prejudicar a colheita

Isso torna o app único e demonstra valor real para agricultores.

---

### 7. Múltiplas fazendas / localizações salvas

Atualmente o usuário tem apenas uma fazenda. Para um app completo:
- Permitir salvar múltiplas propriedades com nomes e coordenadas
- Alternar entre elas na home
- Dados climáticos específicos por propriedade

---

### 8. Histórico climático (Calendário Térmico)

O calendário atual mostra apenas um dia. Melhorar para:
- Buscar os últimos 7-14 dias da NASA (já dá para fazer com intervalo de datas)
- Colorir cada dia no calendário com a temperatura daquele dia
- Mostrar linha do tempo de precipitação

---

### 9. Notificações push

Quando chegar a hora de irrigar (baseado no timer da tela de irrigação), enviar notificação. Usa `expo-notifications` — já está no ecossistema Expo.

---

### 10. Testes e validação dos endpoints

Endpoints funcionando atualmente:
- `POST /auth/register` ✅
- `POST /auth/login` ✅
- `GET /auth/me` ✅
- `GET /fazendeiro/me` ✅
- `PUT /fazendeiro/me/update-harvest-phase` ✅ (corrigido)
- `PUT /fazendeiro/me/change-password` ✅
- `POST /fazendeiro/irrigacao/registrar` ✅
- `GET /fazendeiro/irrigacao/historico` ✅
- `POST /fazendeiro/irrigacao/recomendacao` ✅ (corrigido — agora não bloqueia event loop)

Pendente / a validar:
- `PUT /{user_id}/soil-harvest` — endpoint genérico por ID, mas o front não usa. Poderia ser `PUT /me/soil-harvest` para consistência.
- Atualizar `soilType` pelo app (atualmente só é definido no cadastro)

---

## Ordem de implementação sugerida

```
Semana 1 — Bugs e fundação
  ✅ Bug harvest phase
  ✅ CORS
  ✅ Event loop bloqueado
  ✅ Location timeout + fallback
  → Otimizar NASA (1 chamada + cache)
  → Recomendação por tipo de solo

Semana 2 — Valor para o prêmio
  → Mostrar data e localização no card climático
  → Recomendação por fase da colheita
  → Calendário com múltiplos dias
  → Input de localização manual se GPS negado

Semana 3 — Polimento
  → Notificações push
  → Múltiplas fazendas
  → Tela de onboarding explicando o atraso da NASA
```

---

## Para rodar agora (sem emulador)

```bash
# Terminal 1 — Backend
cd irrigation-app-nasa-data
.\venv\Scripts\uvicorn.exe app.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 — Frontend web
cd irrigation-app-mobile
npx expo start --web
```

Acesse `http://localhost:8081` no Chrome. O GPS funciona no navegador nativamente.
