from fastapi import APIRouter, Depends, HTTPException
from prisma import Prisma
from app.dependencies import get_db
from app.auth.auth_middleware import require_auth
from .service import FazendeiroService
from .schemas import (
    FazendeiroCreate, FazendeiroUpdate, FazendeiroResponse,
    FazendeiroSearch, FazendeiroChangePassword, FazendeiroUpdateSoilHarvest
)
from typing import List

router = APIRouter(prefix="/fazendeiros", tags=["Fazendeiros"])

@router.get("/", response_model=List[FazendeiroResponse])
async def get_all(db: Prisma = Depends(get_db), current_user=Depends(require_auth)):
    service = FazendeiroService(db)
    return await service.get_all()

@router.get("/{user_id}", response_model=FazendeiroResponse)
async def get_by_id(user_id: str, db: Prisma = Depends(get_db), current_user=Depends(require_auth)):
    service = FazendeiroService(db)
    user = await service.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Fazendeiro não encontrado")
    return user

@router.post("/search", response_model=List[FazendeiroResponse])
async def search(search: FazendeiroSearch, db: Prisma = Depends(get_db), current_user=Depends(require_auth)):
    service = FazendeiroService(db)
    return await service.search(search)

@router.post("/", response_model=FazendeiroResponse, status_code=201)
async def create(data: FazendeiroCreate, db: Prisma = Depends(get_db), current_user=Depends(require_auth)):
    service = FazendeiroService(db)
    return await service.create(data)

@router.put("/{user_id}", response_model=FazendeiroResponse)
async def update(user_id: str, data: FazendeiroUpdate, db: Prisma = Depends(get_db), current_user=Depends(require_auth)):
    service = FazendeiroService(db)
    user = await service.update(user_id, data)
    if not user:
        raise HTTPException(status_code=404, detail="Fazendeiro não encontrado")
    return user

@router.put("/{user_id}/change-password", response_model=dict)
async def change_password(user_id: str, change: FazendeiroChangePassword, db: Prisma = Depends(get_db), current_user=Depends(require_auth)):
    service = FazendeiroService(db)
    success = await service.change_password(user_id, change)
    if not success:
        raise HTTPException(status_code=400, detail="Senha antiga incorreta ou usuário não encontrado")
    return {"success": True}

@router.delete("/{user_id}", response_model=dict)
async def delete(user_id: str, db: Prisma = Depends(get_db), current_user=Depends(require_auth)):
    service = FazendeiroService(db)
    success = await service.delete(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Fazendeiro não encontrado")
    return {"success": True}

@router.get("/statistics", response_model=dict)
async def statistics(db: Prisma = Depends(get_db), current_user=Depends(require_auth)):
    service = FazendeiroService(db)
    return await service.get_statistics()

@router.put("/{user_id}/soil-harvest", response_model=FazendeiroResponse)
async def update_soil_harvest(
    user_id: int,
    data: FazendeiroUpdateSoilHarvest,
    db: Prisma = Depends(get_db),
    current_user=Depends(require_auth)
):
    service = FazendeiroService(db)
    user = await service.update_soil_harvest(user_id, data.soilType.value, data.harvestPhase.value)
    if not user:
        raise HTTPException(status_code=404, detail="Fazendeiro não encontrado")
    return user
