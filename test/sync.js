
var exRedis = require('../index');

var redis = require('redis'),
    rc = redis.createClient();

var MongoClient = require('mongodb').MongoClient;

MongoClient.connect('mongodb://127.0.0.1:27017/test', function(err, db) {
    exRedis.mongo.sync({
        db: db,
        collection: 'test',
        defaultVersion : 10000
    },{
        connection: rc,
        collection: 'test',
        defaultVersion : 0
    }, function(err, count, fromTo){
        if (err){
            console.error(err);
        } else {
            console.log(fromTo + ': sync completed with ' + count + ' doc(s)');
        }
    });
});
