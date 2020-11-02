FROM node:12.4.0-alpine

RUN npm install typescript ts-node -g

ENTRYPOINT [ "ts-node", "index.ts" ]