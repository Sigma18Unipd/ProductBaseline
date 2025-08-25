from typing import Any, Dict
import requests
from flow.block import Block
from flow.blockFactory import BlockFactory
import logging
logger = logging.getLogger(__name__)


class TelegramSendMessage(Block):
	"""Block that sends a message via Telegram Bot API.

	Expects input data to contain `botToken`, `chatId`, and `message` fields.
	"""

	def validate_inputs(self) -> bool:
		botToken = self._get_input("botToken")
		if not botToken:
			self._log("Missing required input: botToken", "ERROR")
			return False
		
		chatId = self._get_input("chatId")
		if not chatId:
			self._log("Missing required input: chatId", "ERROR")
			return False
		
		message = self._get_input("message")
		if not message:
			self._log("Missing required input: message", "ERROR")
			return False
		
		return True

	def execute(self) -> Dict[str, Any]:
		#botToken = self.input.get("botToken")
		#chatId = self.input.get("chatId")
		#message = self.input.get("message")
		
		
		botToken = self._get_input("botToken")
		chatId = self._get_input("chatId")
		message = self._get_input("message")
		logger.debug("message")
		if message == '{{LASTOUTPUT}}':
			logger.debug("grabbing last output")
			if self._get_input("properOut") != "":
				message = self._get_input("properOut")
			elif self._get_input("logOut") != "":
				message = self._get_input("logOut")
			else:
				message = ""
			logger.debug(message)

		self._log(f"Sending message to Telegram bot {botToken} in chat {chatId}: {message}")
		url = f'https://api.telegram.org/bot{botToken}/sendMessage'
		payload = {
			'chat_id': chatId,
			'text': message
		}
		
		try:
			response = requests.post(url, data=payload)
			self._log(f"Telegram response: {response.status_code} - {response.text}")
			logger.log(logging.DEBUG, f"Telegram response: {response.status_code} - {response.text}")
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