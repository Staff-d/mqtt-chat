#!/usr/bin/env bash
set -eu
# This script can be used to setup additional passwords for the mosquitto broker
# It assumes that mosquitto_passwd is available on your path which is the case if you use
# the accompanying shell.nix or have mosquitto installed globally

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
OUTFILE=$(mktemp)

mosquitto_passwd -b "$OUTFILE" admin admin
mosquitto_passwd -b "$OUTFILE" sebastian test
mosquitto_passwd -b "$OUTFILE" peter test
mosquitto_passwd -b "$OUTFILE" hannes test
mosquitto_passwd -b "$OUTFILE" vy test
mosquitto_passwd -b "$OUTFILE" minh test
mosquitto_passwd -b "$OUTFILE" jenny test

cat "$OUTFILE" > "$SCRIPT_DIR/mosquitto-conf/auth/passwordfile"