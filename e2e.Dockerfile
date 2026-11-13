# 26.13.1-alpine3.24
ARG DIGEST="sha256:6bd9ab43c0ec0190ca7b2d193906cb8b7edf6e7f4afa43ddeccd6452710bffb5"
ARG NODE_IMAGE=node@${DIGEST}

FROM ${NODE_IMAGE}

WORKDIR /app

COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json

RUN npm install

COPY . .

CMD [ "npm", "run", "start:e2e" ]
