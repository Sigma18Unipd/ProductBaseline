from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from datetime import datetime
import logging
import uuid
from flow.executionLog import ExecutionLog, Status

logger = logging.getLogger(__name__)


class BlockVisitor(ABC):
    """Abstract visitor for implementing the Visitor pattern"""

    @abstractmethod
    def visit_block(self, block: "Block") -> Any:
        """Visit a generic block"""
        pass

class Block(ABC):
    """
    Abstract base class for all blocks in the system.
    """
    __abstract__ = True

    def __init__(
        self,
        block_id: Optional[str] = None,
        name: Optional[str] = None,
        shortname: Optional[str] = None,
        input: Optional[Dict[str, Any]] = None,
    ):
        self.id = block_id or str(uuid.uuid4())
        self.name = name or self.__class__.__name__
        self.status = Status.PENDING
        self.output: Dict[str, Any] = {}
        self._execution_logs: List[ExecutionLog] = []
        self.start_time: Optional[datetime] = None
        self.end_time: Optional[datetime] = None
        self.input = input
        self.shortname = shortname or self.name
        logger.debug(f"Initialized block - type: {self.__class__.__name__}, ID: {self.id}, input={self.input}")

    @abstractmethod
    def execute(self) -> Dict[str, Any]:
        """
        To be run with super().execute()
        """
        self.status = Status.RUNNING
        self._log(f"Executing block: {self.name}, ")
        logging.debug(f"Executing block: {self.name}, ID: {self.id}")

    @abstractmethod
    def validate_inputs(self) -> bool:
        """
        True if inputs are valid, False otherwise
        """
        pass

    def accept(self, visitor: BlockVisitor) -> Any:
        """Accept a visitor (Visitor pattern)"""
        return visitor.visit_block(self)

    def _get_input(self, key: str, default: Any = None) -> Any:
        """Get an input parameter value"""
        logger.debug(f"Getting input for key: {key}, default: {default}")
        logger.debug(f"Input data: {self.input}")
        if isinstance(self.input, dict):
            return self.input.get(key, default)
        elif isinstance(self.input, list):
        # If input is a list, try to convert key to index
            try:
                index = int(key)
                if 0 <= index < len(self.input):
                    return self.input[index]
            except (ValueError, IndexError):
                pass
            return default
        else:
            return self.input if key == "value" else default

    def _set_output(self, key: str, value: Any) -> None:
        """Set an output value from the block"""
        self.output[key] = value
        self._log(f"Output set: {key}")

    def get_output(self) -> Dict[str, Any]:
        """Get all output values as a dictionary"""
        return self.output

    def _log(self, message: str, level: str = "INFO") -> None:
        """Add a log entry to the execution log"""
        log_entry = ExecutionLog(message, level, self.shortname)
        self._execution_logs.append(log_entry)

    def get_logs(self) -> List[ExecutionLog]:
        return self._execution_logs.copy()

    def run(self, input) -> Dict[str, Any]:
        try:
            self._log(f"Starting execution of block: {self.name}")
            self.status = Status.RUNNING
            self.start_time = datetime.now()
            if not self.validate_inputs():
                raise ValueError("Input validation failed")

            result = self.execute()

            self.status = Status.COMPLETED
            self.end_time = datetime.now()
            execution_time = (self.end_time - self.start_time).total_seconds()
            self._log(f"Block execution completed in {execution_time:.2f} seconds")

            return result

        except Exception as e:
            self.status = Status.FAILED
            self.end_time = datetime.now()
            self._log(f"Block execution failed: {str(e)}", "ERROR")
            raise

    def cancel(self) -> None:
        self.status = Status.CANCELLED
        self._log("Block execution cancelled", "WARNING")

    def reset(self) -> None:
        self.status = Status.PENDING
        self.output.clear()
        self._execution_logs.clear()
        self.start_time = None
        self.end_time = None
        self._log("Block reset to initial state")

    def to_dict(self) -> Dict[str, Any]:
        """Convert block to dictionary for serialization"""
        return {
            "id": self.id,
            "name": self.name,
            "status": self.status.value,
            "input": self.input,
            "output": self.output,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "logs": [log.to_dict() for log in self._execution_logs],
        }

    def __str__(self) -> str:
        return f"Block(id={self.id}, name={self.name}, status={self.status.value})"

    def __repr__(self) -> str:
        return self.__str__()