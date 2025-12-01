from fastapi import APIRouter, Depends, HTTPException
from prisma import Prisma
from app.dependencies import get_db
from app.auth.auth_middleware import get_current_user
from .service import FazendeiroService
from .schemas import (
    FazendeiroUpdate, FazendeiroResponse,
    FazendeiroSearch, FazendeiroChangePassword, FazendeiroUpdateSoilHarvest,
    IrrigacaoRequest, IrrigacaoResponse, IrrigacaoClimaResponse, Gender
)
from typing import List

router = APIRouter(prefix="/fazendeiro", tags=["Fazendeiro"])

# Rotas específicas PRIMEIRO (antes das rotas com parâmetros dinâmicos)

@router.get("/me", response_model=FazendeiroResponse)
async def get_me(
    db: Prisma = Depends(get_db),
    current_user: FazendeiroResponse = Depends(get_current_user)
):
    """
    Retorna os dados do usuário autenticado.
    Requer autenticação.
    """
    service = FazendeiroService(db)
    user = await service.get_by_id(current_user.id)
    if not user:
        raise HTTPException(status_code=404, detail="Fazendeiro não encontrado")
    return user

@router.put("/me/update-harvest-phase", response_model=FazendeiroResponse)
async def update_harvest_phase(
    harvestPhase: str,
    db: Prisma = Depends(get_db),
    current_user: FazendeiroResponse = Depends(get_current_user)
):
    """
    Atualiza apenas o estágio de desenvolvimento da própria fazenda.
    Valores possíveis: INICIAL, DESENVOLVIMENTO, MATURACAO.
    Requer autenticação.
    """
    harvestPhase = harvestPhase.upper()
    if harvestPhase not in ["INICIAL", "DESENVOLVIMENTO", "MATURACAO"]:
        raise HTTPException(status_code=400, detail="Fase de desenvolvimento inválida.")
    service = FazendeiroService(db)
    user = await service.update(current_user.id, FazendeiroUpdate(harvestPhase=harvestPhase))
    if not user:
        raise HTTPException(status_code=404, detail="Fazendeiro não encontrado")
    return user

@router.put("/me/change-password", response_model=dict)
async def change_password(
    change: FazendeiroChangePassword,
    db: Prisma = Depends(get_db),
    current_user: FazendeiroResponse = Depends(get_current_user)
):
    """
    Altera a senha do próprio usuário.
    Requer autenticação.
    """
    service = FazendeiroService(db)
    success = await service.change_password(current_user.id, change)
    if not success:
        raise HTTPException(status_code=400, detail="Senha antiga incorreta ou usuário não encontrado")
    return {"success": True}

@router.post("/irrigacao/registrar", response_model=IrrigacaoResponse)
async def registrar_irrigacao(
    db: Prisma = Depends(get_db),
    current_user: FazendeiroResponse = Depends(get_current_user)
):
    """
    Registra uma irrigação para o usuário autenticado.
    O usuário não precisa informar seu ID, é obtido automaticamente do token.
    Requer autenticação.
    """
    service = FazendeiroService(db)
    return await service.registrar_irrigacao(current_user.id)

@router.get("/irrigacao/historico", response_model=List[IrrigacaoResponse])
async def historico_irrigacao(
    db: Prisma = Depends(get_db),
    current_user: FazendeiroResponse = Depends(get_current_user)
):
    """
    Retorna o histórico de irrigação do usuário autenticado.
    Requer autenticação.
    """
    service = FazendeiroService(db)
    return await service.historico_irrigacao(current_user.id)

@router.post("/irrigacao/recomendacao", response_model=IrrigacaoClimaResponse)
async def consulta_recomendacao_irrigacao(
    req: IrrigacaoRequest,
    db: Prisma = Depends(get_db),
    current_user: FazendeiroResponse = Depends(get_current_user)
):
    """
    Consulta dados climáticos da NASA e retorna recomendação de irrigação para a localização informada.
    Requer autenticação.
    """
    service = FazendeiroService(db)
    try:
        return service.consulta_clima_e_recomendacao(req.latitude, req.longitude)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao consultar dados climáticos: {str(e)}")

@router.post("/search", response_model=List[FazendeiroResponse])
async def search(
    search: FazendeiroSearch,
    db: Prisma = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Busca fazendeiros por parâmetros (nome, fazenda, solo, fase, etc).
    Requer autenticação.
    """
    service = FazendeiroService(db)
    return await service.search(search)

# Rotas com parâmetros dinâmicos POR ÚLTIMO

@router.get("/{user_id}", response_model=FazendeiroResponse)
async def get_by_id(
    user_id: int,
    db: Prisma = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Busca um fazendeiro pelo ID.
    Requer autenticação.
    """
    service = FazendeiroService(db)
    user = await service.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Fazendeiro não encontrado")
    return user

@router.put("/{user_id}/soil-harvest", response_model=FazendeiroResponse)
async def update_soil_harvest(
    user_id: int,
    data: FazendeiroUpdateSoilHarvest,
    db: Prisma = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Atualiza o tipo de solo e fase da colheita do fazendeiro.
    Requer autenticação.
    """
    service = FazendeiroService(db)
    user = await service.update_soil_harvest(user_id, data.soilType.value, data.harvestPhase.value)
    if not user:
        raise HTTPException(status_code=404, detail="Fazendeiro não encontrado")
    return user

@router.delete("/{user_id}", response_model=dict)
async def delete(
    user_id: int,
    db: Prisma = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Remove um fazendeiro pelo ID.
    Requer autenticação.
    """
    service = FazendeiroService(db)
    success = await service.delete(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Fazendeiro não encontrado")
    return {"success": True}