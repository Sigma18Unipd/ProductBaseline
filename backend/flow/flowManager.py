from abc import ABC
from typing import Dict, Any, List, Optional
import logging
from .block import Block
from .blockFactory import BlockFactory
from .jsonParser import JsonParserStrategy, JsonParser
from .flowIterator import FlowIterator
from .executionLog import ExecutionLog, Status

logger = logging.getLogger(__name__)


class FlowManager:
    """
    Manages and aggregates logs from multiple blocks (Iterator pattern support).

    This class helps retrieve and concatenate logs from multiple blocks
    as mentioned in ideas.md.
    """

    def __init__(self, json_data: Dict[str, Any]):
        self.blocks: List[Block] = []
        self.factory: BlockFactory = BlockFactory().get_block_factory()
        self.parser: JsonParserStrategy = JsonParser()
        self.parse_json(json_data)
        self.runner: FlowIterator = FlowIterator(self.blocks)

    def parse_json(self, json_data: Dict[str, Any]) -> None:
        """Parse JSON data to create blocks"""
        parsed_data = self.parser.parse(json_data)
        nodes = parsed_data.get("nodes", [])
        node_data = parsed_data.get("node_data", {})
        logger.debug(f"Parsed nodes: {nodes}")

        for node_id in nodes:
            data = node_data.get(node_id, {})
            block_type = data.get("type")
            logger.debug(f"Creating block for node {node_id} with type {block_type}, data: {data}")
            if not block_type:
                logger.warning(f"Node {node_id} has no type defined, skipping")
                continue
            if not self.factory.lookup_implemented(block_type):
                logger.warning(
                    f"Block type '{block_type}' is not implemented, skipping"
                )
                logger.warning(
                    f"Available block types: {self.factory.get_supported_types()}"
                )
                raise ValueError(f"Block type '{block_type}' is not implemented")
            logger.debug(f"input data for block {node_id}: {data.get('data', {})}")
            block = self.factory.create_block(
                block_type=block_type,
                id=node_id,
                name=data.get("data", {}).get("title", node_id),
                input=data.get("data", {}),
                settings=data.get("settings", {}),
            )
            self.blocks.append(block)

    def _get_all_logs(self) -> List[ExecutionLog]:
        all_logs = []
        for block in self.blocks:
            all_logs.extend(block.get_logs())

        all_logs.sort(key=lambda log: log.timestamp)
        return all_logs

    def start_workflow(self) -> Any:
        try:
            self.runner.run({})
        except Exception as e:
            self.runner.logs.append(
                ExecutionLog(f"Workflow execution failed: {str(e)}", "ERROR")
            )
            self.runner.status = Status.FAILED
            return {
                "status": self.runner.get_status().value,
            }
        return {
            "status": self.runner.get_status().value,
        }

    def get_status(self) -> Any:
        return {
            "status": self.runner.get_status(),
            "logs": [log.to_dict() for log in self.runner.get_logs()],
        }


class FlowManagerFactory(ABC):
    _instance: Optional["FlowManagerFactory"] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if not self._initialized:
            self._initialized = True

    @classmethod
    def get_flow_manager_factory(cls) -> "FlowManagerFactory":
        return cls()

    def get_flow_manager(self, json_data) -> FlowManager:
        """Get a new FlowManager instance"""
        logger.debug("Creating FlowManager instance")
        return FlowManager(json_data)
