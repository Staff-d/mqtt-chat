# Demo Clients

This directory contains a few demo clients that can be used as chat partners when running
the chat application. 

They are written as bash scripts and require `mosquitto_pub` and `mosquitto_sub` to be available on the PATH
along with `jq`. If you use the project`s `shell.nix` file, you should have all dependencies available.

## Hannes

Hannes is a simple chat client that sends a message every 5 seconds to the specified user.

## Peter

Peter is an echo client. It echoes everything you send to him.