
module.exports = exports = require('./lib/ex.redis');

var mongoSync = require('./lib/mongo.sync');

exports.mongo = {
    sync: mongoSync.sync,
    incVersion: mongoSync.incVersion
};
