FROM debian:stable-slim

RUN apt-get update && apt-get install -y \
    curl ca-certificates wget \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g @kilocode/cli

EXPOSE 4096

VOLUME ["/workspace/data"]

WORKDIR /workspace

CMD ["kilo", "serve", "--port", "4096", "--hostname", "0.0.0.0"]
