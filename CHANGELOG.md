## 0.3.14 TBA
* graph `start` property is now an array instead of a string id to support multiple entry points
* env data structure changed from array to dictionary with array moved to `entries` property
(e.g. `<envId>: { "label": <String>, "entries": [<entry>, ...] }`)
* env entry `varString` property changed to `label`
* env now has optional `label` property
* states are now wrapped with configs automatically
* added documentation generation
* added bubbling feature

## 0.3.13
* added debug drawer to Project Toolbar
* added graph selector drawer to Project Toolbar
* new Project Toolbar
* removed import filename check
* fixed StackViewer cstack display bug
* support for new Val types

## 0.3.12
* added Link and Panel optional label display
* fixed browser cache issue

## 0.3.11
* added new `items.cstacks`
* renamed `items.konts` to `items.frames`
* a `state` in `items.states` can specify either `frame` or `cstack`
* a `frame` in `items.frames` of form `addr` can specify either `frames` or `cstacks`
