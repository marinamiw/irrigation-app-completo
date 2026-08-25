# CLIMONASA — Apresentação de Iniciação Científica

---

## PITCH CURTO (30–60 segundos)

> **"CLIMONASA é um aplicativo móvel que usa dados reais de satélite da NASA para recomendar ao agricultor se ele deve ou não irrigar sua plantação hoje — levando em conta o tipo de solo, a fase da colheita e as condições climáticas reais da sua localização."**

O app capta a localização do usuário, consulta a base de dados climáticos da NASA (temperatura, precipitação e umidade dos últimos dias) e gera uma recomendação personalizada. O agricultor também registra quanto irrigou, formando um histórico que pode orientar decisões futuras.

---

## EXPLICAÇÃO DETALHADA

### O Problema

Pequenos e médios agricultores frequentemente irrigam sem critério técnico — por estimativa ou hábito. Isso gera dois problemas graves:

- **Desperdício de água** em dias que já tiveram chuva ou solo úmido
- **Irrigação insuficiente** em fases críticas da lavoura, comprometendo a colheita

O acesso a sistemas de monitoramento climático profissional é caro e complexo para a agricultura familiar.

---

### A Solução: CLIMONASA

CLIMONASA é um aplicativo gratuito para Android que democratiza o acesso a dados climáticos de qualidade e traduz esses dados em recomendações simples e acionáveis para o agricultor.

---

### Como Funciona

```
[Localização do usuário]
        ↓
[API NASA POWER — dados de satélite]
        ↓
[Algoritmo de recomendação]
   (considera solo + fase da colheita)
        ↓
[Recomendação personalizada no app]
        ↓
[Registro do histórico de irrigação]
```

**1. Coleta de localização**
O app detecta automaticamente a localização GPS do agricultor para buscar os dados climáticos corretos da região.

**2. Dados da NASA POWER**
Utiliza a API pública NASA POWER (Power Access Resources), que fornece dados meteorológicos derivados de observações de satélite. Os dados incluem:
- Temperatura média (°C)
- Precipitação acumulada (mm)
- Umidade relativa do ar (%)

> Os dados têm um atraso de ~1–3 dias (tempo de processamento do satélite), mas são baseados em medições reais — não previsões.

**3. Recomendação Personalizada**
O algoritmo cruza os dados climáticos com o perfil da plantação cadastrado pelo usuário:

| Tipo de Solo | Limiar de precipitação | Limiar de umidade |
|---|---|---|
| Arenoso | > 3 mm dispensa irrigação | > 50% umidade |
| Médio | > 2 mm dispensa irrigação | > 60% umidade |
| Argiloso | > 1 mm dispensa irrigação | > 70% umidade |

A fase da colheita (Inicial, Desenvolvimento, Maturação) ajusta a mensagem para orientar melhor o agricultor em cada etapa.

**Exemplos de recomendação:**
- *"Chuva intensa registrada. Irrigação não necessária."*
- *"Recomenda-se irrigar hoje. Raízes em formação precisam de umidade constante."*
- *"Solo ainda úmido. Acompanhar nos próximos dias."*
- *"Recomenda-se irrigar com moderação. Solo seco na fase de maturação pode prejudicar a colheita."*

**4. Registro de Irrigação**
O agricultor registra cada irrigação com a quantidade em litros. O histórico fica salvo no sistema, permitindo acompanhar o consumo de água ao longo do tempo.

---

### Tecnologias Utilizadas

| Camada | Tecnologia |
|---|---|
| App Mobile | React Native + Expo (Android/iOS) |
| Backend | Python + FastAPI |
| Banco de Dados | PostgreSQL (via Prisma ORM) |
| Dados Climáticos | NASA POWER API (satélite) |
| Deploy Backend | Railway (nuvem) |
| Build do App | EAS Build (Expo Application Services) |

---

### Arquitetura do Sistema

```
┌─────────────────────┐         ┌──────────────────────────┐
│   App Android/iOS   │ ──────► │  Backend FastAPI (nuvem) │
│   (React Native)    │ ◄────── │  Railway.app             │
└─────────────────────┘         └──────────┬───────────────┘
                                            │
                          ┌─────────────────┼────────────────┐
                          │                 │                │
                   ┌──────▼──────┐  ┌───────▼──────┐        │
                   │ PostgreSQL  │  │  NASA POWER  │        │
                   │ (Railway)   │  │  API         │        │
                   └─────────────┘  └──────────────┘        │
```

---

### Diferenciais

- **Gratuito e acessível**: basta baixar o APK e cadastrar
- **Dados reais de satélite**: não usa médias históricas nem previsões imprecisas
- **Personalizado**: considera o tipo de solo e a fase da lavoura de cada agricultor
- **Sem equipamentos**: não exige sensores físicos no campo
- **Funciona em qualquer lugar**: enquanto houver dados NASA para a região

---

### Resultados e Estado Atual

- App funcional com cadastro, login e perfil do agricultor
- Recomendação climática em tempo real via NASA
- Registro e histórico de irrigações com quantidade em litros
- APK disponível para instalação em Android
- Backend em produção na nuvem (Railway)

---

### Próximos Passos

- Integrar previsão do tempo para recomendações proativas (dia atual)
- Histórico gráfico de irrigação e clima
- Suporte a múltiplas culturas e talhões
- Publicação na Google Play Store
- Estudo de impacto com agricultores reais (economia de água)

---

### Referências

- NASA POWER Project: [power.larc.nasa.gov](https://power.larc.nasa.gov)
- Expo / React Native: [expo.dev](https://expo.dev)
- FastAPI: [fastapi.tiangolo.com](https://fastapi.tiangolo.com)

---

*Projeto de Iniciação Científica — CLIMONASA*
*Recomendação de Irrigação com Dados Climáticos de Satélite*
