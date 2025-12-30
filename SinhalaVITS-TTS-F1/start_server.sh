#!/bin/bash
# Helper script to start/stop the Flask server

PORT=8000
PID_FILE="flask_server.pid"

case "$1" in
  start)
    # Check if port is already in use
    if lsof -ti:$PORT > /dev/null 2>&1; then
      echo "Port $PORT is already in use. Stopping existing process..."
      lsof -ti:$PORT | xargs kill -9 2>/dev/null
      sleep 2
    fi
    
    # Activate virtual environment and start server
    source venv/bin/activate
    nohup python app.py > flask_server.log 2>&1 &
    echo $! > $PID_FILE
    echo "Flask server started on port $PORT (PID: $(cat $PID_FILE))"
    echo "Logs: tail -f flask_server.log"
    ;;
    
  stop)
    if [ -f $PID_FILE ]; then
      PID=$(cat $PID_FILE)
      if ps -p $PID > /dev/null 2>&1; then
        kill $PID
        rm $PID_FILE
        echo "Flask server stopped"
      else
        echo "Process not found, cleaning up PID file"
        rm $PID_FILE
      fi
    else
      # Try to kill by port
      if lsof -ti:$PORT > /dev/null 2>&1; then
        lsof -ti:$PORT | xargs kill -9
        echo "Flask server stopped (killed by port)"
      else
        echo "No Flask server running"
      fi
    fi
    ;;
    
  status)
    if [ -f $PID_FILE ]; then
      PID=$(cat $PID_FILE)
      if ps -p $PID > /dev/null 2>&1; then
        echo "Flask server is running (PID: $PID)"
        curl -s http://localhost:$PORT/api/health | python3 -m json.tool 2>/dev/null || echo "Server not responding"
      else
        echo "Flask server is not running (stale PID file)"
      fi
    elif lsof -ti:$PORT > /dev/null 2>&1; then
      echo "Port $PORT is in use but no PID file found"
      lsof -ti:$PORT
    else
      echo "Flask server is not running"
    fi
    ;;
    
  restart)
    $0 stop
    sleep 2
    $0 start
    ;;
    
  *)
    echo "Usage: $0 {start|stop|status|restart}"
    exit 1
    ;;
esac

