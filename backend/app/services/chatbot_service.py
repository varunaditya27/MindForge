# services/chatbot_service.py

import logging
import time
from typing import Optional
import google.generativeai as genai
from ..core.config import settings
from .gemini_client import GeminiMultiKeyClient

logger = logging.getLogger(__name__)

class ChatbotService:
    """Service for general chatbot conversations using Gemini"""
    
    def __init__(self):
        self.model = None
        self.multi_client = None
        self._initialize_genai()
    
    def _initialize_genai(self) -> None:
        """Initialize Google Generative AI (multi-key if provided)."""
        try:
            if settings.GEMINI_API_KEYS:
                self.multi_client = GeminiMultiKeyClient(settings.GEMINI_API_KEYS, 'gemini-2.5-flash')
                self.model = None
                logger.info("ChatbotService using GeminiMultiKeyClient (round-robin keys)")
            else:
                genai.configure(api_key=settings.GEMINI_API_KEY)
                self.model = genai.GenerativeModel('gemini-2.5-flash')
                self.multi_client = None
                logger.info("Chatbot Gemini AI initialized successfully (single key)")
        except Exception as e:
            self.model = None
            self.multi_client = None
            logger.error(f"Chatbot Gemini AI initialization failed: {e}")
    
    def _extract_text_single(self, response) -> Optional[str]:
        text = getattr(response, "text", None)
        if text:
            return text
        try:
            candidates = getattr(response, "candidates", [])
            if candidates:
                parts = getattr(candidates[0].content, "parts", [])
                if parts and hasattr(parts[0], "text"):
                    return parts[0].text
        except Exception:
            return None
        return None
    
    def _create_chat_prompt(self, user_message: str) -> str:
        return f"""You are MindForge Coder, a focused assistant that helps students implement their AI idea pitches into working prototype code. 
    Your role is purely functional and technical — DO NOT evaluate, grade, or comment on creativity. Stay on coding, architecture, 
    and implementation details only. Never provide motivational text or chit-chat.

    SCOPE & BEHAVIOR
    - You are MindForge Coder, a strict coding assistant for students vibe coding on their phones using Replit. 
    Rules:
    - Always give short, specific answers that fit well on a phone screen. 
    - Always provide working code snippets or direct step-by-step instructions. 
    - Never give explanations longer than 3 sentences. 
    - Always format code in copy-friendly blocks. 
    - Default to JavaScript (Node.js, React, Express) and Python (Flask, FastAPI) unless the user specifies another language. 
    - If the user asks a vague question, ask one clarifying question instead of guessing. 
    - Never return unrelated text, motivational talk, or long paragraphs. 
    - Keep responses actionable so students can copy-paste directly into Replit.
    - Never output evaluation scores or JSON rubrics (that is for MindForge Evaluator only).
    - Do not return total project reports — focus on functional code and implementation steps.
    - Keep responses concise but technically rich; prioritize direct utility.
    - If asked something non-technical (e.g., grading, unrelated questions), politely refuse and redirect to coding support.
    - Output style: First explain in short bullets (≤5), then give code/examples.

    OUTPUT FORMAT
    - Stepwise guidance with minimal explanation.
    - Code snippets in plain text (inside triple backticks if multiple lines).
    - No motivational filler, no vague suggestions — only coding help.

    Identity Reminder: You are NOT a teacher, NOT a judge, NOT a general chatbot. 
    You are a strict coding assistant who helps transform short AI project ideas into runnable code prototypes.
    : {user_message}"""
    
    def get_chat_response(self, user_message: str) -> str:
        try:
            t0 = time.perf_counter()
            logger.info(f"chatbot.request message_chars={len(user_message)}")
            
            prompt = self._create_chat_prompt(user_message)
            
            if getattr(self, 'multi_client', None):
                response = self.multi_client.generate(prompt)
                text = self.multi_client.extract_text(response)
            else:
                if not getattr(self, 'model', None):
                    raise RuntimeError("AI model not initialized")
                response = self.model.generate_content(prompt)
                text = self._extract_text_single(response)
            
            if not text:
                raise RuntimeError("Empty response from AI")
            
            elapsed_ms = (time.perf_counter() - t0) * 1000
            logger.info(f"chatbot.success elapsed_ms={elapsed_ms:.1f} response_chars={len(text)}")
            
            return text.strip()
        except Exception as e:
            logger.error(f"chatbot.error: {e}")
            raise RuntimeError(f"Failed to get chat response: {str(e)}")

# Singleton instance
chatbot_service = ChatbotService()
