#!/bin/bash

# 🧠 Dynamically detect project root (.env location)
# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Move two levels up to reach project root (../..)
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

# Construct full path to .env file
ENV_PATH="$PROJECT_ROOT/.env"

# 1️⃣ Load environment variables
if [ -f "$ENV_PATH" ]; then
  export $(grep -v '^#' "$ENV_PATH" | xargs)
  echo "🔹 Loaded environment variables from: $ENV_PATH"
else
  echo "❌ .env file not found at: $ENV_PATH"
  exit 1
fi

# 2️⃣ Check if variables are loaded
if [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ] || [ -z "$DB_NAME" ]; then
  echo "❌ Missing required environment variables (DB_USER, DB_PASSWORD, DB_NAME)"
  exit 1
fi

# 3️⃣ Create database
mysql -u "$DB_USER" -p"$DB_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;"

# 4️⃣ Create tables
mysql -u "$DB_USER" -p"$DB_PASSWORD" -D "$DB_NAME" -e "

CREATE TABLE IF NOT EXISTS users (
    id INT NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);
"

echo "✅ Database '$DB_NAME' and tables created successfully!"
