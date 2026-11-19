FROM node:26-alpine
RUN apk add --no-cache python3
ENV NODE_ENV=production
WORKDIR /app
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --chown=node:node server.mjs commerce.mjs erp.mjs gb-workbook.mjs xlsx-reader.py ./
COPY --chown=node:node public ./public
USER node
CMD ["node", "server.mjs"]
