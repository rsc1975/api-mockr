# api-mocker

Server with an API REST designed to imitiate response from third-parties. It'll help testing external integrations

# Getting started

Para arrancar el servidor, desde el directorio raiz del proyecto:

    node server/server_start.js

El servidor consta de los siguientes servicios REST:

    GET /api/countries

Retorna la lista de paises, cada pais tiene el formato: `{ "code": "es", "name": "España"}`

    GET /api/cities

Retorna la lista (array) de ciudades, cada ciudad de esta lista tiene el formato: `{"id":1,"name":"Madrid","country_code":"es","population":6700000, "country": { "code": "es", "name": "España"}}` Se añade el atributo `country` con el detalle del pais asociado.

    GET /api/cities/{id_ciudad}

Retorna los datos de la ciudad con id: `id_ciudad`, ejemplo: `{"id":1,"name":"Madrid","country_code":"es","population":6700000, "country": { "code": "es", "name": "España"}}` Se añade el atributo `country` con el detalle del pais asociado.

    DELETE /api/cities/{id_ciudad}

Borra la ciudad con id: `id_ciudad`.

    POST /api/cities

Crea una ciudad, con los datos pasados en el payload de la petición, ejemplo de payload:
 `{"name":"Calamonte","country_code":"es","population":6000}` Se retorna la ciudad ya creada con su ID, ej: `{"id":12, "name":"Calamonte","country_code":"es","population":6000}`

    POST /api/cities/{id_ciudad}

Modifica la ciudad con id `id_ciudad` con los datos pasados en el payload de la petición, ejemplo de payload:
 `{"name":"Calamonte","country_code":"es","population":7000}` Se retorna la ciudad modificada, ej: `{"id":12, "name":"Calamonte","country_code":"es","population":7000}`


Ejemplos de llamadas desde una aplicación Angular, utilizando [`HttpClient`](https://angular.io/api/common/http/HttpClient)

```javascript
const URL_BASE = 'http://localhost:3000/api';

# Obtener paises
this.httpClient.get<Country[]>(`${URL_BASE}/countries`).subscribe(paises => {
    this.countryList = paises;
});

# Obtener ciudades
this.httpClient.get<Ciudad[]>(`${URL_BASE}/cities`).subscribe(ciudades => {
    let dataSource : MatTableDataSource<Ciudad> = new MatTableDataSource(ciudades);
    this.myCitiesDataSource = dataSource;
});

# Obtener datos de 1 ciudad
this.httpClient.get<Ciudad>(`${URL_BASE}/cities/${idCity}`).subscribe(ciudad => {
    
    this.form.pathValue(ciudad, {emitEvent: false});
});

# Borrar 1 ciudad
this.httpClient.delete<Ciudad>(`${URL_BASE}/cities/${idCity}`).subscribe(ciudad => {
    
    console.log(`Ciudad ${ciudad.name} borrar con éxito`)
});

# Crear 1 ciudad
let datosCiudad: Ciudad = this.form.value;
this.httpClient.post<Ciudad>(`${URL_BASE}/cities`, datosCiudad).subscribe(ciudad => {
    
    console.log(`Ciudad ${ciudad.name} creada con ID: ${ciudad.id}`);
});

# Modificar 1 ciudad
let datosCiudad: Ciudad = this.form.value;
this.httpClient.post<Ciudad>(`${URL_BASE}/cities/${idCiudad}`, datosCiudad).subscribe(ciudad => {
    
    console.log(`Ciudad ${ciudad.name} modificada correctamente`);
});
```

