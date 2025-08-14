# syntax=docker/dockerfile:1
#https://docs.docker.com/reference/dockerfile/#syntax

FROM python:3.13.6-alpine3.22 AS base
RUN pip install --no-cache-dir uv

#https://stackoverflow.com/a/72597462
ENV PYTHONUNBUFFERED=1

RUN mkdir /www
WORKDIR /www
COPY ./requirements.txt /www/
RUN uv pip install --system --no-cache-dir -r requirements.txt

FROM base AS dev
ENV FLASK_APP=backend.py
RUN uv pip install --system --no-cache-dir flask
CMD ["flask", "run", "--host=0.0.0.0", "--port=5000"]

FROM base as prod
RUN uv pip install --system --no-cache-dir gunicorn
COPY . .
ENV FLASK_ENV=production
ENV GUNICORN_CMD_ARGS="--bind 0.0.0.0:5000 --workers 4"
CMD ["gunicorn", "backend:app"]