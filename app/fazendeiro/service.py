from .repository import FazendeiroRepository
from .schemas import (
    FazendeiroCreate, FazendeiroUpdate, FazendeiroResponse,
    FazendeiroSearch, FazendeiroChangePassword
)
from prisma import Prisma
from typing import List, Optional
import bcrypt

class FazendeiroService:
    def __init__(self, db: Prisma):
        self.repo = FazendeiroRepository(db)

    async def get_all(self) -> List[FazendeiroResponse]:
        users = await self.repo.get_all()
        return [FazendeiroResponse.model_validate(u) for u in users]

    async def get_by_id(self, user_id: str) -> Optional[FazendeiroResponse]:
        user = await self.repo.get_by_id(user_id)
        return FazendeiroResponse.model_validate(user) if user else None

    async def search(self, search: FazendeiroSearch) -> List[FazendeiroResponse]:
        users = await self.repo.search(search.dict())
        return [FazendeiroResponse.model_validate(u) for u in users]

    async def create(self, data: FazendeiroCreate) -> FazendeiroResponse:
        hashed = bcrypt.hashpw(data.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        user_dict = data.dict(exclude={"password"})
        user_dict["passwordHash"] = hashed
        user = await self.repo.create(user_dict)
        return FazendeiroResponse.model_validate(user)

    async def update(self, user_id: str, data: FazendeiroUpdate) -> Optional[FazendeiroResponse]:
        update_data = {k: v for k, v in data.dict().items() if v is not None}
        user = await self.repo.update(user_id, update_data)
        return FazendeiroResponse.model_validate(user) if user else None

    async def change_password(self, user_id: str, change: FazendeiroChangePassword) -> bool:
        user = await self.repo.get_by_id(user_id)
        if not user or not bcrypt.checkpw(change.old_password.encode("utf-8"), user["passwordHash"].encode("utf-8")):
            return False
        new_hash = bcrypt.hashpw(change.new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        await self.repo.update(user_id, {"passwordHash": new_hash})
        return True

    async def delete(self, user_id: str) -> bool:
        user = await self.repo.delete(user_id)
        return user is not None

    async def get_statistics(self) -> dict:
        return await self.repo.get_statistics()

    async def update_soil_harvest(self, user_id: int, soil_type: str, harvest_phase: str) -> Optional[FazendeiroResponse]:
        user = await self.repo.update_soil_harvest(user_id, soil_type, harvest_phase)
        return FazendeiroResponse.model_validate(user) if user else None
