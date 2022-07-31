# api-mockr Configuration Examples

In the current directory you can find a few examples of how to configure api-mockr routes.

* [`crud-config.yml`](./crud-config.yml): This is a example of how to configure api-mockr routes as CRUD (Create, Retrieve, Update and Delete) operations.
* [`default-config.yml`](./default-config.yml): It redefines the default response for not matched routes.
* [`error-config.yml`](./error-config.yml): It redefines the default response for errors.


## How to apply custom configuration

The configuration files can be YAML or JSON files. All the additional config files will me merged in just one config object.

If you define the same route (http method and path) in more than one config file, the resulting response will be a merged object. However with the sections `defaultResponse` and `errorResponse` the resulting response will be the last one defined (there is no merge).

To use several config files:

```sh
$ npx api-mockr --config crud-config.yml --config default-config.yml --config error-config.yml
```



