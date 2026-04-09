#!/bin/sh
set -eu

echo "Applying CRM migrations..."
npm run prisma:migrate:deploy

echo "Syncing chat schema..."
npm run prisma:push:chat -- --skip-generate

echo "Starting backend..."
exec npm run start:backend
