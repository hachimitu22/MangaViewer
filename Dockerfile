FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev
RUN npm install pg pg-hstore --omit=dev --no-save

COPY src ./src
COPY scripts ./scripts

RUN mkdir -p /app/var/contents /app/var/logs

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "./src/server.js"]
