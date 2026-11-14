#!/bin/bash
set -euo pipefail
# Este script roda apenas na primeira inicializacao do volume.
psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  --set ON_ERROR_STOP=1 --set app_password="$SOS_APP_PASSWORD" <<'SQL'
CREATE ROLE sos_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE
  PASSWORD :'app_password';
GRANT CONNECT ON DATABASE sos_transito_dev TO sos_app;
GRANT USAGE ON SCHEMA public TO sos_app;
ALTER DEFAULT PRIVILEGES FOR ROLE sos_owner IN SCHEMA public
  GRANT SELECT ON TABLES TO sos_app;
SQL
