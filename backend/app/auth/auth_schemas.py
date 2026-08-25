from pydantic import BaseModel, EmailStr
from typing import Optional
from enum import Enum

class SoilType(str, Enum):
    MEDIO = "MEDIO"
    ARGILOSO = "ARGILOSO"
    ARENOSO = "ARENOSO"

class HarvestPhase(str, Enum):
    INICIAL = "INICIAL"
    DESENVOLVIMENTO = "DESENVOLVIMENTO"
    MATURACAO = "MATURACAO"

class Gender(str, Enum):
    MASCULINO = "MASCULINO"
    FEMININO = "FEMININO"
    OUTRO = "OUTRO"
    NAO_INFORMAR = "NAO_INFORMAR"

class LoginRequest(BaseModel):
    """Schema para requisição de login"""
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    """Schema para requisição de registro"""
    name: str
    farmName: str
    gender: Gender
    email: EmailStr
    password: str
    soilType: SoilType
    harvestPhase: HarvestPhase

class TokenResponse(BaseModel):
    """Schema para resposta de token JWT"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int

class UserResponse(BaseModel):
    """Schema para dados públicos do usuário"""
    id: int
    name: str
    email: str
    farmName: str
    gender: Gender
    soilType: Optional[SoilType] = None
    harvestPhase: Optional[HarvestPhase] = None
    
    class Config:
        from_attributes = True

class AuthResponse(BaseModel):
    """Schema completo para resposta de autenticação"""
    user: UserResponse
    token: TokenResponse