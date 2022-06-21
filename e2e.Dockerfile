FROM node:16.15.1-alpine3.16

WORKDIR /app

COPY . .

RUN npm install

CMD [ "npm", "run", "start" ]
