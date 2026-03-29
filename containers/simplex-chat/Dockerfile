FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    curl ca-certificates libgmp10 libnuma1 expect socat \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -m -s /bin/bash simplex && \
    mkdir -p /home/simplex/.simplex /home/simplex/bin && \
    chown -R simplex:simplex /home/simplex

WORKDIR /home/simplex

USER simplex

RUN curl -o- https://raw.githubusercontent.com/simplex-chat/simplex-chat/stable/install.sh | bash

ENV PATH="/home/simplex/.local/bin:${PATH}"

USER root

COPY --chmod=755 entrypoint.sh /usr/local/bin/entrypoint.sh
COPY --chmod=755 init-user.exp /usr/local/bin/init-user.exp

USER simplex

ENV SIMPLEX_USER=SimpleClaw

VOLUME ["/home/simplex/.simplex"]

EXPOSE 5225

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
