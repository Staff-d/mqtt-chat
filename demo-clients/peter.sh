#!/usr/bin/env bash

set -eu
set -o xtrace

mosquitto_sub -h localhost -t chat/status/+ -u peter -P test -F '{"topic":"%t","payload":%p}' \
  --will-qos 1 --will-retain --will-topic chat/status/peter --will-payload '{"status":"offline","lastOnlineTimestamp":"'"$(date -Iseconds)"'"}' &
STATUS_PID="$!"

echo "$STATUS_PID"
function exitTrap() {
    echo "Exiting..."
    kill "$STATUS_PID"
}
trap exitTrap SIGINT

#mosquitto_pub -h localhost -u peter -P test -t chat/status/peter \
#  -q 1 -m '{"status":"offline","lastOnlineTimestamp":"'"$(date -Iseconds)"'"}'

LAST_MESSAGE=''
while true; do
    LAST_MESSAGE_AND_TOPIC=$(mosquitto_sub -h localhost -t chat/messages/peter/+ -C 1 -u peter -P test -F '{"topic":"%t","payload":%p}')

    echo "$LAST_MESSAGE_AND_TOPIC"
    LAST_MESSAGE=$(echo "$LAST_MESSAGE_AND_TOPIC" | jq -r '.payload')
    LAST_TOPIC=$(echo "$LAST_MESSAGE_AND_TOPIC" | jq -r '.topic')
    if [ -z "$LAST_MESSAGE" ]; then
        continue
    fi
    echo "->Received message[$LAST_TOPIC]: $LAST_MESSAGE"

    LAST_MESSAGE_CONTENT=$(echo "$LAST_MESSAGE" | jq -r '.content')
    LAST_SENDER=$(echo "$LAST_MESSAGE_AND_TOPIC" | jq -r '.topic|split("/")|.[3]')
    NEW_MESSAGE=$(echo "$LAST_MESSAGE" \
      | jq ".messageId = \"$(tr -dc A-Za-z0-9 </dev/urandom | head -c 13; echo)\"" \
      | jq ".content = \"you said $LAST_MESSAGE_CONTENT\"" \
    )

    TOPIC_NAME="chat/messages/$LAST_SENDER/peter"
    echo "<-Sending message [$TOPIC_NAME]: $NEW_MESSAGE"
    mosquitto_pub -h localhost -t "$TOPIC_NAME" -u peter -P test -m "$NEW_MESSAGE"
done

