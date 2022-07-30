## Variables

These are all the supported variables to be used in API Mockr responses:

### random

The applicaton delegates in [@ngneat/falso](https://github.com/ngneat/falso) for most of the fake data generation. We only use a subset of Falso lib fake data generators, if you miss something please ask for it in [GitHub Issues](https://github.com/rsc1975/api-mockr/issues).

* `random.integer`: Integer number (Optional param: Max possible value). I.e. `random.integer` or `random.integer.10`.
* `random.float`: Float value (Optional param: Max possible value, by default 100.0). I.e. `random.float` or `random.float.1000`.
* `random.boolean`: It will return a boolean value, `true` or `false`.
* `random.choose`: It will return a random value from the array passed as param. I.e. `random.choose.saturday.sunday.friday` will return randomly one of: `saturday`, `sunday` or `friday`.
* `random.hexColor`: A string with a random hex color. I.e. `#0f34ac`.
* `random.email`: A random email (Optional params: domain and suffix). I.e. `random.email` or `random.email.gmail.com`.
* `random.personFullName`: A random full name (Optional param: gender, `male` or `female`). I.e: `random.personFullName` or `random.personFullName.female`
* `random.personFirstName`: A random first name (Optional param: gender, `male` or `female`). I.e: `random.personFirstName` or `random.personFirstName.male`
* `random.personLastName`: A random last name.
* `random.username`: Random username, usually based in random first and last person name.
* `random.url`: A random internet url. I.e: `https://www.whatever-place/with/path`
* `random.city`: A random city name.
* `random.phone`: A random phone number.
* `random.zipCode`: A random zip code.
* `random.country`: A random country name.
* `random.countryCode`: A random country ISO code. I.e: `us`, `fr`, `es`, ...
* `random.emoji`: A random emoji. I.e: `🐭`
* `random.brand`: A random brand name.
* `random.company`: A random company name.
* `random.sport`: A random sport name.
* `random.filePath`: A random file path. I.e: `/tmp/file.txt`
* `random.ip`: A random IP4 address.
* `random.uuid`: A random UUID.
* `random.department`: A random department name.
* `random.jobTitle`: A random job title.
* `random.pastDate`: A random date in the past in ISO format (Optional params: years, limit of years to generate the date since current date). I.e; `random.pastDate.10` -> `2019-11-23`
* `random.futureDate`: A random date in the future in ISO format (Optional params: years, limit of years to generate the date since current date). I.e; `random.futureDate.10` -> `2030-10-20`
* `random.datetime`: A random past date and time in ISO format (Optional params: years, limit of years to generate the date since current date). I.e; `random.datetime.10` -> `2019-11-23T12:34:52.000Z`
* `random.phrase`: A random phrase. I.e: `Lorem ipsum dolor sit amet`

### request

The request params return data from request object.

* `request.path`: Request path. Value example: `/api/users/1`
* `request.params`: A map with all query params (Optionaly we can pass a paramName to return the specific value). I.e: `{ "foo": "bar" }` for `request.params` or `"bar"` for `request.params.foo`.
* `request.body`: Request payload. (Optionally we can pass a field name to return the specific value). I.e: `{ "name": "John" }` for `request.body` or `"John"` for `request.body.name`.
* `request.headers`: Request headers. (Optionally we can pass a header name to return the specific value). I.e: `{ "content-type": "application/json" }` for `request.headers` or `"application/json"` for `request.headers["content-type"]`.

### server

Specific server data, currently only the time and date server data is supported.

* `server.timestamp`: Server epoch datatime in milliseconds. I.e: `1589788000000`
* `server.isoDatetime`: Server current datetime in ISO format. I.e: `2020-01-01T10:30:45.000Z`
* `server.isoDate`: Server current date in ISO format. I.e: `2020-01-01`



