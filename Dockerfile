FROM node:12.4.0-alpine

WORKDIR /src
COPY . /src
RUN npm install @types/node --save
RUN npm install typescript ts-node -g

ENTRYPOINT [ "ts-node", "/src/index.ts" ]