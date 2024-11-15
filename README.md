# MQTT For Webdevs: Example Chat App

This repository contains a simple chat applications that uses MQTT to exchange the messages between clients.
It is used as a demonstration of the capabilities of the protocol and how they could be used in web applications.

This projects accompanies my talk and [blog post](http://sebastian-staffa.eu/posts/mqtt-for-webdevs) of the same name.

Uses [Vite](https://vitejs.dev/), [Vitest](https://vitest.dev/), and [React Testing Library](https://github.com/testing-library/react-testing-library) to create a modern [React](https://react.dev/) app compatible with [Create React App](https://create-react-app.dev/)

## Setup

This project requires

- node v22
- docker

You can use the accompanying `shell.nix` file or nvm to select the correct node version.
Other node versions may work but are untested.

To get started, run

```
npm install
```

to install the dependencies and

```
docker compose up -d
```

to spin up the MQTT broker.

```
npm run dev
```

start the development server. The application should be served at `http://localhost:5173/`.

## Configuration

The application offers a few settings that configure the features that are available. These
settings corrospond to the chapters in my blogpost

![login mask](login.png "Login mask with expanded options")

- `Use QoS 1` enables QoS 1 for the chat messages.
- `Use Status Messages` enables chat status messages which are sent whenever client comes online
  or goes offline. These message use the retain and lwt features.
- `Use Authentication` decides which broker to use. The docker
  compose file contains two brokers, one with and one without authentication.
- `Deduplicate messages client side` enables the deduplication of incoming chat messages using
  the embedded message id. This filters additional deliveries of the same message when using QoS 0/1.

### About the template

This project was set up using the vite template for redux with the following command:

```sh
npx degit reduxjs/redux-templates/packages/vite-template-redux my-app
```

further reading: [Redux Toolkit](https://redux-toolkit.js.org/)
