#!/bin/sh
set -eu

psql \
  -v ON_ERROR_STOP=1 \
  -v app_db_name="$APP_DB_NAME" \
  -v chat_db_name="$CHAT_DB_NAME" \
  --username "$POSTGRES_USER" \
  --dbname "$POSTGRES_DB" <<-EOSQL
  SELECT 'CREATE DATABASE "' || :'app_db_name' || '"'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = :'app_db_name')\gexec

  SELECT 'CREATE DATABASE "' || :'chat_db_name' || '"'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = :'chat_db_name')\gexec
EOSQL
