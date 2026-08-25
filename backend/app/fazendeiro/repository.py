from prisma import Prisma
from prisma.models import User, Irrigation
from typing import List, Optional, Dict, Any

class FazendeiroRepository:
    def __init__(self, db: Prisma):
        self.db = db

    async def get_all(self) -> List[User]:
        return await self.db.user.find_many()

    async def get_by_id(self, user_id: int) -> Optional[User]:
        return await self.db.user.find_unique(where={"id": user_id})

    async def search(self, params: Dict[str, Any]) -> List[User]:
        filters = {k: v for k, v in params.items() if v is not None}
        return await self.db.user.find_many(where=filters)

    async def create(self, data: Dict[str, Any]) -> User:
        return await self.db.user.create(data=data)

    async def update(self, user_id: int, data: Dict[str, Any]) -> Optional[User]:
        return await self.db.user.update(where={"id": user_id}, data=data)

    async def delete(self, user_id: int) -> Optional[User]:
        return await self.db.user.delete(where={"id": user_id})

    async def get_by_email(self, email: str) -> Optional[User]:
        return await self.db.user.find_unique(where={"email": email})

    async def get_statistics(self) -> Dict[str, Any]:
        total = await self.db.user.count()
        by_gender = {
            gender: await self.db.user.count(where={"gender": gender})
            for gender in ["MASCULINO", "FEMININO", "OUTRO", "NAO_INFORMAR"]
        }
        return {"total": total, "by_gender": by_gender}

    async def update_soil_harvest(self, user_id: int, soil_type: str, harvest_phase: str) -> Optional[User]:
        return await self.db.user.update(
            where={"id": user_id},
            data={"soilType": soil_type, "harvestPhase": harvest_phase}
        )

    async def registrar_irrigacao(self, user_id: int, quantidade: float | None = None) -> Irrigation:
        data: dict = {"userId": user_id}
        if quantidade is not None:
            data["quantidadeLitros"] = quantidade
        return await self.db.irrigation.create(data=data)

    async def historico_irrigacao(self, user_id: int) -> List[Irrigation]:
        return await self.db.irrigation.find_many(where={"userId": user_id}, order={"irrigatedAt": "desc"})