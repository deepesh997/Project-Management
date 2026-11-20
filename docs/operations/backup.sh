#!/usr/bin/env bash
# WorkSphere Automated Database Backup Script
set -euo pipefail

BACKUP_DIR="/var/backups/worksphere"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/worksphere_backup_${TIMESTAMP}.sql.gz"
ENCRYPTION_RECIPIENT="ops@worksphere.io"

echo "[$(date)] Starting database backup for WorkSphere..."
mkdir -p "${BACKUP_DIR}"

# Dump PostgreSQL database using pg_dump with custom compression
PGPASSWORD="${POSTGRES_PASSWORD:-worksphere_secure_db_pass_2026}" pg_dump \
  -h "${PGHOST:-localhost}" \
  -U "${PGUSER:-worksphere_user}" \
  -d "${PGDATABASE:-worksphere}" \
  --format=custom \
  --no-owner \
  --no-privileges \
  | gzip -9 > "${BACKUP_FILE}"

echo "[$(date)] Backup completed successfully: ${BACKUP_FILE} ($(du -sh "${BACKUP_FILE}" | cut -f1))"

# Checksum verification
sha256sum "${BACKUP_FILE}" > "${BACKUP_FILE}.sha256"
echo "[$(date)] SHA256 checksum generated."

# Retain last 14 days of backups
find "${BACKUP_DIR}" -name "worksphere_backup_*.sql.gz*" -mtime +14 -exec rm {} \;
echo "[$(date)] Old backups purged (>14 days)."
