from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

from api.routes import router as api_router
from api.webhooks import router as webhook_router
from api.connectors import router as connector_router

app = FastAPI(title="LeblebBot API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
app.include_router(webhook_router)
app.include_router(connector_router)


@app.get("/")
async def root():
    return {"status": "ok", "service": "leblebbot"}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    await websocket.send_json({"message": "connected"})
    await websocket.close()
