import jwt
import bcrypt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from prisma import Prisma
from .auth_schemas import LoginRequest, RegisterRequest, TokenResponse, UserResponse, AuthResponse
from app.config import settings

class AuthService:
    """Serviço de autenticação com JWT"""
    
    def __init__(self, prisma: Prisma = None):
        self.prisma = prisma
        self._owns_connection = prisma is None
        if self._owns_connection:
            self.prisma = Prisma()
        self.secret_key = settings.SECRET_KEY
        self.algorithm = settings.JWT_ALGORITHM
        self.access_token_expire_minutes = settings.JWT_EXPIRE_MINUTES
    
    async def __aenter__(self):
        """Conecta ao banco de dados ao entrar no contexto"""
        if self._owns_connection:
            await self.prisma.connect()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Desconecta do banco de dados ao sair do contexto"""
        if self._owns_connection:
            await self.prisma.disconnect()
    
    def _hash_password(self, password: str) -> str:
        """Gera hash da senha usando bcrypt"""
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    def _verify_password(self, password: str, hashed_password: str) -> bool:
        """Verifica se a senha está correta"""
        return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
    
    def _create_access_token(self, data: Dict[str, Any]) -> tuple[str, int]:
        """Cria um token JWT com expiração"""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
        to_encode.update({"exp": int(expire.timestamp())})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        expires_in_seconds = self.access_token_expire_minutes * 60
        return encoded_jwt, expires_in_seconds
    
    def _verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verifica e decodifica um token JWT"""
        try:
            print(f"Verificando token: {token[:20]}...")
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            print(f"Payload decodificado: {payload}")
            return payload
        except jwt.ExpiredSignatureError as e:
            print(f"Token expirado: {e}")
            return None
        except jwt.InvalidTokenError as e:
            print(f"Token inválido: {e}")
            return None
        except Exception as e:
            print(f"Erro ao verificar token: {type(e).__name__}: {e}")
            return None
    
    async def register(self, user_data: RegisterRequest) -> AuthResponse:
        """Registra um novo fazendeiro"""
        existing_user = await self.prisma.user.find_unique(
            where={"email": user_data.email}
        )
        
        if existing_user:
            raise ValueError("O email fornecido já está em uso")
        
        hashed_password = self._hash_password(user_data.password)
        
        new_user = await self.prisma.user.create(
            data={
                "name": user_data.name,
                "farmName": user_data.farmName,
                "gender": user_data.gender.value,
                "email": user_data.email,
                "passwordHash": hashed_password,
                "soilType": user_data.soilType.value,
                "harvestPhase": user_data.harvestPhase.value
            }
        )
        
        token_data = {"sub": str(new_user.id), "email": new_user.email}
        access_token, expires_in = self._create_access_token(token_data)
        
        user_response = UserResponse.model_validate(new_user)
        token_response = TokenResponse(
            access_token=access_token,
            expires_in=expires_in
        )
        
        return AuthResponse(user=user_response, token=token_response)
    
    async def login(self, login_data: LoginRequest) -> AuthResponse:
        """Autentica um fazendeiro"""
        user = await self.prisma.user.find_unique(
            where={"email": login_data.email}
        )
        
        if not user:
            raise ValueError("Email ou senha incorretos")
        
        if not self._verify_password(login_data.password, user.passwordHash):
            raise ValueError("Email ou senha incorretos")
        
        token_data = {"sub": str(user.id), "email": user.email}
        access_token, expires_in = self._create_access_token(token_data)
        
        user_response = UserResponse.model_validate(user)
        token_response = TokenResponse(
            access_token=access_token,
            expires_in=expires_in
        )
        
        return AuthResponse(user=user_response, token=token_response)
    
    async def get_current_user(self, token: str) -> Optional[UserResponse]:
        """Obtém o usuário atual baseado no token"""
        payload = self._verify_token(token)
        if not payload or "sub" not in payload:
            return None
        
        user_id = int(payload.get("sub"))
        user = await self.prisma.user.find_unique(where={"id": user_id})
        
        if not user:
            return None
        
        return UserResponse.model_validate(user)