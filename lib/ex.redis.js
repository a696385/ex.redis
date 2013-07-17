var utils = require('./utils'),
    async = require('async');

/**
 * Store object to redis server
 * @param {RedisConnection} rc Redis Connection Object
 * @param {String} collection Collection name for store
 * @param {String} id Primary key value for object
 * @param {Object} data Stored object value
 * @param {Function} [callback]
 */
exports.write = write = function(rc, collection, id, data, callback){
    if (callback == null) callback = function(){};
    var rd = utils.serializeObject(data);
    async.waterfall([
        function(callback) { rc.hmset(collection + ':data:' + id, rd, callback); },
        function(result, callback) { rc.incr(collection + ':version', callback); }
    ], callback);
};

/**
 * Read object from redis server
 * @param {RedisConnection} rc Redis Connection Object
 * @param {String} collection Collection name for store
 * @param {String} id Primary key value for object
 * @param {Function} [callback]
 */
exports.read = read = function(rc, collection, id, callback){
    if (callback == null) callback = function(){};
    rc.hgetall(collection + ':data:' + id, function(err, data){
        if (err) {
            callback(err);
        } else {
            callback(null, utils.deSerializeObject(data));
        }
    });
};

/**
 * Get all documents from collection
 * @param {RedisConnection} rc Redis Connection Object
 * @param {String} collection Collection name for store
 * @param {String} filter IdsFilter
 * @param {Function} [callback]
 */
exports.find = find = function(rc, collection, filter, callback){
    if (callback == null) callback = function(){};
    var docs = [];
    async.waterfall([
        function(callback){ findIds(rc, collection, filter, callback); },
        function(result, callback){
            async.each(result, function(el, next){
                read(rc, collection, el, function(err, doc){
                    if (!err) {
                        doc.__key = el;
                        docs.push(doc);
                    }
                    next(err);
                });

            }, function(err){
                callback(err);
            })
        }
    ], function(err){
        callback(err, docs);
    })
};

/**
 * Get all ids from collection
 * @param {RedisConnection} rc Redis Connection Object
 * @param {String} collection Collection name for store
 * @param {String} filter IdsFilter
 * @param {Function} [callback]
 */
exports.findIds = findIds = function(rc, collection, filter, callback){
    if (callback == null) callback = function(){};
    var docs = [];
    async.waterfall([
        function(callback){ rc.keys(collection + ':data:' + filter, callback); },
        function(result, callback){
            result.forEach(function(el){
                el = el.substr((collection + ':data:').length);
                if (el.indexOf(':') > -1) return;
                docs.push(el);
            });
            callback();
        }
    ], function(err){
        callback(err, docs);
    })
};

/**
 * Remove doc from redis
 * @param {RedisConnection} rc Redis Connection Object
 * @param {String} collection Collection name for store
 * @param {String} id Primary key value for object
 * @param {Function} [callback]
 */
exports.remove = remove = function(rc, collection, id, callback){
    if (callback == null) callback = function(){};
    rc.del(collection + ':data:' + id, callback);
};

/**
 * Get version of data in collection
 * @param {RedisConnection} rc Redis Connection Object
 * @param {String} collection Collection name for store
 * @param {Function} [callback]
 * */
exports.version = function(rc, collection, callback){
    if (callback == null) callback = function(){};
    rc.get(collection + ':version', function(err, data){
        callback(err, parseInt(data || "0"));
    });
};

/**
 * Set version of data in collection
 * @param {RedisConnection} rc Redis Connection Object
 * @param {String} collection Collection name for store
 * @param {Number} value Version value
 * @param {Function} [callback]
 * */
exports.setVersion = function(rc, collection, value, callback){
    if (callback == null) callback = function(){};
    rc.set(collection + ':version', value, function(err, data){
        callback(err);
    });
};

/**
 * Increment object field in collection
 * @param {RedisConnection} rc Redis Connection Object
 * @param {String} collection Collection name for store
 * @param {String} id Primary key value for object
 * @param {String} field Object field for increment
 * @param {Number} incBy Increment value
 * @param {Function} [callback]
 */
exports.inc = function(rc, collection, id, field, incBy, callback){
    if (callback == null) callback = function(){};
    async.waterfall([
        function(callback) { rc.hincrby(collection + ':data:' + id, field, incBy, callback); },
        function(result, callback) { rc.incr(collection + ':version', callback); }
    ], callback);
};

/**
 * Clear collection
 * @param {RedisConnection} rc Redis Connection Object
 * @param {String} collection Collection name for store
 * @param {Function} [callback]
 */
exports.clear = function(rc, collection, callback){
    if (callback == null) callback = function(){};
    findIds(rc, collection, function(err, results){
        async.each(results, function(el, next){
            remove(rc, collection, el, next);
        }, function(err){
            callback(err);
        });
    });
};