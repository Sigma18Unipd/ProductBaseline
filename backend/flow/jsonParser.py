from abc import ABC, abstractmethod
from graphlib import TopologicalSorter
from typing import Any, Dict, List
import logging
import json
logger = logging.getLogger(__name__)

class JsonParserStrategy(ABC):
    @abstractmethod
    def parse(self, json_data: Dict[str, Any]) -> Dict[str, Any]:
        """Parse JSON data and return a list of Block instances"""
        pass


class JsonParser(JsonParserStrategy):
    def parse(self, json_data: Dict[str, Any]) -> Dict[str, Any]:
        """Parse JSON data to create blocks"""
        if isinstance(json_data, str):
            try:
                json_data = json.loads(json_data)
            except json.JSONDecodeError as e:
                raise ValueError(f"Invalid JSON string: {str(e)}")
        ordered_nodes = self._order_nodes(json_data)
        node_data = {n["id"]: n for n in json_data.get("nodes", [])}
        logger.debug(f"Ordered nodes: {ordered_nodes}")
        return {"nodes": ordered_nodes, "node_data": node_data}

    def _order_nodes(self, json_data: Dict[str, Any]) -> List[str]:
        """Determine the execution order of nodes based on edges"""
        logger.debug(f"Initial nodes: {json_data}")
        nodes = {node["id"]: node for node in json_data.get("nodes", [])}
        ts = TopologicalSorter()
        # to make sure that isolated nodes are also included
        for node in nodes:
            ts.add(node)
        for edge in json_data.get("edges", []):
            ts.add(edge["target"], edge["source"])
        try:
            ordered = list(ts.static_order())# i hope this will sort things correctly
            logger.debug(f"sorted nodes: {ordered}")
            return ordered
        except Exception as e:
            raise ValueError(f"Error in topological sorting: {str(e)}")