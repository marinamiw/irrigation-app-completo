# Smart Irrigation NASA

Sistema de recomendação de irrigação para produtores rurais baseado em dados climáticos da NASA POWER API.

## Descrição

Esta API REST fornece funcionalidades para:
- Cadastro e autenticação de fazendeiros
- Gestão de perfil e configurações de cultivo
- Registro de irrigações
- Recomendações de irrigação baseadas em dados climáticos em tempo real
- Histórico de irrigações

## Requisitos

- Python 3.8 ou superior
- PostgreSQL 12 ou superior
- pip (gerenciador de pacotes Python)

## Instalação

### 1. Clonar o repositório

```bash
git clone <url-do-repositorio>
cd irrigation-app-nasa-data
```

### 2. Criar ambiente virtual

```bash
python -m venv venv
```

### 3. Ativar ambiente virtual

**Linux/MacOS:**
```bash
source venv/bin/activate
```

**Windows:**
```bash
venv\Scripts\activate
```

### 4. Instalar dependências

```bash
pip install -r requirements.txt
pip install prisma
```

### 5. Configurar banco de dados

Crie um banco de dados PostgreSQL:

```sql
CREATE DATABASE irrigation;
```

Crie o arquivo `.env` na raiz do projeto:

```
DATABASE_URL="postgresql://usuario:senha@localhost:5432/irrigation"
SECRET_KEY="sua-chave-secreta-segura-aqui"
```

**Importante:** Substitua `usuario` e `senha` pelas credenciais do seu PostgreSQL.

### 6. Executar migrações do banco de dados

```bash
prisma migrate deploy
prisma generate
```

### 7. Iniciar servidor

```bash
uvicorn app.main:app --reload
```

O servidor estará disponível em `http://localhost:8000`

## Documentação da API

Acesse a documentação interativa em:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Estrutura do Projeto

```
irrigation-app-nasa-data/
├── app/
│   ├── auth/              # Módulo de autenticação
│   ├── fazendeiro/        # Módulo de gestão de fazendeiros
│   ├── config.py          # Configurações da aplicação
│   ├── dependencies.py    # Dependências compartilhadas
│   └── main.py           # Ponto de entrada da aplicação
├── prisma/
│   ├── schema.prisma     # Schema do banco de dados
│   └── migrations/       # Migrações do banco
├── .env                  # Variáveis de ambiente (não versionado)
├── requirements.txt      # Dependências Python
└── README.md
```

## Endpoints Principais

### Autenticação

- `POST /auth/register` - Registro de novo usuário
- `POST /auth/login` - Login e obtenção de token JWT
- `GET /auth/me` - Dados do usuário autenticado

### Fazendeiro

- `GET /fazendeiro/me` - Perfil do fazendeiro autenticado
- `PUT /fazendeiro/me/update-harvest-phase` - Atualizar fase da colheita
- `PUT /fazendeiro/me/change-password` - Alterar senha

### Irrigação

- `POST /fazendeiro/irrigacao/registrar` - Registrar irrigação
- `GET /fazendeiro/irrigacao/historico` - Histórico de irrigações
- `POST /fazendeiro/irrigacao/recomendacao` - Obter recomendação baseada em dados climáticos

## Tecnologias Utilizadas

- **FastAPI** - Framework web assíncrono
- **Prisma** - ORM para Python
- **PostgreSQL** - Banco de dados relacional
- **JWT** - Autenticação via tokens
- **bcrypt** - Hash de senhas
- **NASA POWER API** - Dados climáticos

## Variáveis de Ambiente

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| DATABASE_URL | URL de conexão com PostgreSQL | postgresql://user:pass@localhost:5432/dbname |
| SECRET_KEY | Chave secreta para JWT | string-aleatoria-segura |

## Desenvolvimento

### Executar em modo de desenvolvimento

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Criar nova migração

```bash
prisma migrate dev --name nome_da_migracao
```

### Gerar cliente Prisma após alterações no schema

```bash
prisma generate
```

## Segurança

- Senhas são armazenadas com hash bcrypt
- Autenticação via JWT com expiração configurável
- Tokens são validados em todas as rotas protegidas
- Nunca versione o arquivo `.env`

## Solução de Problemas

### Erro ao conectar no banco de dados

Verifique se:
- O PostgreSQL está rodando
- As credenciais no `.env` estão corretas
- O banco de dados existe

### Erro ao executar migrações

```bash
prisma migrate reset
prisma migrate deploy
prisma generate
```

### Erro de importação do Prisma

```bash
pip uninstall prisma
pip install prisma
prisma generate
```

## Licença

Este projeto é proprietário e confidencial.