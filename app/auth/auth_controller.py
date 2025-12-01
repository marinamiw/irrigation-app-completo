from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .auth_service import AuthService
from .auth_schemas import LoginRequest, RegisterRequest, AuthResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["Autenticação"])
security = HTTPBearer()

@router.post("/register", response_model=AuthResponse, status_code=201)
async def register(user_data: RegisterRequest):
    """Registra um novo fazendeiro/usuário no sistema."""
    try:
        async with AuthService() as auth_service:
            result = await auth_service.register(user_data)
            return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

@router.post("/login", response_model=AuthResponse)
async def login(login_data: LoginRequest):
    """Autentica um usuário e retorna um token de acesso."""
    try:
        async with AuthService() as auth_service:
            result = await auth_service.login(login_data)
            return result
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

@router.get("/me", response_model=UserResponse)
async def get_me(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Retorna os dados do usuário autenticado."""
    try:
        async with AuthService() as auth_service:
            user = await auth_service.get_current_user(credentials.credentials)
            if not user:
                raise HTTPException(
                    status_code=401,
                    detail="Token inválido ou expirado"
                )
            return user
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Erro interno do servidor")