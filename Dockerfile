# 24.22.1-alpine3.24
ARG DIGEST="sha256:06d7adf3e0ef61a13f1d28682726366f97a15aa1888c934d3ecec86c33918b53"
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
