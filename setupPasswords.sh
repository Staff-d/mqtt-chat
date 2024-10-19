#!/usr/bin/env bash
set -eu

OUTFILE=$(mktemp)

mosquitto_passwd -b "$OUTFILE" admin admin
mosquitto_passwd -b "$OUTFILE" sebastian test
mosquitto_passwd -b "$OUTFILE" peter test
mosquitto_passwd -b "$OUTFILE" hannes test

cat "$OUTFILE"