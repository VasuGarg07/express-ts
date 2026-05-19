# ---------- Base ----------
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

# ---------- Dev ----------
FROM base AS dev
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "run", "dev"]

# ---------- Build ----------
FROM base AS build
RUN npm install
COPY . .
RUN npm run build

# ---------- Prod ----------
FROM node:20-alpine AS prod
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 5000
CMD ["node", "dist/index.js"]