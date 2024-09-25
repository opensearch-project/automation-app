<img src="https://opensearch.org/assets/img/opensearch-logo-themed.svg" height="64px">

- [Welcome!](#welcome)
- [Project Resources](#project-resources)
- [Code of Conduct](#code-of-conduct)
- [Security](#security)
- [License](#license)
- [Copyright](#copyright)

## Welcome!

This repository hosts the source code of an automation app to handle the daily activities of your GitHub Repository.

## Project Resources

The automation app utilizes the [Probot](https://probot.github.io/) framework and [Octokit](https://docs.github.com/en/rest/using-the-rest-api/libraries-for-the-rest-api?apiVersion=2022-11-28) library to perform user-defined operations on top of the resources within GitHub. See [configs](configs/operations/hello-world.yml) yaml for more information.

## Usages

### Service

A **Service** is an instance of the app that manages and manipulates specific `Resource` while performing defined `Operation`.

- **Resource**: Objects or entities the service will manage or modify, such as GitHub organizations, project, repositories, issues, etc.
- **Operation**: A list of `Tasks` triggered by events with the resources.
- **Task**: Executed sequentially within an `Operation` to perform action, such as create comments, update labels, add issue to project, etc.
- **Call**: The callstack that contains the implementation of the aformentioned task action.

### Create a Service

To create a service, you need two configuration files:

- **Resource configuration file**: Defines the resources that the service will manage or modify (`configs/resources/sample-resource.yml`).
- **Operation configuration file**: Defines the operations (tasks) that the service will execute with the resources (`configs/resources/sample-operation.yml`).

### Start the Service

Once you have created the resource and operation configuration files, follow these steps to start the service:

1. Set the `RESOURCE_CONFIG` environment variable to the path of the resource configuration YAML file.
1. Set the `OPERATION_CONFIG` environment variable to the path of the operation configuration YAML file.
1. Run the service using the following command:

```bash
RESOURCE_CONFIG=configs/resources/sample-resource.yml OPERATION_CONFIG=configs/operations/sample-operation.yml npm start
```

When you run the above command, the following takes place:

1. The app starts a `Service` instance based on the specified configurations.
1. Retrieves the [GitHub Context](https://probot.github.io/api/latest/classes/context.Context.html) (or any other defined context) for all the resources listed in the resource config file.
1. Registers and listens for events, executes the `Tasks` defined in the operation config. These tasks will be executed sequentially when the corresponding events occur.

## Code of Conduct

This project has adopted [the Open Source Code of Conduct](CODE_OF_CONDUCT.md).

## Security

If you discover a potential security issue in this project we ask that you notify OpenSearch Security directly via email to security@opensearch.org. Please do **not** create a public GitHub issue.

## License

This project is licensed under the [Apache v2.0 License](LICENSE).

## Copyright

Copyright OpenSearch Contributors. See [NOTICE](NOTICE) for details.
