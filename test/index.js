require('should');

var exRedis = require('../index');

var redis = require('redis'),
    rc = redis.createClient();

var MongoClient = require('mongodb').MongoClient
    , format = require('util').format;

var source = {
    name: "test1@atd.ru",
    type: 1,
    info: {
        created : new Date(),
        rules: ['admin', 'user']
    },
    raiting: 9.9,
    ext: null
};


describe('Store object',function(){

    var storeResult = "";

    before(function(done){
        exRedis.write(rc, 'atd', 1, source, function(err, result){
            storeResult = err || result;
            done();
        })
    });

    it('version must be number',function(){
        storeResult.should.be.a('number');
    });

    describe('ReStore object',function(){
        var storeResult = {};

        before(function(done){
            exRedis.read(rc, 'atd', 1, function(err, result){
                storeResult = err || result;
                done();
            })
        });

        it('De serialization',function(){
            storeResult.should.eql(source);
        });
    });

    describe('Inc counter',function(){
        var storeResult = null;

        before(function(done){
            exRedis.inc(rc, 'atd', 1, 'type', 6, function(err, result){
                storeResult = err || '';
                done();
            })
        });

        it('Inc counter shoul be wiout error',function(){
            storeResult.should.not.be.ok;
        });
    });
});

describe('Find object',function(){
    var objects = [];
    before(function(done){
        exRedis.find(rc, 'atd', function(err, result){
            objects = err || result;
            done();
        })
    });

    it('result must be array',function(){
        objects.should.be.an.instanceof(Array);
    });
});

describe('Remove object',function(){
    var res = [];
    before(function(done){
        exRedis.remove(rc, 'atd', 1, function(err, result){
            res = err || result;
            done();
        })
    });

    it('return should be 1',function(){
        res.should.equal(1);
    });
});

describe('Version of data',function(){
    var res = "";
    before(function(done){
        exRedis.version(rc, 'atd', function(err, result){
            res = err || result;
            done();
        })
    });

    it('return should be number',function(){
        res.should.be.a('number');
    });
});


