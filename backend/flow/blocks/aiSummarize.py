from typing import Any, Dict
from flow.block import Block
from flow.blockFactory import BlockFactory
from llm.llmFacade import summary_facade

class AiSummarize(Block):
    """Block that summarizes text using an AI model.

    Expects input data to contain a `text` field (str).
    """

    def validate_inputs(self) -> bool:
        return True
    def execute(self) -> Dict[str, Any]:
        super().execute()
        message=""
        if self._get_input("properOut") != "":
            message = self._get_input("properOut")
        elif self._get_input("logOut") != "":
            message = self._get_input("logOut")
        
        grrpow = summary_facade(message)
        self.output["properOut"] = grrpow
        return {"status": "completed", "type": "aiSummarize", "summary": grrpow}        

BlockFactory.get_block_factory().register_block("aiSummarize", AiSummarize)