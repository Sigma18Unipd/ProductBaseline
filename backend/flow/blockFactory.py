from __future__ import annotations

import logging
import threading
from abc import ABC
from typing import Optional, Dict, List
from .block import Block
from flow.blocks import *  # noqa: F403

logger = logging.getLogger(__name__)


class BlockFactory(ABC):
    _instance: Optional["BlockFactory"] = None
    _lock = threading.Lock()
    _initialized = False
    _imported = False

    def __init__(self):
        self._registry: Dict[str, type[Block]] = {}
        self._registry_lock = threading.RLock()

        if not self._initialized:
            with self._registry_lock:
                    self._initialized = True   
                    logging.debug("BlockFactory initialized")

    @classmethod
    def get_block_factory(cls) -> "BlockFactory":
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance

    def _import_block_types(self):
        if not self._imported:
            try:
                self._imported = True
                logger.debug("Importing block types from flow.blocks")
                import flow.blocks as blocks_package
                import pkgutil
                import importlib

                # Get the path to the blocks package
                blocks_path = blocks_package.__path__  # type: ignore

                # Import all Python modules in the blocks package
                for importer, modname, ispkg in pkgutil.iter_modules(
                    blocks_path,
                    blocks_package.__name__ + ".",  # type: ignore
                ):
                    try:
                        importlib.import_module(modname)
                        logger.debug(f"Imported block module: {modname}")
                    except Exception as e:
                        logger.warning(f"Failed to import block module {modname}: {e}")

            except Exception as e:
                logger.error(f"Error importing block types: {e}")


    def register_block(self, block_type: str, block_cls: type[Block]) -> None:
        """Register a Block subclass under a type name"""
        if not issubclass(block_cls, Block):
            raise TypeError("block_cls must be a subclass of Block")
        with self._registry_lock:
            logger.debug(
                f"Registering block type '{block_type}' with class '{block_cls.__name__}'"
            )
            self._registry[block_type] = block_cls

    def create_block(self, block_type: str, **kwargs) -> Block:
        """Create a block instance from the registry"""
        self._import_block_types()
        with self._registry_lock:
            cls = self._registry.get(block_type)
            logger.debug(f"Creating block of type '{block_type}' with class '{cls}', input data: {kwargs.get('input', {})}")
            if cls is None:
                raise ValueError(f"Unknown block type: {block_type}")
            return cls(
                block_id=kwargs.get("id") or kwargs.get("block_id"),
                name=kwargs.get("name"),
                settings=kwargs.get("input"),
            )

    def get_supported_types(self) -> List[str]:
        self._import_block_types()
        with self._registry_lock:
            return list(self._registry.keys())

    def lookup_implemented(self, block_type: str) -> bool:
        """Check if a block type is implemented"""
        self._import_block_types()
        with self._registry_lock:
            return block_type in self._registry
