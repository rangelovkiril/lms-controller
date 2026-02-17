# Mosquitto Broker

This folder contains the Docker-ready configuration for the Mosquitto MQTT broker.

Persistent data is stored in data/, which is ignored by Git because of permissions.

## About Mosquitto

[Apache Mosquitto](https://mosquitto.org/) is a lightweight MQTT broker, ideal for real-time message exchange. It is commonly used for telemetry and IoT applications due to its efficiency and reliability.

The current configuration is intended for testing purposes only. There is no authentication or advanced security enabled yet.

## Why Docker?

- **Isolation:** The broker runs in a self-contained environment, avoiding conflicts with local software.  
- **Portability:** Docker ensures the same setup works on any machine.  
- **Ease of use:** Start the broker quickly with minimal configuration, ideal for testing and development.

## Usage

To start the broker, run:

```bash
docker compose up -d
```
