HCBackend
=================

Storage Backend for **Human Computation** application.

This application allow to **Store**, **Retrieve** and **Update** data related to Human Computation tasks using **REST** APIs.

Headers
-------
In order to allow future modifications it has been chosen to force the remote Host to choose the output format of the APIs.

This is done using the **Accept** HTTP Header.

**Accepted Formats**:

* application/json

If the header is not set as a common Web Application is goes for the default text/html format, that is currently non implemented.

If you receive a **501** : **not implemented** error first check the **Accept** Header of your request.

HTTP Methods
------------
The main idea is to use the right **HTTP Method** for the operation.

* **GET** to obtain data
* **POST** to add new data or to do one time operations
* **PUT** to update elements
* **DELETE** to remove items

Stored Objects
--------------
**Image**

fields:

* id: { type: Number, min: 0, index: { unique: true }}
* width: { type: Number, min: 1}
* height: { type: Number, min: 1}
* midiaLocation: {type: String} // virtual
* pose: []
    * location: {type: String, enum: ["head", "torso", "left_arm", "right_arm", "legs", "feet"]},
    * x0 : { type: Number, min: 0, max: width - 1},
    * y0 : { type: Number, min: 0, max: height - 1},
    * x1 : { type: Number, min: 0, max: width - 1},
    * y1 : { type: Number, min: 0, max: height - 1}

**Collection**

fields:

* id: { type: Number, min: 0, index: { unique: true }}
* images : [ **Image** ]

**Tag**

fields:

* id: { type: Number, min: 0, index: { unique: true }, select: false}
* aliases: []
    * language: {type: String, validate: /[a-z]{2}\-[A-Z]{2}$/}
    * name: {type: String, validate: /[a-zA-Z ]+$/}

**User**

fields:

* id: { type: Number, min: 0, index: { unique: true }}
* app_id: { type: Number, min: 0}
* app_user_id: { type: Number, min: 0}
* quality: { type: Number}

**Mask**

fields:

* id: { type: Number, min: 0, index: { unique: true }},
* image: **Image**
* tag: **Tag**
* quality: { type: Number}
* segmentations: { type: Number, min: 1}
* updated_at: {type: Date}
* midiaLocation: {type: String} // virtual

**Segmentation**

fields:

* id: { type: Number, min: 0, index: { unique: true }}
* quality: { type: Number}
* points: []
    * x: { type: Number, min: 0}
    * y: { type: Number, min: 0}
    * color: {type: String, validate: /#([a-f]|[A-F]|[0-9]){3}(([a-f]|[A-F]|[0-9]){3})?\b/}
    * removed: {type: Boolean}

**Session**

fields:

* id: { type: Number, min: 0, index: { unique: true }}
* started_at: {type: Date}
* completed_at: {type: Date}

**Action**

fields:

* id: { type: Number, min: 0, index: { unique: true }},
* session: **Session**
* image: **Image**
* tag: **Tag**
* user: **User**
* type: {type: String, enum: ["tagging", "segmentation"]},
* segmentation: **Segmentation**
* started_at: {type: Date},
* completed_at: {type: Date},
* validity: {type: Boolean, default: true}

**Task**

fields:

* id: { type: Number, min: 0, index: { unique: true }}
* image: [ **Image** ]
* users : [ **User** ]
* created_at: {type: Date}
* completed_at: {type: Date}

**Microtask**

fields:

* id: { type: Number, min: 0, index: { unique: true }}
* type: {type: String, enum: ["tagging", "segmentation"]}
* task: **Task**
* action: **Action**
* order: {type: Number, min: 0}
* created_at: {type: Date}
* completed_at: {type: Date}

Error Handling
--------------
**JSON**

If there is an error during the process, due to a **Bad** **Route**, a **Missing** or **Wrong** **Parameter** or to an **Internal** **Server** **Error** an error message will be returned.

Format:

```json
{
    status: "KO"
    errors: [{location: "url|body|query|status|internal", 
        name: "parameter that has generate the error",
        message: "description of the error"
        }]
}
```

Good Request
------------

**JSON**

If there are not errors during the operation the following object will be sent:

```json
{
    status: "OK"
    ... //Other data related to the api
}
```