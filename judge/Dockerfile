FROM node:24-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive

# Toolchains for the compiled languages plus the two real SQL servers used by
# the SQL judge: MariaDB and PostgreSQL.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        gcc \
        g++ \
        python3 \
        python3-psycopg2 \
        python3-mysqldb \
        openjdk-17-jdk-headless \
        mono-mcs \
        golang-go \
        php-cli \
        kotlin \
        time \
        coreutils \
        ca-certificates \
        mariadb-server \
        mariadb-client \
        postgresql-15 \
    && rm -rf /var/lib/apt/lists/* /var/lib/mysql /var/log/mysql

# Pre-initialized MariaDB data directory. Copying this template is much faster
# (and cheaper) than running mariadb-install-db for every test. Small InnoDB
# buffers keep the copy inside the judge container's tmpfs.
RUN mariadb-install-db \
        --datadir=/opt/mysql-template \
        --auth-root-authentication-method=normal \
        --skip-test-db \
        --innodb-log-file-size=4M \
        --innodb-buffer-pool-size=8M \
    && chown -R 65534:65534 /opt/mysql-template \
    && chmod 700 /opt/mysql-template

# Pre-initialized PostgreSQL 15 cluster. initdb runs once at build time; each
# test copies this directory and starts its own server on a private socket.
RUN mkdir -p /opt/postgres-template \
    && chown postgres:postgres /opt/postgres-template \
    && su postgres -c "/usr/lib/postgresql/15/bin/initdb \
        -D /opt/postgres-template \
        --auth=trust \
        --username=postgres \
        --no-locale \
        --encoding=UTF8" \
    && chown -R 65534:65534 /opt/postgres-template \
    && chmod 700 /opt/postgres-template

RUN node --version \
    && python3 --version \
    && python3 -c "import psycopg2" \
    && python3 -c "import MySQLdb" \
    && javac -version \
    && g++ --version | head -n 1 \
    && mcs --version | head -n 1 \
    && go version \
    && php --version | head -n 1 \
    && kotlinc -version 2>&1 | head -n 1 \
    && mariadbd --version \
    && mariadb --version \
    && /usr/lib/postgresql/15/bin/postgres --version \
    && test -x /usr/bin/time \
    && test -x /usr/bin/timeout

COPY harness.py /harness.py
COPY sql-runner.py /sql-runner.py
COPY sql_compat.py /sql_compat.py
COPY mysql-runner.py /mysql-runner.py
COPY postgres-runner.py /postgres-runner.py
COPY shopsphere.sql /shopsphere.sql
COPY shopsphere.mysql.sql /shopsphere.mysql.sql
COPY shopsphere.postgres.sql /shopsphere.postgres.sql

LABEL org.opencontainers.image.title="PAUOJ judge sandbox"
LABEL org.opencontainers.image.description="Universal language image for sandboxed PAUOJ runs (SQLite, MariaDB, PostgreSQL)"
WORKDIR /work
CMD ["/bin/true"]
