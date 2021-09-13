FROM node:12.4.0-alpine

WORKDIR /src
COPY . /src
RUN npm install typescript ts-node -g
RUN npm install

ENTRYPOINT [ "ts-node", "/src/index.ts" ]