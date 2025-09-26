#!/bin/bash

# Exit on any error
set -e

# Wait for database to be ready
echo "Waiting for PostgreSQL to be ready..."
while ! nc -z db 5432; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done
echo "PostgreSQL is up - continuing..."

# Give PostgreSQL a moment to fully initialize
sleep 2

# Run migrations in order
echo "Running database migrations..."

echo "Migrating organizations..."
python manage.py migrate organizations

echo "Migrating users..."
python manage.py migrate users

echo "Migrating projects..."
python manage.py migrate projects

echo "Running final migration..."
python manage.py migrate

echo "All migrations completed successfully!"



echo "Starting Django application..."

# Start the application
exec "$@"