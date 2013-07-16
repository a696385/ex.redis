var exRedis = require('./ex.redis'),
    async = require('async'),
    ObjectID = require('mongodb').ObjectID;

/**
 * Sync collections with mongo and redis
 * @param {Object} mongo Mongo options
 * @param {MongoDB} mongo.db Connected mongo database
 * @param {String} mongo.collection Mongo collection name
 * @param {Number} mongo.defaultVersion Default version of data in collection
 * @param {Object} redis Redis options
 * @param {RedisConnection} redis.connection Redis Connection
 * @param {String} redis.collection Redis collection name
 * @param {Number} redis.defaultVersion Default version of data in collection
 * @param {Function} [callback]
 */
exports.sync = function(mongo, redis, callback){
    var mongoCollection = mongo.db.collection(mongo.collection);
    var syncObjects = 0, mongoVersion = 0, redisVersion = 0, fromTo = 'none';

    var copyFromMongoToRedis = function(version, callback){
        async.waterfall([
            function(callback){ exRedis.clear(redis.connection, redis.collection, callback); },
            function(callback){ mongoCollection.find().toArray(callback); },
            function(results, callback){
                async.each(results, function(doc, next){
                    if (!!doc.__key){
                        next();
                        return;
                    }
                    syncObjects++;
                    exRedis.write(redis.connection, redis.collection, doc._id.toHexString(), doc, next);
                }, callback);
            },
            function(callback){
                exRedis.setVersion(redis.connection, redis.collection, version, callback);
            }
        ], callback);
    };
    var copyFromRedisToMongo = function(version, callback){
        async.waterfall([
            function(callback){ mongoCollection.remove({},{multi: true}, function(err){ callback(err); }); },
            function(callback){ exRedis.find(redis.connection, redis.collection, callback); },
            function(results, callback){
                async.each(results, function(doc,next){
                    syncObjects++;
                    if (doc._id && typeof doc._id === 'string'){
                        doc._id = new ObjectID(doc._id);
                    }
                    mongoCollection.insert(doc, next);
                }, callback);
            },
            function(callback){
                mongoCollection.insert({__key: 'version', value: version}, callback);
            }
        ], callback);
    };

    async.waterfall([
        function(callback){ mongoCollection.findOne({__key: 'version'}, callback); },
        function(result, callback){
            if (!result){
                result = {
                    value: mongo.defaultVersion
                };
            }
            mongoVersion = result.value || mongo.defaultVersion;
            exRedis.version(redis.connection, redis.collection, callback);
        },
        function(result, callback){
            redisVersion = result || redis.defaultVersion;
            if (mongoVersion > redisVersion) {
                fromTo = 'mongodb -> redis';
                copyFromMongoToRedis(mongoVersion, callback);
            } else if (mongoVersion < redisVersion) {
                fromTo = 'redis -> mongodb';
                copyFromRedisToMongo(redisVersion, callback);
            } else {
                callback();
            }
        }
    ], function(err){
        callback(err, syncObjects, fromTo);
    });
};

/**
 * Increment version changing in collection
 * @param {Object} mongo Mongo options
 * @param {MongoDB} mongo.db Connected mongo database
 * @param {String} mongo.collection Mongo collection name
 * @param {Function} [callback]
 */

exports.incVersion = function(mongo, callback){
    var mongoCollection = mongo.db.collection(mongo.collection);
    mongoCollection.update({__key: 'version'}, {$inc: {value: 1}}, {upsert: true}, callback);
};
