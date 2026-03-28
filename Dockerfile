# 24.14.1-alpine3.23
ARG DIGEST="sha256:01743339035a5c3c11a373cd7c83aeab6ed1457b55da6a69e014a95ac4e4700b"
ARG NODE_IMAGE=node@${DIGEST}

# Builder image
FROM ${NODE_IMAGE} AS builder

WORKDIR /app

COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json

RUN npm install

COPY . .

RUN npm run build

RUN npm prune --production

# Final image
FROM ${NODE_IMAGE}

WORKDIR /app

COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/config config
COPY --from=builder /app/package.json .
COPY --from=builder /app/node_modules node_modules

CMD [ "npm", "run", "start:prod" ]
