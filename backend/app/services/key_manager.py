import threading
from typing import List, Optional


class RoundRobinKeyManager:
        """Thread-safe simple round-robin API key manager.

        Each call to get_next() returns the next key in order, using each key
        exactly once per logical cycle, then wrapping back to the start.

        Sequence for [A,B,C]: A, B, C, A, B, C, A, ...
        """

        def __init__(self, keys: List[str]):
                self._keys = keys[:] if keys else []
                self._lock = threading.Lock()
                self._idx = 0

        def get_next(self) -> Optional[str]:
                if not self._keys:
                        return None
                with self._lock:
                        key = self._keys[self._idx]
                        self._idx = (self._idx + 1) % len(self._keys)
                        return key
