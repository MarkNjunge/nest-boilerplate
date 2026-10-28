# 24.22.1-alpine3.24
ARG DIGEST="sha256:06d7adf3e0ef61a13f1d28682726366f97a15aa1888c934d3ecec86c33918b53"
ARG NODE_IMAGE=node@${DIGEST}

FROM ${NODE_IMAGE}

WORKDIR /app

COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json

RUN npm install

COPY . .

CMD [ "npm", "run", "start:e2e" ]
