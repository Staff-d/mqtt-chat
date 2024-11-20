#!/usr/bin/env bash
set -eu

VICTIM="$1"
if [ -z "$VICTIM" ]; then
  echo "Usage: $0 <victim>"
  exit 1
fi

mosquitto_sub -h localhost -t chat/status/+ -u hannes -P test -F '{"topic":"%t","payload":%p}' \
  --will-qos 1 --will-retain --will-topic chat/status/hannes --will-payload '{"status":"offline","lastOnlineTimestamp":"'"$(date -Iseconds)"'"}' &
STATUS_PID="$!"

echo "$STATUS_PID"
function exitTrap() {
    echo "Exiting..."
    mosquitto_pub -h localhost -u hannes -P test -t chat/status/hannes \
      -q 1 -m '{"status":"offline","lastOnlineTimestamp":"'"$(date -Iseconds)"'"}'
    kill "$STATUS_PID"
}
trap exitTrap SIGINT

mosquitto_pub -h localhost -u hannes -P test -t chat/status/hannes \
  -q 1 -m '{"status":"online","lastOnlineTimestamp":"'"$(date -Iseconds)"'"}'


if [ -z "$VICTIM" ]; then
  LAST_MESSAGE_AND_TOPIC=$(mosquitto_sub -h localhost -t chat/messages/hannes/+ -C 1 -u hannes -P test -F '{"topic":"%t","payload":%p}')
  VICTIM=$(echo "$LAST_MESSAGE_AND_TOPIC" | jq -r '.topic|split("/")|.[3]')
fi
TOPIC_NAME="chat/messages/$VICTIM/hannes"


while true; do
  NEW_MESSAGE=$(echo "{}" | jq ".messageId = \"$(tr -dc A-Za-z0-9 </dev/urandom | head -c 13; echo)\"" \
    | jq ".content = \"Hannes says: it is now $(date)\"" \
    | jq ".timestamp = \"$(date -Iseconds)\"")

  echo "<-Sending message [$TOPIC_NAME]: $NEW_MESSAGE"
  mosquitto_pub -h localhost -t "$TOPIC_NAME" -u hannes -P test -q 1 -m "$NEW_MESSAGE"
  sleep 5

done

