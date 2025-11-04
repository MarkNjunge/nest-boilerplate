FROM node:24.11.0-alpine3.22

WORKDIR /app

COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json

RUN npm install

COPY . .

CMD [ "npm", "run", "start:e2e" ]
