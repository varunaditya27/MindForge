# routers/chat_router.py
from fastapi import APIRouter, HTTPException
from ..services.chatbot_service import chatbot_service
from pydantic import BaseModel

router = APIRouter(prefix="/ideas", tags=["chat"])

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest):
    try:
        reply = chatbot_service.get_chat_response(req.message)
        return {"reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
