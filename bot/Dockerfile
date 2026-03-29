FROM debian:stable-slim AS builder

RUN apt-get update && apt-get install -y \
    curl ca-certificates \
    python3 make g++ gcc \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build
COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

FROM debian:stable-slim

RUN apt-get update && apt-get install -y \
    curl ca-certificates sqlite3 libsqlite3-0 \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./

RUN apt-get update && apt-get install -y python3 make g++ gcc \
    && npm ci --only=production \
    && apt-get remove -y python3 make g++ gcc \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /build/dist ./dist

EXPOSE 8080

CMD ["node", "dist/index.js"]
