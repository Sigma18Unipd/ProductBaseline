from typing import Any, Dict, Protocol
import json
from abc import ABC
from llm.llmFacade import agent_facade

# Strategy Protocol
class SanitizationStrategy(Protocol):
    def sanitize(self, data: Dict[str, Any]) -> Dict[str, Any]:
        ...

class BaseSanitizationStrategy(ABC):
    _id_counter = 0
    _position_counter = [0, 0]
    
    @staticmethod
    def add_json(data: Dict[str, Any], key: str, value: Any) -> None:
        if key not in data:
            data[key] = value
    
    @classmethod
    # logic for common fields is defined defined here
    def add_field_if_missing(cls, data: Dict[str, Any], field: str, value: Any = "") -> None:
        match field:
            case "id":
                if value == "":
                    cls._id_counter += 1
                    cls.add_json(data, "id", f"node-{cls._id_counter}")
                else:
                    cls.add_json(data, "id", value)
            case "type":
                cls.add_json(data, "type", "systemWaitSeconds" if value == "" else value)
            case "position":
                cls._position_counter[0] += 400
                if cls._position_counter[0] > 800:
                    cls._position_counter[0] = 0
                    cls._position_counter[1] += 400
                cls.add_json(data, "position", {"x": cls._position_counter[0], "y": cls._position_counter[1]})
            case "data":
                cls.add_json(data, "data", {})
            case _:
                cls.add_json(data, field, value)

class BasicFieldsStrategy(BaseSanitizationStrategy):
    def sanitize(self, data: Dict[str, Any]) -> Dict[str, Any]:
        required_fields = ["id", "type", "data", "position"]
        for field in required_fields:
            self.add_field_if_missing(data, field)
        return data

class TelegramSendBotMessageStrategy(BaseSanitizationStrategy):
    def sanitize(self, data: Dict[str, Any]) -> Dict[str, Any]:
        node_data = data.get("data", {})
        self.add_field_if_missing(node_data, "botToken")
        self.add_field_if_missing(node_data, "chatId")
        self.add_field_if_missing(node_data, "message")
        data["data"] = node_data
        return data

class SystemWaitSecondsStrategy(BaseSanitizationStrategy):
    def sanitize(self, data: Dict[str, Any]) -> Dict[str, Any]:
        node_data = data.get("data", {})
        self.add_field_if_missing(node_data, "seconds", "5")
        data["data"] = node_data
        return data

class DefaultNodeStrategy(BaseSanitizationStrategy):
    def sanitize(self, data: Dict[str, Any]) -> Dict[str, Any]:
        if "data" not in data:
            data["data"] = {}
        return data

class SanitizationStrategyRegistry:
    def __init__(self):
        self._strategies: Dict[str, SanitizationStrategy] = {}
        self._pre_sanitizer = BasicFieldsStrategy()
        self._default_strategy = DefaultNodeStrategy()
        
        # Register default strategies
        self.register("telegramSendBotMessage", TelegramSendBotMessageStrategy())
        self.register("systemWaitSeconds", SystemWaitSecondsStrategy())
    
    def register(self, node_type: str, strategy: SanitizationStrategy) -> None:
        self._strategies[node_type] = strategy
    
    def get_strategy(self, node_type: str) -> SanitizationStrategy:
        return self._strategies.get(node_type, self._default_strategy)
    
    def sanitize_node(self, node: Dict[str, Any]) -> Dict[str, Any]:
        node = self._pre_sanitizer.sanitize(node)
        
        node_type = node.get("type")
        strategy = self.get_strategy(node_type) # pyright: ignore[reportArgumentType]
        return strategy.sanitize(node)

_registry = SanitizationStrategyRegistry()

def sanitize_response(flow: Dict[str, Any]) -> Dict[str, Any]:
    if not isinstance(flow, dict):
        return {}
    
    flow["nodes"] = [_registry.sanitize_node(node) for node in flow.get("nodes", [])]
    return flow

def process_prompt(query):
    raw = agent_facade(query)
    try:
        flow = json.loads(raw)
    except json.JSONDecodeError:
        return {}
    return sanitize_response(flow)

# Extension API for registering new strategies
def register_node_strategy(node_type: str, strategy: SanitizationStrategy) -> None:
    """Register a new sanitization strategy for a node type."""
    _registry.register(node_type, strategy)

if __name__ == "__main__":
    # 1) get raw JSON string from the agent
    raw = agent_facade("crea un workflow che invia un messaggio telegram usando il bot sigma18")
    # Print raw JSON from agent in yellow color
    print(f"\033[93mRaw JSON from agent:\033[0m {raw}")
    flow = json.loads(raw)
    # 3) sanitize every node
    clean_flow = sanitize_response(flow)
    # 4) now you can safely use clean_flow
    print("\033[92mSanitized text:\033[0m")
    print(json.dumps(clean_flow, indent=2))