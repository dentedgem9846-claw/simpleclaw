FROM debian:stable-slim

RUN apt-get update && apt-get install -y \
    curl ca-certificates sqlite3 libsqlite3-0 libgmp10 libnuma1 libssl3 netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

RUN curl -L -o /usr/local/bin/simplex-chat \
    "https://github.com/simplex-chat/simplex-chat/releases/latest/download/simplex-chat-ubuntu-22_04-x86_64" \
    && chmod +x /usr/local/bin/simplex-chat

EXPOSE 5225

VOLUME ["/data"]

CMD ["simplex-chat", "-p", "5225", "-d", "/data"]
