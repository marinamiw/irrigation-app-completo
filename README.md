# Climonasa — Monorepo (Mobile + Backend)

Repositorio unificado que reune o aplicativo mobile e a API do projeto Climonasa
(irrigacao inteligente com dados da NASA POWER).

## Estrutura

```
.
├── mobile/    App React Native (Expo Router + TypeScript)
└── backend/   API FastAPI (Python) + Prisma + integracao NASA POWER
```

## Origem

Este repo foi montado a partir de dois repositorios independentes, com o
historico de commits de ambos preservado:

- `mobile/`  → https://github.com/marinamiw/irrigation-app-mobile
- `backend/` → https://github.com/marinamiw/irrigation-app-nasa-data

## Como rodar

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

### Mobile
```bash
cd mobile
npm install
cp .env.example .env
npx expo start
```
