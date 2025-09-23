from prisma import Prisma
from typing import List, Optional, Dict, Any

class FazendeiroRepository:
    def __init__(self, db: Prisma):
        self.db = db

    async def get_all(self) -> List[Dict[str, Any]]:
        return await self.db.user.find_many()

    async def get_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        return await self.db.user.find_unique(where={"id": user_id})

    async def search(self, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        filters = {k: v for k, v in params.items() if v is not None}
        return await self.db.user.find_many(where=filters)

    async def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return await self.db.user.create(data=data)

    async def update(self, user_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        return await self.db.user.update(where={"id": user_id}, data=data)

    async def delete(self, user_id: str) -> Optional[Dict[str, Any]]:
        return await self.db.user.delete(where={"id": user_id})

    async def get_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        return await self.db.user.find_unique(where={"email": email})

    async def get_statistics(self) -> Dict[str, Any]:
        total = await self.db.user.count()
        by_gender = {
            gender: await self.db.user.count(where={"gender": gender})
            for gender in ["MASCULINO", "FEMININO", "OUTRO", "NAO_INFORMAR"]
        }
        return {"total": total, "by_gender": by_gender}

    async def update_soil_harvest(self, user_id: int, soil_type: str, harvest_phase: str) -> Optional[Dict[str, Any]]:
        return await self.db.user.update(
            where={"id": user_id},
            data={"soilType": soil_type, "harvestPhase": harvest_phase}
        )
