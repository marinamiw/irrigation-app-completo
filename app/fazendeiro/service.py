from .repository import FazendeiroRepository
from .schemas import (
    FazendeiroCreate, FazendeiroUpdate, FazendeiroResponse,
    FazendeiroSearch, FazendeiroChangePassword, IrrigacaoRequest,
    IrrigacaoResponse, IrrigacaoClimaResponse
)
from prisma import Prisma
from typing import List, Optional
import bcrypt
import requests
from datetime import datetime, timedelta

class FazendeiroService:
    def __init__(self, db: Prisma):
        self.repo = FazendeiroRepository(db)

    def _serialize_user(self, user) -> dict:
        # Converte campos datetime para string, funciona para dict ou objeto
        if user is None:
            return None
        if isinstance(user, dict):
            user = user.copy()
            if "createdAt" in user and user["createdAt"] is not None and not isinstance(user["createdAt"], str):
                user["createdAt"] = user["createdAt"].isoformat()
            if "updatedAt" in user and user["updatedAt"] is not None and not isinstance(user["updatedAt"], str):
                user["updatedAt"] = user["updatedAt"].isoformat()
            return user
        else:
            # Prisma pode retornar um objeto, converta para dict e serialize datas
            user_dict = user.__dict__.copy()
            if hasattr(user, "createdAt") and user.createdAt is not None and not isinstance(user.createdAt, str):
                user_dict["createdAt"] = user.createdAt.isoformat()
            if hasattr(user, "updatedAt") and user.updatedAt is not None and not isinstance(user.updatedAt, str):
                user_dict["updatedAt"] = user.updatedAt.isoformat()
            return user_dict

    async def get_all(self) -> List[FazendeiroResponse]:
        """
        Retorna todos os fazendeiros cadastrados.
        """
        users = await self.repo.get_all()
        return [FazendeiroResponse.model_validate(self._serialize_user(u)) for u in users]

    async def get_by_id(self, user_id: int) -> Optional[FazendeiroResponse]:
        """
        Busca um fazendeiro pelo ID.
        """
        user = await self.repo.get_by_id(user_id)
        return FazendeiroResponse.model_validate(self._serialize_user(user)) if user else None

    async def search(self, search: FazendeiroSearch) -> List[FazendeiroResponse]:
        """
        Busca fazendeiros por parâmetros.
        """
        users = await self.repo.search(search.dict())
        return [FazendeiroResponse.model_validate(self._serialize_user(u)) for u in users]

    async def create(self, data: FazendeiroCreate) -> FazendeiroResponse:
        """
        Cria um novo fazendeiro.
        """
        hashed = bcrypt.hashpw(data.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        user_dict = data.dict(exclude={"password"})
        user_dict["passwordHash"] = hashed
        user = await self.repo.create(user_dict)
        return FazendeiroResponse.model_validate(self._serialize_user(user))

    async def update(self, user_id: int, data: FazendeiroUpdate) -> Optional[FazendeiroResponse]:
        """
        Atualiza dados do fazendeiro.
        """
        update_data = {k: v for k, v in data.dict().items() if v is not None}
        user = await self.repo.update(user_id, update_data)
        return FazendeiroResponse.model_validate(self._serialize_user(user)) if user else None

    async def change_password(self, user_id: int, change: FazendeiroChangePassword) -> bool:
        """
        Altera a senha do fazendeiro.
        """
        user = await self.repo.get_by_id(user_id)
        if not user or not bcrypt.checkpw(change.old_password.encode("utf-8"), user.passwordHash.encode("utf-8")):
            return False
        new_hash = bcrypt.hashpw(change.new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        await self.repo.update(user_id, {"passwordHash": new_hash})
        return True

    async def delete(self, user_id: int) -> bool:
        """
        Remove um fazendeiro pelo ID.
        """
        user = await self.repo.delete(user_id)
        return user is not None

    async def get_statistics(self) -> dict:
        """
        Retorna estatísticas dos fazendeiros cadastrados.
        """
        return await self.repo.get_statistics()

    async def update_soil_harvest(self, user_id: int, soil_type: str, harvest_phase: str) -> Optional[FazendeiroResponse]:
        """
        Atualiza o tipo de solo e fase da colheita do fazendeiro.
        """
        user = await self.repo.update_soil_harvest(user_id, soil_type, harvest_phase)
        return FazendeiroResponse.model_validate(user) if user else None

    async def registrar_irrigacao(self, user_id: int) -> IrrigacaoResponse:
        """
        Registra uma irrigação para o usuário.
        """
        irrigacao = await self.repo.registrar_irrigacao(user_id)
        # Prisma retorna objeto, não dict
        return IrrigacaoResponse(
            id=irrigacao.id,
            userId=irrigacao.userId,
            irrigatedAt=str(irrigacao.irrigatedAt)
        )

    async def historico_irrigacao(self, user_id: int) -> List[IrrigacaoResponse]:
        """
        Retorna o histórico de irrigação do usuário.
        """
        irrigacoes = await self.repo.historico_irrigacao(user_id)
        return [
            IrrigacaoResponse(
                id=i.id,
                userId=i.userId,
                irrigatedAt=str(i.irrigatedAt)
            ) for i in irrigacoes
        ]

    def filtrar_valores_validos(self, valores, fill_value=-999):
        return [v for v in valores if v != fill_value]

    def get_nasa_power_hourly(self, lat: float, lon: float):
        url = "https://power.larc.nasa.gov/api/temporal/hourly/point"

        # NASA POWER tem delay de ~4-5 dias; tenta de 5 até 15 dias atrás
        for days_back in range(5, 16):
            data_inicio = (datetime.now() - timedelta(days=days_back)).strftime("%Y%m%d")
            params = {
                "parameters": "T2M,PRECTOTCORR,RH2M",
                "community": "AG",
                "longitude": lon,
                "latitude": lat,
                "start": data_inicio,
                "end": data_inicio,
                "format": "JSON"
            }
            response = requests.get(url, params=params, timeout=20)
            response.raise_for_status()
            data = response.json()

            temp_horas = data["properties"]["parameter"]["T2M"]
            prectot_horas = data["properties"]["parameter"]["PRECTOTCORR"]
            rh2m_horas = data["properties"]["parameter"]["RH2M"]

            temperaturas = self.filtrar_valores_validos(list(temp_horas.values()))
            precipitacoes = self.filtrar_valores_validos(list(prectot_horas.values()))
            umidades = self.filtrar_valores_validos(list(rh2m_horas.values()))

            if temperaturas and precipitacoes and umidades:
                return {
                    "temperatura_media": round(sum(temperaturas) / len(temperaturas), 2),
                    "precipitacao_total": round(sum(precipitacoes), 2),
                    "umidade_media": round(sum(umidades) / len(umidades), 2),
                    "data": data_inicio
                }

        raise Exception("Não há dados válidos disponíveis para o local solicitado.")

    def gerar_recomendacao(self, dados):
        if dados["precipitacao_total"] < 2 and dados["umidade_media"] < 60:
            return "Recomenda-se irrigar hoje."
        elif dados["precipitacao_total"] > 10:
            return "Chuva intensa registrada. Irrigação não necessária."
        else:
            return "Solo ainda úmido. Acompanhar nos próximos dias."

    def consulta_clima_e_recomendacao(self, lat: float, lon: float) -> IrrigacaoClimaResponse:
        """
        Consulta dados climáticos e gera recomendação de irrigação.
        """
        dados = self.get_nasa_power_hourly(lat, lon)
        recomendacao = self.gerar_recomendacao(dados)
        return IrrigacaoClimaResponse(**dados, recomendacao=recomendacao)
