from fastapi import FastAPI, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
# import requests
from datetime import datetime, timedelta

from app.dependencies import db




app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await db.connect()

@app.on_event("shutdown")
async def shutdown():
    await db.disconnect()

from app.auth.auth_controller import router as auth_router
from app.fazendeiro.controller import router as fazendeiro_router

app.include_router(auth_router)
app.include_router(fazendeiro_router)

# def filtrar_valores_validos(valores, fill_value=-999):
#     return [v for v in valores if v != fill_value]

# def get_nasa_power_hourly(lat: float, lon: float):
#     ontem = datetime.now() - timedelta(days=3)
#     data_inicio = ontem.strftime("%Y%m%d")
#     data_fim = ontem.strftime("%Y%m%d")

#     url = "https://power.larc.nasa.gov/api/temporal/hourly/point"
#     params = {
#         "parameters": "T2M,PRECTOTCORR,RH2M",
#         "community": "AG",
#         "longitude": lon,
#         "latitude": lat,
#         "start": data_inicio,
#         "end": data_fim,
#         "format": "JSON"
#     }

#     response = requests.get(url, params=params)
#     response.raise_for_status()
#     data = response.json()

#     temp_horas = data["properties"]["parameter"]["T2M"]
#     prectot_horas = data["properties"]["parameter"]["PRECTOTCORR"]
#     rh2m_horas = data["properties"]["parameter"]["RH2M"]

#     temperaturas = filtrar_valores_validos(list(temp_horas.values()))
#     precipitacoes = filtrar_valores_validos(list(prectot_horas.values()))
#     umidades = filtrar_valores_validos(list(rh2m_horas.values()))

    
#     if not temperaturas or not precipitacoes or not umidades:
#         raise Exception("Não há dados válidos disponíveis para o local e data solicitados.")

#     temp_media = sum(temperaturas) / len(temperaturas)
#     prec_total = sum(precipitacoes)
#     umid_media = sum(umidades) / len(umidades)

#     return {
#         "temperatura_media": round(temp_media, 2),
#         "precipitacao_total": round(prec_total, 2),
#         "umidade_media": round(umid_media, 2),
#         "data": data_inicio
#     }

# def gerar_recomendacao(dados):
#     if dados["precipitacao_total"] < 2 and dados["umidade_media"] < 60:
#         return "Recomenda-se irrigar hoje."
#     elif dados["precipitacao_total"] > 10:
#         return "Chuva intensa registrada. Irrigação não necessária."
#     else:
#         return " Solo ainda úmido. Acompanhar nos próximos dias."

# @app.get("/irrigacao")
# def irrigacao(latitude: float = Query(..., description="Latitude do local"),
#               longitude: float = Query(..., description="Longitude do local")):
#     try:
#         dados = get_nasa_power_hourly(latitude, longitude)
#         recomendacao = gerar_recomendacao(dados)
#         return {
#             "dados_climaticos": dados,
#             "recomendacao": recomendacao
#         }
#     except Exception as e:
#         return JSONResponse(status_code=500, content={"erro": str(e)})
#     except Exception as e:
#         return JSONResponse(status_code=500, content={"erro": str(e)})
