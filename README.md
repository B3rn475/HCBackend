HCBackend
=================

Storage Backend for **Human Computation** application.

This application allow to **Store**, **Retrieve** and **Update** data related to Human Computation tasks using **REST** APIs.

Developed By __Carlo Bernaschina__ (GitHub - __B3rn475__)  
www.bernaschina.com

Copyright (c) 2014 __Politecnico di Milano__  
www.polimi.it

Distributed under the __MIT License__

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
* mediaLocator: {type: String} // virtual
* pose: []
    * location: {type: String, enum: ["head", "torso", "left_arm", "right_arm", "legs", "feet"]},
    * x0 : { type: Number, min: 0, max: width - 1},
    * y0 : { type: Number, min: 0, max: height - 1},
    * x1 : { type: Number, min: 0, max: width - 1},
    * y1 : { type: Number, min: 0, max: height - 1}

**Collection**

fields:

* id: { type: Number, min: 0, index: { unique: true }}
* name: {type: String, validate: /[a-zA-Z ]+$/}
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
* statistics : {
        sessions: {type: Number}
        actions: {type: Number}
    }

**Mask**

fields:

* id: { type: Number, min: 0, index: { unique: true }},
* image: **Image**
* tag: **Tag**
* quality: { type: Number}
* segmentations: { type: Number, min: 1}
* updated_at: {type: Date}
* mediaLocator: {type: String} // virtual

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
* type: {type: String, enum: ["tagging", "segmentation", "upload"]},
* segmentation:
    * quality: { type: Number}
    * points: []
        * x: { type: Number, min: 0}
        * y: { type: Number, min: 0}
        * size: {type: Number, min: 1}
        * color: {type: String, validate: /(rgb\(([0-2][0-9]{2}|[0-9]{2}|[0-9]),[ ]*([0-2][0-9]{2}|[0-9]{2}|[0-9]),[ ]*([0-2][0-9]{2}|[0-9]{2}|[0-9])\))|(rgba\(([0-2][0-9]{2}|[0-9]{2}|[0-9]),[ ]*([0-2][0-9]{2}|[0-9]{2}|[0-9]),[ ]*([0-2][0-9]{2}|[0-9]{2}|[0-9]),[ ]*([0-2][0-9]{2}|[0-9]{2}|[0-9])\))\b/}
    * history: []
        * points: []
            * x: { type: Number, min: 0}
            * y: { type: Number, min: 0}
            * size: {type: Number, min: 1}
            * color: {type: String, validate: /(rgb\(([0-2][0-9]{2}|[0-9]{2}|[0-9]),[ ]*([0-2][0-9]{2}|[0-9]{2}|[0-9]),[ ]*([0-2][0-9]{2}|[0-9]{2}|[0-9])\))|(rgba\(([0-2][0-9]{2}|[0-9]{2}|[0-9]),[ ]*([0-2][0-9]{2}|[0-9]{2}|[0-9]),[ ]*([0-2][0-9]{2}|[0-9]{2}|[0-9]),[ ]*([0-2][0-9]{2}|[0-9]{2}|[0-9])\))\b/}
        * time : {type:Date}
* started_at: {type: Date},
* completed_at: {type: Date},
* validity: {type: Boolean, default: true}

for tagging:  
__tag__ can be present or not. If it is present the action is completed otherwise skipped  
__segmentation__ is not present

