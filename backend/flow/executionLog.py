from enum import Enum
from typing import Optional, Dict, Any
import uuid
from datetime import datetime


class Status(Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    STOPPED = "stopped"


class ExecutionLog:
    def __init__(
        self, message: str, level: str = "INFO", caller: Optional[str] = None
    ):
        self.id = str(uuid.uuid4())
        self.message = message
        self.level = level
        self.timestamp = datetime.now()
        self.caller = caller

    def __str__(self) -> str:
        return f"[{self.timestamp.isoformat()}] {self.level}: {self.caller} - {self.message}"

    def to_dict(self) -> Dict[str, Any]:
        """Convert log entry to dictionary for serialization"""
        return {
            "id": self.id,
            "caller": self.caller,
            "message": self.message,
            "level": self.level,
            "timestamp": self.timestamp.isoformat(),
        }
