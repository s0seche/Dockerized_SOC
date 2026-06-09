FROM thehiveproject/cortex:latest

USER root

RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    libmagic1 \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

RUN pip3 install cortexutils requests --break-system-packages
