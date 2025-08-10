FROM docker.io/node:24-alpine3.20 AS base
WORKDIR /usr/src
COPY ./package.json pnpm-lock.yaml ./
RUN npm install -g pnpm@latest && pnpm install
COPY . .

FROM base AS dev
EXPOSE 5173
CMD ["pnpm", "run", "dev", "--host", "0.0.0.0"]

FROM base AS build
RUN pnpm run build

FROM docker.io/nginx:mainline AS prod
COPY --from=build /usr/src/dist /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 5173
CMD ["nginx", "-g", "daemon off;"]