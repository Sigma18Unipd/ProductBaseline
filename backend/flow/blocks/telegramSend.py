from typing import Any, Dict
import requests
from flow.block import Block
from flow.blockFactory import BlockFactory


class TelegramSendMessage(Block):
	"""Block that sends a message via Telegram Bot API.

	Expects input data to contain `botToken`, `chatId`, and `message` fields.
	"""

	def validate_inputs(self) -> bool:
		botToken = self.input.get("botToken")
		if not botToken:
			self._log("Missing required input: botToken", "ERROR")
			return False
		
		chatId = self.input.get("chatId")
		if not chatId:
			self._log("Missing required input: chatId", "ERROR")
			return False
		
		message = self.input.get("message")
		if not message:
			self._log("Missing required input: message", "ERROR")
			return False
		
		return True

	def execute(self) -> Dict[str, Any]:
		botToken = self.input.get("botToken")
		chatId = self.input.get("chatId")
		message = self.input.get("message")
		
		self._log(f"Sending message to Telegram bot {botToken} in chat {chatId}: {message}")
		
		url = f'https://api.telegram.org/bot{botToken}/sendMessage'
		payload = {
			'chat_id': chatId,
			'text': message
		}
		
		try:
			response = requests.post(url, data=payload)
			self._log(f"Telegram response: {response.status_code} - {response.text}")
			
			return {
				"status": "completed", 
				"type": "telegramSendMessage", 
				"response": response.json()
			}
		except Exception as e:
			self._log(f"Error sending Telegram message: {str(e)}", "ERROR")
			return {
				"status": "error",
				"type": "telegramSendMessage",
				"error": str(e)
			}


BlockFactory.get_block_factory().register_block("telegramSendBotMessage", TelegramSendMessage)