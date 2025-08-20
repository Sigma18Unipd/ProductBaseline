import os
import logging

# Production by default -> WARNING
# Dev mode can be triggered by ENV=dev or DEV=1/true; explicit LOG_LEVEL env overrides
_env = os.getenv("ENV", "").lower()
_dev_flag = os.getenv("DEV", "").lower() in ("1", "true", "yes") or _env == "dev"
LOG_LEVEL = os.getenv("LOG_LEVEL")
if LOG_LEVEL:
    LOG_LEVEL = LOG_LEVEL.upper()
else:
    LOG_LEVEL = "DEBUG" if _dev_flag else "WARNING"

IS_DEV = _dev_flag

root = logging.getLogger()
root.setLevel(LOG_LEVEL)

ch = logging.StreamHandler()
ch.setLevel(LOG_LEVEL)
ch.setFormatter(
    logging.Formatter(
        "%(asctime)s] %(levelname)s %(name)s: %(message)s (%(filename)s:%(lineno)d %(funcName)s())"
    )
)


if not any(isinstance(h, logging.StreamHandler) for h in root.handlers):
    root.addHandler(ch)