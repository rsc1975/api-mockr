
[![codecov](https://codecov.io/gh/rsc1975/api-mockr/branch/main/graph/badge.svg?token=IHB0J0OOPQ)](https://codecov.io/gh/rsc1975/api-mockr)
[![Code size](https://img.shields.io/github/languages/code-size/rsc1975/api-mockr?logo=github&logoColor=white)](https://github.com/rsc1975/api-mockr)
[![License](https://img.shields.io/github/license/rsc1975/api-mockr?logo=open-source-initiative&logoColor=green)](https://github.com/rsc1975/api-mockr/blob/main/LICENSE)
[![CI](https://img.shields.io/github/workflow/status/rsc1975/api-mockr/Docker%20image?logo=github)](https://github.com/rsc1975/api-mockr/actions/workflows/dockerhub-upload.yml)
[![Last Commit](https://img.shields.io/github/last-commit/rsc1975/api-mockr?logo=github)](https://github.com/rsc1975/api-mockr/commits/main)
[![Docker version](https://img.shields.io/docker/v/dvlprtech/api-mockr?sort=semver&logo=docker)](https://hub.docker.com/r/dvlprtech/api-mockr)
[![NPM version](https://img.shields.io/npm/v/api-mockr?logo=npm)](https://www.npmjs.com/package/api-mockr)


# api-mockr

Just another API mocker that can be configured to response random and specific data. It can help testing integrations with third parties. It's specially useful to create integration tests where we need to interact with an external service, so we can customize the response for different services exactly as we expect the external service responses. 

Currently, only REST API responses are supported.

# Getting started

This is a NodeJS application, you can install it as dev dependency in your project or as independent project, there is also a [Docker Image](https://hub.docker.com/r/dvlprtech/api-mockr).

## Installation

Installation as dev dependency:

```sh
npm install --save-dev api-mockr
```	

Installation as docker image:

```sh
docker pull dvlprtech/api-mockr
```

For further details about the use with docker you can access to DockerHub [api-mockr image](https://hub.docker.com/r/dvlprtech/api-mockr) page.

## How to use

You can use the CLI tool `api-mockr` to start the application:

```sh
npx api-mockr
```

The following output will apear:

```
Server running at: http://0.0.0.0:3003
```

There are several options params that can be used to configure the server:

* `--port`: The port to listen to. Default is `3003`.
* `--host`: The host to listen to. Default is `0.0.0.0`.
* `--silent`: If present, the server will not output any message. By default, the server will print every request with the basic info about the response.
* `--verbose`: If present, the server will print every request with its params and payload and the applied server configuration when the server is created.
* `--config`: The path to the config file. It's a multivalue param.
* `--apiPrefix`: The prefix to invoque the API services. Default is `/`. If set all mocked routes should be invoked with this prefix. I.e. The configured route `/v1/users` should be invoked as `/api/v1/users` if we use `--apiPrefix=/api`.

Example of use:
    
```sh
$ npx api-mockr --port=13003 --host=localhost --apiPrefix=/api
[🟢 api-mockr] Server running at: http://localhost:13003/api
```

Without additional configuration, the default server will response with the following data to whatever request:

```txt
$ curl 'http://localhost:3003/api/whatever?foo=bar'
{"success":true,"request":{"path":"/api/whatever","params":{"foo":"bar"}}}
```

There is an exception, the call to `/` will return a fixed text, that can be used to "ping" the server.
```txt
$ curl 'http://localhost:3003/'
API Mockr
```

## Special params

There are some special params that can be used with each request:

* `_pretty`: If it's set to `true`, the response will be pretty printed.
* `_delay`: The delay in milliseconds to wait before responding. By default 0.
* `_forceError`: If it's set to `true`, the response will be an error with a http status code of `500` by default.

The error response can be customized with 2 header:

* `x-mocker-force-error'`: HTTP status code to be returned, can be any value between `400` and `599`. Values out of range will be ignored.
* `x-mocker-error-msg`: The error message to be returned, you can use variables in the message, like `"ERROR: ${random.emoji} ${random.phrase}"`.

Example of error response:

```txt
$ curl 'http://localhost:3003/api/whatever?foo=bar&_forceError=true&_pretty=1'
{
  "success": false,
  "error": "Error in request to path: /api/whatever",
  "request": {
    "body": null,
    "params": {
      "foo": "bar",
      "_forceError": "true",
      "_pretty": "1"
    }
  }
}
```

Customizing the message and code:

```txt
$ curl -H "x-mocker-force-error: 418" -H 'x-mocker-error-msg: ERROR: ${random.emoji} ${random.phrase}' 'http://localhost:3003/api/whatever?foo=bar&_forceError=true&_pretty=1'
{
  "success": false,
  "error": "ERROR: 🐭 You cant quantify the driver without transmitting the multi-byte SQL microchip!",
  "request": {
    "body": null,
    "params": {
      "foo": "bar",
      "_forceError": "true",
      "_pretty": "1"
    }
  }
```

The emoji and the error phrase will be different with each call.

## Server configuration

The config files can be read in YAML and JSON formats, the default config file is like this:

```yaml
defaultResponse:
  success: true
  timestamp: ${server.isoDatetime}
  request:
    path: ${request.path} 
    body: ${request.payload}
    params: ${request.params}
errorResponse:
  $httpStatus$: 500
  success: false
  error: "${error}"
  request:
    body: ${request.payload}
    params: ${request.params}
routes:
  get: 
    "say-whatever":
      success: true 
      author: ${random.personFirstName}
      phrase: ${random.phrase}
```

There are 3 main sections in the config file:

* `defaultResponse`: The default response to be returned when there is no match for the request path and the configured routes
* `errorResponse`: The error response payload to be returned when an error occurs.
* `routes`: The routes to be mocked grouped by HTTP method (get, post, put, ...). A wildcard (`*`) can be used to match any method and/or any path.

## Variables in configuration

We can use variables in the configuration files to provide dynamic values with every response. There are several variables types:

* `random`: Random values for all sort of data. i.e. `random.personFullName`, `random.integer`, `random.department`, ...
* `request`: Values from the request. i.e. `request.path`, `request.params`, `request.payload`
* `server`: Values from the server. i.e. `server.timestamp`, `server.isoDate`, ...
* Path variables: Variables created in the config file to refer a path section. i.e. A configured route like `/api/users/${username}` will create a variable `username` with value "bob23" for a request path like `/api/users/bob23`, this variable can be used in the route response (`... "author": "${username}", ...`).

Some of the variables accept parameters, the params should be added after a dot (`variable.paramValue`) for example:

* `request.params.foo`: In requests like `/api/whatever?foo=bar` It will return `bar`.
* `random.personFirstName.male`: This params accepts `male` or `female` as possible input values
* `random.choose.monday.sunday.tuesday`: This params accepts a variable number of params and It will return one of them randomly.

For further informaton about the supported variables, please refer to the [VARS.md](https://github.com/rsc1975/api-mockr/blob/main/VARS.md) file.

There are several examples of config files in [examples directory](./examples).

