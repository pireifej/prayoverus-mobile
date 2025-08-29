#!/bin/bash

# Start ngrok tunnel for API access from Expo app
echo "Starting ngrok tunnel for API access..."

# Kill any existing ngrok processes
pkill -f ngrok

# Start ngrok tunnel for port 5000 (backend API)
ngrok http 5000 &

# Wait a moment for ngrok to start
sleep 3

# Get the ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*"' | head -1 | cut -d '"' -f 4)

if [ ! -z "$NGROK_URL" ]; then
    echo "Backend API available at: $NGROK_URL"
    echo "Use this URL in the Expo app for API calls"
else
    echo "Failed to get ngrok URL. Check if ngrok is installed."
fi

# Keep script running
echo "Press Ctrl+C to stop the tunnel"
wait