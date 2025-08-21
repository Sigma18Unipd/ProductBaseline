from flow.executionLog import ExecutionLog, Status
from flow.block import Block
import logging
import threading
from typing import Optional

from typing import Dict, Any, List
logger = logging.getLogger(__name__)


class FlowIterator:
    def __init__(self, blocks: List[Block]):
        self.logs: List[ExecutionLog] = []
        self.blocks = blocks
        self.status = Status.STOPPED
        self._thread: Optional[threading.Thread] = None

    def _run_blocks(self, input: Dict[str, Any]):
        """Run all blocks and collect logs"""
        logger.debug("blocks to run: %s", [block.name for block in self.blocks])
        self.block_output = []
        for block in self.blocks:
            try:
                self.status = Status.RUNNING
                self.logs.extend([ExecutionLog(f"Running block: {block.name}", "INFO")])
                logger.debug(f"Running block: {block.name}, ID: {block.id}")
                block.run(self.block_output)
                self.block_output = block.get_output()
                self.logs.extend(block.get_logs())
                logger.debug(
                    f"Block {block.name} completed with output: {self.block_output}"
                )
            except Exception as e:
                self.logs.extend(block.get_logs())
                logger.error(f"Block {block.name} failed: {str(e)}")
                raise e
    
    def run(self, input: Dict[str, Any]):
        if self.status == Status.RUNNING:
            logger.warning("Runner is already running")
            return
        self.status = Status.RUNNING
        self._thread = threading.Thread(target=self._run_blocks, args=(input,))
        self._thread.start()

    def get_logs(self) -> List[ExecutionLog]:
        """Get all logs from the runner"""
        return self.logs

    def get_status(self) -> Status:
        """Get the current status of the runner"""
        return self.status
