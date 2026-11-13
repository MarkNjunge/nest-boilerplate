# 26.13.1-alpine3.24
ARG DIGEST="sha256:6bd9ab43c0ec0190ca7b2d193906cb8b7edf6e7f4afa43ddeccd6452710bffb5"
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
