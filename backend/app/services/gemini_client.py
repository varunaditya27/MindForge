"""
Gemini multi-key client
-----------------------

Provides a tiny, well-documented wrapper around the google-generativeai SDK
to support round-robin API key usage with basic, thread-safe protection.

Why this exists:
- The SDK uses a global configuration for the API key.
- In a web server with concurrent requests, switching the global key can race.
- We serialize configure()+call per request to ensure the right key is used.
- We rotate across keys to reduce rate-limit hits during the live event.

Trade-offs:
- Calls are serialized at the point of configure()+generate. For short, fast
  Gemini Flash calls, this is usually acceptable for a one-day event. If you
  need higher concurrency, consider multiple worker processes with sharded keys.
"""

from __future__ import annotations

import logging
import threading
from typing import List, Optional

import google.generativeai as genai

from .key_manager import RoundRobinKeyManager

logger = logging.getLogger(__name__)


class GeminiMultiKeyClient:
    """Round-robin, thread-safe Gemini caller.

    - Rotates through provided API keys.
    - Serializes SDK configure()+call to avoid cross-thread key bleed.
    - Retries on rate-limit-like errors by switching to the next key.
    """

    def __init__(self, keys: List[str], model_name: str = 'gemini-2.5-flash') -> None:
        self._keys = [k for k in (keys or []) if k]
        self._rr = RoundRobinKeyManager(self._keys)
        self._model_name = model_name
        self._cfg_lock = threading.Lock()

        if not self._keys:
            logger.warning("GeminiMultiKeyClient initialized with no API keys")

    def _call_with_key(self, api_key: str, prompt: str):
        """Configure SDK with a given key and make a single generate call.

        Note: We hold a lock across configure()+generate_content() to ensure
        the global API key doesn't change underneath this call.
        """
        with self._cfg_lock:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel(self._model_name)
            return model.generate_content(prompt)

    @staticmethod
    def _is_rate_limited(err: Exception) -> bool:
        msg = str(err).lower()
        return any(tok in msg for tok in [
            'rate limit', 'quota', '429', 'resource exhausted', 'exceeded'
        ])

    def generate(self, prompt: str):
        """Generate model output using the next available API key.

        Tries up to N times where N = number of keys. On rate limit-like
        errors, rotates to the next key and retries. Other errors are raised.
        """
        if not self._keys:
            raise RuntimeError("No Gemini API keys configured")

        last_err: Optional[Exception] = None
        for _ in range(len(self._keys)):
            api_key = self._rr.get_next()
            try:
                return self._call_with_key(api_key, prompt)
            except Exception as e:  # noqa: BLE001
                last_err = e
                if self._is_rate_limited(e):
                    logger.info("Gemini rate limit on one key; rotating to next key and retrying")
                    continue
                # Non-rate-limit errors should bubble up
                raise
        # If all keys hit rate limits or failed similarly, raise the last error
        if last_err:
            raise last_err
        raise RuntimeError("Gemini generate failed with unknown error")

    @staticmethod
    def extract_text(response) -> Optional[str]:
        """Best-effort extraction of text from SDK response variants."""
        text = getattr(response, 'text', None)
        if text:
            return text
        try:
            candidates = getattr(response, 'candidates', [])
            if candidates:
                parts = getattr(candidates[0].content, 'parts', [])
                if parts and hasattr(parts[0], 'text'):
                    return parts[0].text
        except Exception:  # noqa: BLE001
            return None
        return None
