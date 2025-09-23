from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from prisma import Prisma
from app.dependencies import get_db
from .auth_service import AuthService
from .auth_schemas import UserResponse

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Prisma = Depends(get_db)
) -> UserResponse:
    """
    Dependência para obter o usuário atual a partir do token Bearer.
    Pode ser usada para proteger rotas.
    """
    token = credentials.credentials
    auth_service = AuthService(db)
    user = await auth_service.get_current_user(token)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Token inválido ou expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

# Função auxiliar para facilitar a injeção de dependência nas rotas
def require_auth():
    return Depends(get_current_user)