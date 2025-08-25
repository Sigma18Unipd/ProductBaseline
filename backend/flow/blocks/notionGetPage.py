from notion_client import Client
from typing import Any, Dict
from flow.block import Block
from flow.blockFactory import BlockFactory


class NotionGetPage(Block):
    """Block that retrieves a page from Notion
       and returns its full text as one string.
    """

    def validate_inputs(self) -> bool:
        token = self._get_input("internalIntegrationToken")
        if not token:
            self._log("Missing required input: internalIntegrationTokenn", "ERROR")
            return False

        page_id = self._get_input("pageID")
        if not page_id:
            self._log("Missing required input: pageID", "ERROR")
            return False

        return True

    def execute(self) -> Dict[str, Any]:
        token = self._get_input("internalIntegrationToken")
        page_id = self._get_input("pageID")
        self._log(f"Retrieving Notion page {page_id}")

        try:
            client = Client(auth=token)
            text_pieces = []
            def fetch_blocks(block_id: str):
                children = client.blocks.children.list(block_id=block_id).get("results", []) # type: ignore
                for blk in children:
                    # Handle paragraphs, headings, list items, etc.
                    for key in ["paragraph", "heading_1", "heading_2", "heading_3", "bulleted_list_item", "numbered_list_item", "to_do"]:
                        if key in blk:
                            rich_text = blk[key].get("rich_text", [])
                            if rich_text:
                                text_pieces.append("".join([run.get("plain_text", "") for run in rich_text]))
                    if blk.get("has_children"):
                        fetch_blocks(blk["id"])

            fetch_blocks(page_id)

            full_page_text = "\n".join(text_pieces)
            self.output["properOut"] = full_page_text
            self._log(f"Retrieved and concatenated Notion page {page_id}")

            return {
                "status": "completed",
                "type": "notionGetPage",
            }

        except Exception as e:
            self._log(f"Error retrieving Notion page: {e}", "ERROR")
            return {
                "status": "error",
                "type": "notionGetPage",
                "error": str(e)
            }


BlockFactory.get_block_factory().register_block("notionGetPage", NotionGetPage)