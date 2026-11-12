FROM node:25-alpine
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@12.18.0 --activate
COPY package.json ./
RUN pnpm install --prod
COPY . .
EXPOSE 7860
CMD ["node", "server.js"]
