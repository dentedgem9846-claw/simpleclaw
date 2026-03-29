#!/bin/bash
set -e

DB_DIR="/home/simplex/.simplex"
DB_FILE="$DB_DIR/simplex_v1_chat.db"
USER_NAME="${SIMPLEX_USER:-SimpleClaw}"
INTERNAL_PORT=5226
EXTERNAL_PORT=5225

if [ -f "$DB_FILE" ]; then
    echo "Database exists, starting in API mode..."
else
    echo "First run detected. Creating user profile: $USER_NAME"
    /usr/local/bin/init-user.exp "$USER_NAME" || true

    if [ ! -f "$DB_FILE" ]; then
        echo "Warning: Database file not found, but continuing..."
    else
        echo "User profile created successfully!"
    fi
fi

echo "Starting socat proxy (0.0.0.0:$EXTERNAL_PORT -> 127.0.0.1:$INTERNAL_PORT)..."
socat TCP-LISTEN:$EXTERNAL_PORT,fork,reuseaddr TCP:127.0.0.1:$INTERNAL_PORT &

echo "Starting SimpleX CLI in API mode on internal port $INTERNAL_PORT..."
exec simplex-chat -p $INTERNAL_PORT
