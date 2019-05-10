FROM node:10.15.3-jessie-slim

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json .

RUN yarn

COPY . .

CMD [ "yarn", "start:prod" ]