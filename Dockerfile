FROM node:10.9.0-alpine

RUN npm install ts-node -g

ENTRYPOINT [ "ts-node", "index.ts" ]