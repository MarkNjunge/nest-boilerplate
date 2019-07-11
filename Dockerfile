FROM node:10.15.3-jessie-slim

# Create app directory
WORKDIR /usr/src/app

# Copy source
COPY . .

# Install dependencies
RUN yarn

# Create dist folder
RUN yarn build

CMD [ "node", "dist/main.js" ]