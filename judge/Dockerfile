FROM node:24-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        gcc \
        g++ \
        python3 \
        openjdk-17-jdk-headless \
        mono-mcs \
        golang-go \
        php-cli \
        kotlin \
        time \
        coreutils \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN node --version \
    && python3 --version \
    && javac -version \
    && g++ --version | head -n 1 \
    && mcs --version | head -n 1 \
    && go version \
    && php --version | head -n 1 \
    && kotlinc -version 2>&1 | head -n 1 \
    && test -x /usr/bin/time \
    && test -x /usr/bin/timeout

COPY harness.py /harness.py

LABEL org.opencontainers.image.title="PAUOJ judge sandbox"
LABEL org.opencontainers.image.description="Universal language image for sandboxed PAUOJ runs"
WORKDIR /work
CMD ["/bin/true"]
