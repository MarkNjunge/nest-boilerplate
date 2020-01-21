# Builder image
FROM node:12.14.1-alpine3.9 as builder

WORKDIR /app

COPY . .

RUN yarn install

RUN yarn build

# Final image
FROM node:12.14.1-alpine3.9

WORKDIR /app

COPY --from=builder /app/dist /app
COPY --from=builder /app/config config
COPY --from=builder /app/package.json .
COPY --from=builder /app/node_modules node_modules

CMD [ "node", "main.js" ]
