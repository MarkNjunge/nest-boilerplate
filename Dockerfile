# Builder image
FROM node:14.15.3-alpine3.12 as builder

WORKDIR /app

COPY . .

RUN npm install

RUN npm run build

RUN npm prune --production

# Final image
FROM node:14.15.3-alpine3.12

WORKDIR /app

COPY --from=builder /app/dist /app
COPY --from=builder /app/config config
COPY --from=builder /app/package.json .
COPY --from=builder /app/node_modules node_modules

CMD [ "node", "main.js" ]
