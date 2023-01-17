# Overview
The folder represents API for communication with the server.

# Structure
Each folder except `common` represents a route. The code outside the `api` folder shall import variables from dedicated route folder (not the common one). The `common` folder is meant for definition of common parameters shared by routes and shall be used to import variables only by the routes. An exception might be some very common code (e.g. `TRANSPORT_ID_BR_KEY`, which is set by a transport regardless of the route it sends to).

## urlParams
The main definition of URL parameters sent within a route.

## browserInfo
The browserInfo is an internal key-value storage which can be serialized into a single string an thus sent in a single URL parameter: `browser-info`. The file contains keys for the storage.

The data stored by browserInfo comprises page, user, visit information.

## telemetry
The telemetry is an internal key-value storage which can be serialized into a single string an thus sent in a single URL parameter: `t`. The file contains keys for the storage.

The data stored by telemetry comprises logging, debugging information.
