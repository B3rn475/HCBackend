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
* midiaLocator: {type: String} // virtual
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
* name: {type: String, validate: /[a-zA-Z ]+$/}
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
* midiaLocatior: {type: String} // virtual

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
* segmentation: 
    * quality: { type: Number}
    * points: []
        * x: { type: Number, min: 0}
        * y: { type: Number, min: 0}
        * color: {type: String, validate: /#([a-f]|[A-F]|[0-9]){3}(([a-f]|[A-F]|[0-9]){3})?\b/}
        * removed: {type: Boolean}
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

Routes
------

Format:

**METHOD** : **PATH** 
description:

* __location__ : name : __optional__|__mandatory__ : description
* ...

The following routes are corrently available:

**GET** : /  
    get the status of the server

**Image**
________________

**GET** : /image  
return the list of the images

* __query__ : count : __optional__ : max number of items to return (max: 100)
* __query__ : max\_id : __optional__ : upper bound for the id to return (included)
* __query__ : since\_id : __optional__ : lower bound for the id to return (not included)

**POST** : /image  
add a new image

**GET** : /image/count  
return the number of images

**GET** : /image/:imageId  
return an image

**PUT** : /image/:imageId  
update the image information

**GET** : /image/:imageId/tag  
return the list of tags related to this image

**Collection**
______________
**GET** : /collection  
return the list of collections

* __query__ : count : __optional__ : max number of items to return (max: 100)
* __query__ : max\_id : __optional__ : upper bound for the id to return (included)
* __query__ : since\_id : __optional__ : lower bound for the id to return (not included)

**POST** : /collection  
add a new collection

**GET** :/collection/count  
return the number of collections

**GET** : /collection/:collectionId  
return a collection

**GET** : /collection/:collectionId/task  
return the list of task related to images in the collection

**POST** : /collection/:collectionId/image
add an image to the collection

**DELETE** : /collection/:collectionId/image  
remove an image from the collection

**DELETE** : /collection/:collectionId/image/:imageId
remove an image from the collection (same as the previous one, but with the id explicit in the url)

**User**
________
**GET** : /user  
return the list of users

* __query__ : count : __optional__ : max number of items to return (max: 100)
* __query__ : max\_id : __optional__ : upper bound for the id to return (included)
* __query__ : since\_id : __optional__ : lower bound for the id to return (not included)
* __query__ : app_id : __optional__ : returns only users from a particular application

**POST** : /user  
add a new user (if it is already there returns the id)

**GET** : /user/count
return the number of users

**GET** : /user/:userId  
return a user

**PUT** : /user/:userId
update the user information

**Tag**
_______

**GET** : /tag  
return the list of tags

* __query__ : count : __optional__ : max number of items to return (max: 100)
* __query__ : max\_id : __optional__ : upper bound for the id to return (included)
* __query__ : since\_id : __optional__ : lower bound for the id to return (not included)

**POST** : /tag  
add a new tag

**GET** : /tag/count  
return the number of tags

**GET** : /tag/:tagId  
return a tag

**POST** : /tag/:tagId/alias  
add a new alias to the tag

**DELETE** : /tag/:tagId/alias
remove an alias from the tag

**DELETE** : /tag/:tagId/alias/:language
remove an alias from the tag (same as the previous one, but with the language explicit in the url)

**Mask**
________

**GET** : /mask  
return the list of masks

* __query__ : count : __optional__ : max number of items to return (max: 100)
* __query__ : max\_id : __optional__ : upper bound for the id to return (included)
* __query__ : since\_id : __optional__ : lower bound for the id to return (not included)

**POST** : /mask
add a new mask

**GET** : /mask/count  
return the number of mask

**GET** : /mask/:maskId  
return a mask

**PUT** : /mask/:maskId
update a mask

**Task**
________

**GET** : /task  
return the list of tasks

* __query__ : count : __optional__ : max number of items to return (max: 100)
* __query__ : max\_id : __optional__ : upper bound for the id to return (included)
* __query__ : since\_id : __optional__ : lower bound for the id to return (not included)

**POST** : /task
add a new task

**GET** : /task/count  
return the number of tasks

**GET** : /task/:taskId  
return a task

**POST** : /task/:taskId  
complete a task (and all the related microtasks)

**POST** : /task/:taskId/user
return the list of users related to the task

**GET** : /task/:taskId/microtask  
return the list of microtask related to this task (same as /microtask=:taskId)

* __query__ : count : __optional__ : max number of items to return (max: 100)
* __query__ : max\_id : __optional__ : upper bound for the id to return (included)
* __query__ : since\_id : __optional__ : lower bound for the id to return (not included)

**POST**  : /task/:taskId/microtask  
add a new microtask (the same as /microtask, but with the task id explicit in the url)

**Session**
___________

**GET** : /session  
return the list of sessions

* __query__ : count : __optional__ : max number of items to return (max: 100)
* __query__ : max\_id : __optional__ : upper bound for the id to return (included)
* __query__ : since\_id : __optional__ : lower bound for the id to return (not included)

**POST** : /session
add a new session

***GET** : /session/count
return the number of sessions

**GET** : /session/:sessionId  
return a session

**POST** : /session/:sessionId  
complete a session

**GET** : /session/:sessionId/action  
return the actions related to this session (same as /action?session=:sessionId)

* __query__ : count : __optional__ : max number of items to return (max: 100)
* __query__ : max\_id : __optional__ : upper bound for the id to return (included)
* __query__ : since\_id : __optional__ : lower bound for the id to return (not included)

**POST** : /session/:sessionId/action
add a new action to the session (the same as /action, but with the session id explicit in the url)

**PUT** : /session/:sessionId/action
update all the session (same as /action)

**Action**
__________

**GET** : /action  
return the list of actions

* __query__ : count : __optional__ : max number of items to return (max: 100)
* __query__ : max\_id : __optional__ : upper bound for the id to return (included)
* __query__ : since\_id : __optional__ : lower bound for the id to return (not included)
* __query__ : type : __optional__ : returns only the action of that type
* __query__ : image : __optional__ : returns only the action related to that image
* __query__ : tag : __optional__ : returns only the action related to that tag
* __query__ : completed : __optional__ : returns only the completed or not completed actions
* __query__ : validity : __optional__ : returns only the valid or not valid actions

**POST** : /action  
add a new action

**PUT** : /action
update all the actions

**GET** : /action/count  
return the number of actions

**GET** : /action/:actionId  
return an action

**POST** : /action/:actionId
complete an action

**PUT** : /action/:actionId  
update an action

**Microtask**
_____________

**GET** : /microtask  
return the list of microtasks

* __query__ : count : __optional__ : max number of items to return (max: 100)
* __query__ : max\_id : __optional__ : upper bound for the id to return (included)
* __query__ : since\_id : __optional__ : lower bound for the id to return (not included)
* __query__ : task : __optional : returns only the microtasks related to that task

**POST** : /microtask  
add a new microtask

**GET** : /microtask/count  
return the number of microtasks

**GET** : /microtask/:microtaskId  
return a microtask

**POST** : /microtask/:microtaskId  
complete a microtask