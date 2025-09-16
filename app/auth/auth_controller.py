# auth/auth_controller.py

from fastapi import APIRouter, HTTPException, Depends
from .auth_service import AuthService
from .auth_schemas import LoginRequest, RegisterRequest, AuthResponse, UserResponse
from .auth_middleware import require_auth

router = APIRouter(prefix="/auth", tags=["Autenticação"])

@router.post("/register", response_model=AuthResponse, status_code=201)
async def register(user_data: RegisterRequest):
    """Registra um novo fazendeiro/usuário no sistema."""
    try:
        async with AuthService() as auth_service:
            result = await auth_service.register(user_data)
            return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Ocorreu um erro interno ao registrar o usuário.")

@router.post("/login", response_model=AuthResponse)
async def login(login_data: LoginRequest):
    """Autentica um usuário e retorna um token de acesso."""
    try:
        async with AuthService() as auth_service:
            result = await auth_service.login(login_data)
            return result
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Ocorreu um erro interno ao tentar fazer login.")

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: UserResponse = require_auth()):
    """Retorna os dados do usuário autenticado."""
    return current_user