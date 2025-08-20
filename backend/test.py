# Reference JSON
# {
#    "nodes": [
#        {
#            "data": {
#                "seconds": "3",
#                "title": "System - Wait (seconds)"
#            },
#            "id": "node-1",
#            "position": {
#                "x": 0,
#                "y": 0
#            },
#            "type": "systemWaitSeconds",
#            "measured": {
#                "width": 267,
#                "height": 78
#            }
#        },
#        {
#            "data": {
#                "botToken": "7881088601:AAGWV8WQ5_dqYk6vRhpnoHFfDDRJ9A9JagQ",
#                "chatId": "-4976500325",
#                "message": "AAAAH"
#            },
#            "id": "node-2",
#            "position": {
#                "x": 365.28229165249184,
#                "y": 152.9319670169303
#            },
#            "type": "telegramSendBotMessage",
#            "measured": {
#                "width": 307,
#                "height": 78
#            },
#            "selected": false,
#            "dragging": false
#        },
#        {
#            "data": {
#                "seconds": "5",
#                "title": "System - Wait (seconds)"
#            },
#            "id": "node-3",
#            "position": {
#                "x": 628.2431953008505,
#                "y": -25.305289506398537
#            },
#            "type": "systemWaitSeconds",
#            "measured": {
#                "width": 267,
#                "height": 78
#            },
#            "selected": false,
#            "dragging": false
#        },
#        {
#            "data": {
#                "botToken": "7881088601:AAGWV8WQ5_dqYk6vRhpnoHFfDDRJ9A9JagQ",
#                "chatId": "-4976500325",
#                "message": "GENERATETHIS"
#            },
#            "id": "node-4",
#            "position": {
#                "x": 921.7247207675637,
#                "y": 133.19699475376487
#            },
#            "type": "telegramSendBotMessage",
#            "measured": {
#                "width": 307,
#                "height": 78
#            },
#            "selected": true,
#            "dragging": false
#        }
#    ],
#    "edges": [
#        {
#            "id": "edge-1",
#            "source": "node-1",
#            "target": "node-2"
#        },
#        {
#            "id": "edge-2",
#            "source": "node-2",
#            "target": "node-3"
#        },
#        {
#            "id": "edge-3",
#            "source": "node-3",
#            "target": "node-4"
#        }
#    ]
# }
# import flow.flowManager.FlowManager
# from flow.flowManager.FlowManager import FlowManager
json_data = {
    "nodes": [
        {
            "data": {
                "seconds": "3",
                "title": "System - Wait (seconds)"
            },
            "id": "node-1",
            "position": {
                "x": 0,
                "y": 0
            },
            "type": "systemWaitSeconds",
            "measured": {
                "width": 267,
                "height": 78
            }
        },
        {
            "data": {
                "botToken": "7881088601:AAGWV8WQ5_dqYk6vRhpnoHFfDDRJ9A9JagQ",
                "chatId": "-4976500325",
                "message": "AAAAH"
            },
            "id": "node-2",
            "position": {
                "x": 365.28229165249184,
                "y": 152.9319670169303
            },
            "type": "telegramSendMessage",
            "measured": {
                "width": 307,
                "height": 78
            }
        },
        {
            "data": {
                "seconds": "5",
                "title": "System - Wait (seconds)"
            },
            "id": "node-3",
            "position": {
                "x": 628.2431953008505,
                "y": -25.305289506398537
            },
            "type": "systemWaitSeconds",
            "measured": {
                "width": 267,
                "height": 78
            }
        },
        {
            "data": {
                "botToken": "7881088601:AAGWV8WQ5_dqYk6vRhpnoHFfDDRJ9A9JagQ",
                "chatId": "-4976500325",
                "message": "GENERATETHIS"
            },
            "id": "node-4",
            "position": {
                "x": 921.7247207675637,
                "y": 133.19699475376487
            },
            "type": "telegramSendMessage",
            "measured": {
                "width": 307,
                "height": 78
            }
        }
    ],
    "edges": [
        {
            "id": "edge-1",
            "source": "node-1",
            "target": "node-2"
        },
        {
            "id": "edge-2",
            "source": "node-2",
            "target": "node-3"
        },
        {
            "id": "edge-3",
            "source": "node-3",
            "target": "node-4"
        }
    ]
}
#FM = FlowManager(json_data)
from flow.flowManager import FlowManager
from flow.block import Block
from flow.blockFactory import BlockFactory
from utils import log  # ensure repository logging config is applied
import logging
logger = logging.getLogger(__name__)
if __name__ == "__main__":
    fm = FlowManager(json_data)
    fm.start_workflow()
    logs = fm._get_all_logs()
