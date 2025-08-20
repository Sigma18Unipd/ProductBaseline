
import time
from typing import Any, Dict

from flow.block import Block
from flow.blockFactory import BlockFactory
import logging
logger = logging.getLogger(__name__)

class SystemWaitSeconds(Block):
	"""Block that waits for a specified number of seconds.

	Expects input data to contain a `seconds` field (str or number).
	"""

	def validate_inputs(self) -> bool:
		seconds = self._get_input("seconds")
		if seconds is None:
			logger.error("Missing required input: seconds")
			logger.error("class data: %s", self.__dict__)
			self._log("Missing required input: seconds", "ERROR")
			return False
		try:
			val = float(seconds)
			if val < 0:
				logger.error("Invalid seconds: must be >= 0")
				self._log("Invalid seconds: must be >= 0", "ERROR")
				return False
		except Exception:
			logger.error("Invalid seconds value: not a number")
			self._log("Invalid seconds value: not a number", "ERROR")
			return False
		return True

	def execute(self) -> Dict[str, Any]:
		super().execute()
		seconds = float(self.input.get("seconds", 0))
		self._log(f"Waiting for {seconds} seconds")
		time.sleep(seconds)
		self._log(f"Waited for {seconds} seconds")
		return {"status": "completed", "type": "systemWaitSeconds", "waited": seconds}


BlockFactory.get_block_factory().register_block("systemWaitSeconds", SystemWaitSeconds)

