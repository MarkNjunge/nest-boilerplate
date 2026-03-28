# 24.14.1-alpine3.23
ARG DIGEST="sha256:01743339035a5c3c11a373cd7c83aeab6ed1457b55da6a69e014a95ac4e4700b"
ARG NODE_IMAGE=node@${DIGEST}

FROM ${NODE_IMAGE}

WORKDIR /app

COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json

RUN npm install

COPY . .

CMD [ "npm", "run", "start:e2e" ]