for segmentation:  
__tag__ is always present.
__segmentation__ can be present or not. If it is present the action is completed otherwise skipped  

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
    "status": "KO",
    "errors": [{"location": "url|body|query|status|internal", 
        "name": "parameter that has generate the error",
        "message": "description of the error"
        }]
}
```

Good Request
------------

**JSON**

If there are not errors during the operation the following object will be sent:

```json
{
    "status": "OK"
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
returns the list of the images

* __query__ : count : __optional__ : max number of items to returns (max: 100)
* __query__ : max\_id : __optional__ : upper bound for the id to returns (included)
* __query__ : since\_id : __optional__ : lower bound for the id to returns (not included)

Example result:
```json
{
    "status" : "OK",
    "search_metadata" : {
        "count" : 100,
        "refresh_url" : "?since_id=2&count=100"
    },
    "images" : [
        {
            "width" : 600,
            "height" : 921,
            "pose" : [],
            "id" : 2,
            "mediaLocator" : "/storage/image/2.jpg"
        },
        {
            "width" : 600,
            "height" : 921,
            "pose" : [],
            "id" : 1,
            "mediaLocator" : "/storage/image/1.jpg"
        },
        {
            "width" : 600,
            "height" : 921,
            "pose": [],
            "id": 0,
            "mediaLocator": "/storage/image/0.jpg"
        }
    ]
}
```

**POST** : /image  
adds a new image

* __body__ : width : __mandatory__ : the width of the image
* __body__ : height : __mandatory__ : the height of the image
* __body__ : payload : __mandatory__ : the content of the image encoded in Base64 (jpeg format)
* __body__ : pose : __optional__ : pose of the image (see definition)

Example result:
```json
{
    "status" : "OK",
    "id" : 0
}
```


**GET** : /image/count  
returns the number of images

Example result:
```json
{
    "status" : "OK",
    "count" : 123
}
```

**GET** : /image/:imageId  
returns an image

Example result:
```json
{
    "status" : "OK",
    "image" : {
        "width" : 600,
        "height" : 921,
        "pose" : [],
        "id" : 0,
        "mediaLocator" : "/storage/image/0.jpg"
    }
}
```

**PUT** : /image/:imageId  
updates the image information

* __body__ : pose : __mandatory__ : pose of the image (see definition)

**GET** : /image/:imageId/tag  
returns the list of tags related to this image

Example result:
```json
{
    "status" : "OK",
    "search_metadata" : {
        "count" : 100
        "refresh_url" : "?since_id=0&count=100"
    },
    "tags" : [
        {
            "aliases" : [
                {
                    "language" : "en-US",
                    "name" : "hat"
                },
                {
                    "language" : "it-IT",
                    "name" : "cappello"
                }
            }
            "name" : "hat",
            "id" : 0
        }
    ]
}
```

**Collection**
______________
**GET** : /collection  
returns the list of collections

* __query__ : count : __optional__ : max number of items to returns (max: 100)
* __query__ : max\_id : __optional__ : upper bound for the id to returns (included)
* __query__ : since\_id : __optional__ : lower bound for the id to returns (not included)

**POST** : /collection  
adds a new collection

* __body__ : name : __mandatory__ : name of the collection

**GET** :/collection/count  
returns the number of collections

**GET** : /collection/:collectionId  
returns a collection

**GET** : /collection/:collectionId/task  
returns the list of task related to images in the collection

**POST** : /collection/:collectionId/image
adds an image to the collection

* __body__ : image : __mandatory__ : the image to add to the collection

**DELETE** : /collection/:collectionId/image  
remove an image from the collection

* __body__ : image : __mandatory__ : the image to remove from the collection

**DELETE** : /collection/:collectionId/image/:imageId
remove an image from the collection (same as the previous one, but with the id explicit in the url)

**User**
________
**GET** : /user  
returns the list of users

* __query__ : count : __optional__ : max number of items to returns (max: 100)
* __query__ : max\_id : __optional__ : upper bound for the id to returns (included)
* __query__ : since\_id : __optional__ : lower bound for the id to returns (not included)
* __query__ : app_id : __optional__ : returns only users from a particular application
* __query__ : populate : __optional__ : shows the user statistics

**POST** : /user  
adds a new user (if it is already there returns the id)

* __body__ : app_id : __mandatory__ : id of the application
* __body__ : app_user_id : __mandatory__ : id of the user of the application

**GET** : /user/count
returns the number of users

* __query__ : app_id : __optional__ : counts only users from a particular application

**GET** : /user/:userId  
returns a user

* __query__ : populate : __optional__ : shows the user statistics

**PUT** : /user/:userId
updates the user information

* __body__ : quality : __mandatory__ : quality of the user

**Tag**
_______

**GET** : /tag  
returns the list of tags

* __query__ : count : __optional__ : max number of items to returns (max: 100)
* __query__ : max\_id : __optional__ : upper bound for the id to returns (included)
* __query__ : since\_id : __optional__ : lower bound for the id to returns (not included)

**POST** : /tag  
adds a new tag

* __body__ : name : __mandatory__ : name of the tag

**GET** : /tag/count  
returns the number of tags

**GET** : /tag/:tagId  
returns a tag

**POST** : /tag/:tagId/alias  
adds a new alias to the tag

* __body__ : language : __mandatory__ : language of the alias (ex: en-US)
* __body__ : name : __mandatory__ : name of the alias

**DELETE** : /tag/:tagId/alias
remove an alias from the tag

* __body__ : language : __mandatory__ : language of the alias (ex: end-US)

**DELETE** : /tag/:tagId/alias/:language
remove an alias from the tag (same as the previous one, but with the language explicit in the url)

**Mask**
________

**GET** : /mask  
returns the list of masks

* __query__ : count : __optional__ : max number of items to returns (max: 100)
* __query__ : max\_id : __optional__ : upper bound for the id to returns (included)
* __query__ : since\_id : __optional__ : lower bound for the id to returns (not included)
* __query__ : image : __optional__ : returns only mask related to that image
* __query__ : tag : __optional__ : returns only mask related to that tag

Example result:
```json
{
    "status" : "OK",
    "search_metadata" : {
        "count" : 100,
        "refresh_url" : "?since_id=0&count=100"
    },
    "masks": [
        {
            "image" : 0,
            "tag" : 0,
            "segmentations" : 3,
            "quality" : 0.3,
            "mediaLocator" : "/storage/mask/0.png",
            "id" : 0
        }
    ]
}
```

**POST** : /mask
adds a new mask

* __body__ : image : __mandatory__ : the image related to the mask
* __body__ : tag : __mandatory__ : the tag related to the mask
* __body__ : payload : __mandatory__ : the content of the mask (png format)
* __body__ : segmentations : __mandatory__ : the number of segmentations that has generated the mask
* __body__ : quality : __mandatory__ : the quality of the mask

**GET** : /mask/count  
returns the number of mask

Example result:
```json
{
    "status" : "OK",
    "count" : 123
}
```

* __query__ : image : __optional__ : counts only mask related to that image
* __query__ : tag : __optional__ : counts only mask related to that tag

**GET** : /mask/:maskId  
returns a mask

Example result:
```json
{
    "status" : "OK",
    "mask": {
        "image" : 0,
        "tag" : 0,
        "segmentations" : 3,
        "quality" : 0.3,
        "mediaLocator" : "/storage/mask/0.png",
        "id" : 0
    }
}
```

**PUT** : /mask/:maskId
updates a mask

* __body__ : payload : __mandatory__ : the content of the mask (png format)
* __body__ : segmentations : __mandatory__ : the number of segmentations that has generated the mask
* __body__ : quality : __mandatory__ : the quality of the mask

**Task**
________

**GET** : /task  
returns the list of tasks

* __query__ : count : __optional__ : max number of items to returns (max: 100)
* __query__ : max\_id : __optional__ : upper bound for the id to returns (included)
* __query__ : since\_id : __optional__ : lower bound for the id to returns (not included)
* __query__ : image : __optional__ : returns only tasks related to that image (cannot be used with collection)
* __query__ : collection : __optional__ : returns only tasks related to images in that collection (cannot be used with image)
* __query__ : completed : __optional__ : returns only open or completed tasks

**POST** : /task
adds a new task

* __body__ : image : __mandatory__ : image related to the task

**GET** : /task/count  
returns the number of tasks

* __query__ : image : __optional__ : counts only tasks related to that image (cannot be used with collection)
* __query__ : collection : __optional__ : counts only tasks related to images in that collection (cannot be used with image)
* __query__ : completed : __optional__ : counts only open or completed tasks

**GET** : /task/:taskId  
returns a task

**POST** : /task/:taskId  
complete a task (and all the related microtasks)

**POST** : /task/:taskId/user
adds a new users related to the task

* __body__ : user : __mandatory__ : the user to add

**GET** : /task/:taskId/microtask  
returns the list of microtask related to this task (same as /microtask=:taskId)

* __query__ : count : __optional__ : max number of items to returns (max: 100)
* __query__ : max\_id : __optional__ : upper bound for the id to returns (included)
* __query__ : since\_id : __optional__ : lower bound for the id to returns (not included)

**POST**  : /task/:taskId/microtask  
adds a new microtask (the same as /microtask, but with the task id explicit in the url)

* __body__ : type : __mandatory__ : the type of the microtask
* __body__ : order : __mandatory__ : the order of the microtask

**Session**
___________

**GET** : /session  
returns the list of sessions

* __query__ : count : __optional__ : max number of items to returns (max: 100)
* __query__ : max\_id : __optional__ : upper bound for the id to returns (included)
* __query__ : since\_id : __optional__ : lower bound for the id to returns (not included)
* __query__ : completed : __optional__ : returns only open or completed sessions

**POST** : /session
adds a new session

***GET** : /session/count
returns the number of sessions

* __query__ : completed : __optional__ : counts only open or completed sessions

**GET** : /session/:sessionId  
returns a session

**POST** : /session/:sessionId  
complete a session

**GET** : /session/:sessionId/action  
returns the actions related to this session (same as /action?session=:sessionId)

* __query__ : count : __optional__ : max number of items to returns (max: 100)
* __query__ : max\_id : __optional__ : upper bound for the id to returns (included)
* __query__ : since\_id : __optional__ : lower bound for the id to returns (not included)
* __query__ : type : __optional__ : returns only the action of that type
* __query__ : image : __optional__ : returns only the action related to that image
* __query__ : tag : __optional__ : returns only the action related to that tag
* __query__ : completed : __optional__ : returns only the completed or not completed actions
* __query__ : validity : __optional__ : returns only the valid or not valid actions

**POST** : /session/:sessionId/action
adds a new action to the session (the same as /action, but with the session id explicit in the url).

* __body__ : type : __mandatory__ : the type of the action
* __body__ : user : __mandatory__ : the user related to the action
* __body__ : tag : __optional__ (for tagging) | __mandatory__ (for segmentation) : the tag of the action
* __body__ : points : __optional__ (only for tagging) : the points of the segmentation

If it is a __tagging__ action the tag is optional. If it is present the action is completed correctly otherwise it is still open.  
If it is a __segmentation__ action the tag is mandatory.  
If it is a __segmentation__ action the points are optional. If they are present the action is completed correctly otherwise it is still open.

**PUT** : /session/:sessionId/action
updates all the session (same as /action)

* __query__ : image : __optional__ : filter on the image
* __query__ : tag : __optional__ : filter on the tag
* __query__ : type : __optional__ : filter on the type
* __query__ : completed : __optional__ : filters completed or not completed actions
* __body__ : validity : __mandatory__ : the new validity for the actions

**Action**
__________

**GET** : /action  
returns the list of actions

* __query__ : count : __optional__ : max number of items to returns (max: 100)
* __query__ : max\_id : __optional__ : upper bound for the id to returns (included)
* __query__ : since\_id : __optional__ : lower bound for the id to returns (not included)
* __query__ : type : __optional__ : returns only the action of that type
* __query__ : image : __optional__ : returns only the action related to that image
* __query__ : tag : __optional__ : returns only the action related to that tag
* __query__ : completed : __optional__ : returns only the completed or not completed actions
* __query__ : validity : __optional__ : returns only the valid or not valid actions
* __query__ : populate : __optional__ : returns even the segmentations points

**POST** : /action  
adds a new action

* __body__ : session : __mandatory__ : session of the action
* __body__ : type : __mandatory__ : the type of the action
* __body__ : user : __mandatory__ : the user related to the action
* __body__ : tag : __optional__ (for tagging) | __mandatory__ (for segmentation) : the tag of the action
* __body__ : points : __optional__ (only for tagging) : the points of the segmentation

If it is a __tagging__ action the tag is optional. If it is present the action is completed correctly otherwise it is skipped.  
If it is a __segmentation__ action the tag is mandatory.  
If it is a __segmentation__ action the points are optional. If they are present the action is completed correctly otherwise it is skipped.

**PUT** : /action
updates all the actions

* __query__ : session : __optional__ : filter on the session (it is required if image and tag are not present)
* __query__ : image : __optional__ : filter on the image (it is required if session and tag are not present)
* __query__ : tag : __optional__ : filter on the tag (it is required if session and image are not present)
* __query__ : type : __optional__ : filter on the type
* __query__ : completed : __optional__ : filters completed or not completed actions
* __body__ : validity : __mandatory__ : the new validity for the actions

**GET** : /action/count  
returns the number of actions

* __query__ : type : __optional__ : counts only the action of that type
* __query__ : image : __optional__ : counts only the action related to that image
* __query__ : tag : __optional__ : counts only the action related to that tag
* __query__ : completed : __optional__ : counts only the completed or not completed actions
* __query__ : validity : __optional__ : counts only the valid or not valid actions

**GET** : /action/:actionId  
returns an action

**POST** : /action/:actionId  
completes the action

* __body__ : tag : __optional__ (only for tagging) : the tag of the action
* __body__ : points : __optional__ (only for segmentation) : the points of the segmentation
* __body__ : history : __optional__ (only for segmentation) : the history of the segmentation

If it is a __tagging__ action and the tag is not present the action is skipped.
If it is a __segmentation__ action and the points are not present the action is skipped.

**PUT** : /action/:actionId  
updates an action

* __body__ : validity : __mandatory__ : the new validity of the action

**Microtask**
_____________

**GET** : /microtask  
returns the list of microtasks

* __query__ : count : __optional__ : max number of items to returns (max: 100)
* __query__ : max\_id : __optional__ : upper bound for the id to returns (included)
* __query__ : since\_id : __optional__ : lower bound for the id to returns (not included)
* __query__ : task : __optional : returns only the microtasks related to that task
* __query__ : completed : __optional : returns only the open or completed tasks

**POST** : /microtask  
adds a new microtask

* __body__ : task : __mandatory__ : the task of the microtask
* __body__ : type : __mandatory__ : the type of the microtask
* __body__ : order : __mandatory__ : the order of the microtask

**GET** : /microtask/count  
returns the number of microtasks

* __query__ : task : __optional : counts only the microtasks related to that task
* __query__ : completed : __optional : counts only the open or completed tasks

**GET** : /microtask/:microtaskId  
returns a microtask

**POST** : /microtask/:microtaskId  
complete a microtask

* __body__ : action : __mandatory__ : the action that executes the task

/**
 * Choose Routes
 */
 
**GET** : /choose
returns the list of available aglorithsm

**GET** : /choose/random
choose a random combination of __image__ and __tag__ that has already been tagged by a user

* __query__ : limit : __optional__ : number of elements to return (default: 1, max: 100)
* __query__ : collection : __optional__ : collection from which take the images

**GET** : /choose/leastused
choose the least used combination of __image__ and __tag__ that has already been tagged by a user

* __query__ : limit : __optional__ : number of elements to return (default: 1, max: 100)
* __query__ : collection : __optional__ : collection from which take the images
