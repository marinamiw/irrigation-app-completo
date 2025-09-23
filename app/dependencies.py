from prisma import Prisma


db = Prisma()


# --- Provedores de Dependência (Providers) ---
def get_db() -> Prisma:
    return db

# Se precisar de AuthService como dependência, importe e instancie aqui
# from app.auth.auth_service import AuthService
# auth_service = AuthService()
# def get_auth_service() -> AuthService:
#     return auth_service