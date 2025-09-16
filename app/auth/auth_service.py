import jwt
import bcrypt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from prisma import Prisma
from .auth_schemas import LoginRequest, RegisterRequest, UserResponse, AuthResponse, TokenResponse

class AuthService:
    """Serviço de autenticação para o projeto agrícola"""
    
    def __init__(self):
        self.prisma = Prisma()
        # Supondo que você tenha um arquivo config.py com um objeto settings
        # from config import settings 
        # self.secret_key = settings.SECRET_KEY
        # self.algorithm = settings.JWT_ALGORITHM
        # self.access_token_expire_minutes = settings.JWT_EXPIRE_MINUTES
        
        # Valores de exemplo se não houver config.py
        self.secret_key = "SUA_CHAVE_SECRETA_MUITO_FORTE" 
        self.algorithm = "HS256"
        self.access_token_expire_minutes = 60

    async def __aenter__(self):
        await self.prisma.connect()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.prisma.is_connected():
            await self.prisma.disconnect()
    
    def _hash_password(self, password: str) -> str:
        """Gera o hash de uma senha usando bcrypt"""
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    def _verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verifica se a senha fornecida corresponde ao hash salvo"""
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    
    def _create_access_token(self, data: Dict[str, Any]) -> str:
        """Cria um token de acesso JWT"""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt
    
    def _verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verifica e decodifica um token JWT"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except (jwt.ExpiredSignatureError, jwt.JWTError):
            return None

    async def register(self, user_data: RegisterRequest) -> AuthResponse:
        """Registra um novo fazendeiro/usuário"""
        existing_user = await self.prisma.user.find_unique(where={"email": user_data.email})
        if existing_user:
            raise ValueError("O email fornecido já está em uso")
        
        hashed_password = self._hash_password(user_data.password)
        
        new_user = await self.prisma.user.create(
            data={
                "name": user_data.name,
                "farmName": user_data.farmName,
                "gender": user_data.gender.value,
                "email": user_data.email,
                "passwordHash": hashed_password
            }
        )
        
        token_data = {"sub": new_user.id}
        access_token = self._create_access_token(token_data)
        
        user_response = UserResponse.model_validate(new_user)
        token_response = TokenResponse(
            access_token=access_token,
            expires_in=self.access_token_expire_minutes * 60
        )
        
        return AuthResponse(user=user_response, token=token_response)

    async def login(self, login_data: LoginRequest) -> AuthResponse:
        """Autentica um usuário e retorna um token"""
        user = await self.prisma.user.find_unique(where={"email": login_data.email})
        
        if not user or not self._verify_password(login_data.password, user.passwordHash):
            raise ValueError("Email ou senha incorretos")
            
        token_data = {"sub": user.id}
        access_token = self._create_access_token(token_data)
        
        user_response = UserResponse.model_validate(user)
        token_response = TokenResponse(
            access_token=access_token,
            expires_in=self.access_token_expire_minutes * 60
        )
        
        return AuthResponse(user=user_response, token=token_response)

    async def get_current_user(self, token: str) -> Optional[UserResponse]:
        """Obtém o usuário atual com base no token JWT"""
        payload = self._verify_token(token)
        if not payload or "sub" not in payload:
            return None
        
        user_id = payload.get("sub")
        user = await self.prisma.user.find_unique(where={"id": user_id})
        
        if not user:
            return None
            
        return UserResponse.model_validate(user)