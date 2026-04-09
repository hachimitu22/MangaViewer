FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci --omit=dev
RUN npm install pg pg-hstore --omit=dev --no-save

COPY src ./src
COPY scripts ./scripts

RUN mkdir -p /app/var/contents /app/var/logs

ENV NODE_ENV=production
ENV PORT=3000
ENV APP_ORIGIN=http://localhost:3000
EXPOSE 3000

CMD ["node", "./src/server.js"]
