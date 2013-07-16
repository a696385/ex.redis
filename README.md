ex.redis
========

Functions for work with redis like mongodb. And sync mongo with redis.
This module provide to write, read docs in redis like mongo, use collections and not only string fields.

Usage
-----------

You can store JSON object like some one:
```javascript

{
    str: "some string",
    num: 1,
    subDoc: {
        created : new Date(),
        rules: ['some string', 'some string 2']
    },
    floatValue: 9.9,
    nullValue: null
}

```

### Create redis connection

```javascript
var redis = require('redis'),
    rc = redis.createClient();
```

Store document into redis
-----

For example store document into collection `test_collection` with id `51e512352cb6640403695121`
```javascript
exRedis.write(rc, 'test_collection', '51e512352cb6640403695121', {
    str: "some string",
    num: 1,
    subDoc: {
        created : new Date(),
        rules: ['some string', 'some string 2'],
        testInc: 1
    },
    floatValue: 9.9,
    nullValue: null
}, callback);
```

### Get document
```javascript
  exRedis.read(rc, 'test_collection', '51e512352cb6640403695121', function(err, doc){});
```

### Get documents list
```javascript
  exRedis.find(rc, 'test_collection', function(err, documents){});
```

### Remove document from collection
```javascript
  exRedis.remove(rc, 'test_collection', '51e512352cb6640403695121', function(err){});
```

### Increment for field of document
```javascript
  exRedis.inc(rc, 'test_collection', '51e512352cb6640403695121', 'subDoc.testInc', 1, function(err){});
```

### Get version of document collection
```javascript
  exRedis.version(rc, 'test_collection', function(err, version){});
```

### Set version of document collection
```javascript
  exRedis.setVersion(rc, 'test_collection', versionValue, function(err, version){});
```

Sync collections between mongo and redis
-----

```javascript
  exRedis.mongo.sync({
    db: db,                 // Mongo native driver database
    collection: 'test',     // Collection name
    defaultVersion : 10000  // Default value for version of collection data
  },{
    connection: rc,         // Redis driver connection
    collection: 'test',     // Redis collection name
    defaultVersion : 0      // Default value of version of collection data  
  }, function(err, count, fromTo){}); 
```

`count` - count of transferred documents

`fromTo` - side of transfer, may be `mongodb -> redis`, `redis -> mongodb` or `none` if versions is same