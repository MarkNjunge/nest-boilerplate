# Builder image
FROM node:16.15.1-alpine3.16 as builder

WORKDIR /app

COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json

RUN npm install

COPY . .

RUN npm run build

RUN npm prune --production

# Final image
FROM node:16.15.1-alpine3.16

WORKDIR /app

COPY --from=builder /app/dist /app
COPY --from=builder /app/config config
COPY --from=builder /app/package.json .
COPY --from=builder /app/node_modules node_modules

CMD [ "node", "main.js" ]
