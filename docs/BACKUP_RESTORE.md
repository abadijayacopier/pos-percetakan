# Backup & Restore POS Abadi Jaya

## Backup MySQL

Set DB_HOST, DB_PORT (optional), DB_USER, DB_PASS, DB_NAME, and optionally BACKUP_DIR.

Run:

    node server/scripts/backup-mysql.js

The utility uses mysqldump with --single-transaction, --routines, --triggers, and --events and never prints the database password.

## Restore

Restore only into a verified target database. Do not restore over production before taking a fresh backup.

    mysql -h "$DB_HOST" -P "${DB_PORT:-3306}" -u "$DB_USER" -p "$DB_NAME" < backups/pos_abadi_<timestamp>.sql

## Restore verification checklist

1. Login works.
2. transactions, cash_flow, products, stock_movements, orders, order_items, and material_movements are present.
3. Financial reconciliation reports zero variance for a controlled test period.
4. Stock reconciliation reports expected variances only.
5. A test transaction can be created, paid, voided, and audited.

A backup is operationally valid only after a restore has been successfully tested.