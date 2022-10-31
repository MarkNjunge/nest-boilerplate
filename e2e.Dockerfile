FROM node:16.15.1-alpine3.16

WORKDIR /app

COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json

RUN npm install

COPY . .

CMD [ "npm", "run", "start" ]
