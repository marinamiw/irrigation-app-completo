from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .auth_service import AuthService
from .auth_schemas import UserResponse
from app.dependencies import get_db
from prisma import Prisma

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Prisma = Depends(get_db)
) -> UserResponse:
    """Middleware para obter o usuário atual e verificar autenticação"""
    try:
        # Passa a instância do Prisma existente para o AuthService
        auth_service = AuthService(prisma=db)
        user = await auth_service.get_current_user(credentials.credentials)
        
        if not user:
            raise HTTPException(
                status_code=401,
                detail="Token inválido ou expirado",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERRO NO MIDDLEWARE: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=401,
            detail="Token inválido ou expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )

def require_auth():
    """Decorator para rotas que requerem autenticação"""
    return Depends(get_current_user)