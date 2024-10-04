# GitHub Automation App Setup with Docker

The GitHub Automation App can be deployed using Docker and Docker Compose to run as a service with configurable resource and operation settings. Multiple services can be run simultaneously using different configurations.

## Prerequisites

Make sure the following installed on the system:

- Docker: [Get Docker](https://docs.docker.com/get-docker/)
- Docker Compose: [Get Docker Compose](https://docs.docker.com/compose/install/)

## Project Structure

```bash
.
├── configs/
│   ├── operations/
│   │   └── sample-operation.yml
│   └── resources/
│       └── sample-resource.yml
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
```

## Docker Setup

The `docker-compose.yml` is configured to use a Node.js image and to run the app. This mounts the project directory to the container for live reloading.

### Dockerfile

The [Dockerfile](Dockerfile) is used to create a Docker image for the app.

### Docker Compose File

The [compose.yml](compose.yaml) file sets up a service (automation-app) to run the app:

### Run multiple Services

This allows to run multiple instances of the service with different configurations and ports.

#### This will run the service on port 8080 with the sample-operation.yml configuration.

```bash
PORT=8080 RESOURCE_CONFIG=configs/resources/sample-resource.yml OPERATION_CONFIG=configs/operations/sample-operation.yml docker-compose -p automation-app-1 up -d
```

#### This will run the second service on port 8081 with the sample-operation-2.yml configuration.

```
PORT=8081 RESOURCE_CONFIG=configs/resources/sample-resource.yml OPERATION_CONFIG=configs/operations/sample-operation-2.yml docker-compose -p automation-app-2 up -d

```
