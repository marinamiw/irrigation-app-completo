from pydantic import BaseModel, EmailStr, Field
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

class FazendeiroBase(BaseModel):
    name: str
    farmName: str
    gender: Gender
    email: EmailStr
    soilType: Optional[SoilType] = None
    harvestPhase: Optional[HarvestPhase] = None

class FazendeiroCreate(FazendeiroBase):
    password: str

class FazendeiroResponse(FazendeiroBase):
    id: int  # Agora é inteiro
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

    class Config:
        from_attributes = True

class FazendeiroUpdateSoilHarvest(BaseModel):
    soilType: SoilType
    harvestPhase: HarvestPhase

class FazendeiroUpdate(BaseModel):
    name: Optional[str] = None
    farmName: Optional[str] = None
    gender: Optional[Gender] = None
    soilType: Optional[SoilType] = None
    harvestPhase: Optional[HarvestPhase] = None
    email: Optional[EmailStr] = None

class FazendeiroSearch(BaseModel):
    name: Optional[str] = None
    farmName: Optional[str] = None
    gender: Optional[Gender] = None
    soilType: Optional[SoilType] = None
    harvestPhase: Optional[HarvestPhase] = None
    email: Optional[EmailStr] = None

class FazendeiroChangePassword(BaseModel):
    old_password: str
    new_password: str

class IrrigacaoRequest(BaseModel):
    latitude: float
    longitude: float

class IrrigacaoResponse(BaseModel):
    id: str
    userId: int
    irrigatedAt: str

class IrrigacaoClimaResponse(BaseModel):
    temperatura_media: float
    precipitacao_total: float
    umidade_media: float
    data: str
    recomendacao: str
