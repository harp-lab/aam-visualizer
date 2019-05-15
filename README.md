# Code Vis

## Description

Web application and server that processes code in analysis engine and visualizes results.



## Documentation

### Server

#### Requests

Http requests and responses between the web application and server.

`<url>/project?<query>`


#### `all` *GET*

Get list of all project statuses.

**Response (200):**
```javascript
{
  1553021570826: # project id
  {
    uploaded: true, # upload status
    ready: false # processing status
  },
  1553021695559: # project id
  ...
}
```


#### `create` *GET*

Get new project id.

**Response (201)**
```javascript
{
  id: 1553021570826 # project id
}
```


#### `id=<project id>&save` *POST*

Send project code.

**Request:**
```javascript
{
  id: '1553021570826', # project id
  code: "..."
}
```

**Response (202)**


#### `id=<project id>&process` *POST*

Request project processing.

**Response (200)**


#### `id=<project id>&data` *GET*

Get project analysis.

**Response *ready* (200)**
```javascript
{
  id: '1553021570826', # project id
  ast: [...], # ast nodes list
  code: "..." # code
}
```

**Response *processing* (204)**

**Response *not found* (404)**


#### `id=<project id>&code` *GET*

Get project code.

**Response *found* (200)**
```javascript
{
  id: '1553021570826', # project id
  code: "..." # code
}
```

**Response *not found* (404)**


#### `id=<project id>` *DELETE*

**Response *success* (205)**

**Response *not found* (404)**


#### Analysis

Ast node JSON format
```javascript
[
  {
    id: 0, # node id
    form: 'if', # node form
    ge: 1, # optional data
    te: 2, # optional data
    ee: 3, # optional data
    start: [4, 2], # code start [line, character]
    end: [6, 16] # code end [line, character]
  },
  {
    id: 1, # node id
    ...
  }
]
```
Can include other optional data (e.g. `define`, `nodes`, `data`, etc).



### Application

Projects are downloaded from server.
The client sends a `create` POST request to the server to create a new project, receiving a new project id.

Code is uploaded from the client to the server for newly created empty projects with a `id=<project id>` POST request.
The client then sends `id=<project id>` GET requests at intervals until the server responds with the processed data.



## Build instructions

Run `npm run <target>` in the console.

**Building:**
* `build` : builds application

**Deploying:**
* `start` : starts server

**Developing**
* `dev-start` : starts server with development environment
* `test` : runs tests (TODO: none at the moment)
