FROM swift:5.10

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        python3 \
        time \
        coreutils \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN swift --version 2>&1 | head -n 1 \
    && python3 --version \
    && test -x /usr/bin/time \
    && test -x /usr/bin/timeout

COPY harness.py /harness.py

LABEL org.opencontainers.image.title="PAUOJ Swift judge sandbox"
LABEL org.opencontainers.image.description="Swift sandbox image for PAUOJ submissions"
WORKDIR /work
CMD ["/bin/true"]
