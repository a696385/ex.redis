/**
 * Is something object
 * @param a Source value
 * @returns {boolean}
 */
exports.isObject = isObject = function(a) {
    return (!!a) && (a.constructor === Object);
};

/**
 * Is something array
 * @param a Source value
 * @returns {boolean}
 */
exports.isArray = isArray = function(a) {
    return (!!a) && (a.constructor === Array);
};

/**
 * Is something date
 * @param a Source value
 * @returns {boolean}
 */
exports.isDate = isDate = function(a) {
    return (!!a) && (a instanceof Date);
};

/**
 * Serialize object to redis object
 * @param {Object} obj Source object
 * @returns {Object} Object for store to redis
 */
exports.serializeObject = function(obj){
    var _ser = function(prev, source, target){
        for(var key in source) if (source.hasOwnProperty(key)){
            var name = [].concat(prev, [key]).join('.');
            var value = source[key];

            if (isObject(value)){
                target[name] = 'o';
                _ser([].concat(prev, [key]), value, target);
            } else if (isArray(value)){
                target[name] = 'a:' + JSON.stringify(value);
            } else if (isDate(value)) {
                target[name] = 'd:' + value.toJSON();
            } else if (typeof value === 'boolean'){
                target[name] = 'b:' + (value ? 'true' : 'false');
            } else if (typeof value === 'number'){
                target[name] = value.toString();
            } else if (value === null){
                target[name] = 'e';
            } else {
                target[name] = 's:' + value.toString();
            }
        }
    };

    var result = {};
    _ser([], obj, result);
    return result;
};


/**
 * De serialize object from redis object
 * @param {Object} obj Redis object
 * @returns {Object} Original object
 */
exports.deSerializeObject = function(obj){
    var getValueFromSource = function(s){
        return s.substr(s.indexOf(':')+1);
    };
    var _des = function(source, target){
        for(var key in source) if (source.hasOwnProperty(key)){
            var value = source[key];
            var names = key.split('.');
            var obj = target;
            for(var i = 0; i < names.length -1; i++){
                if (!obj[names[i]]) obj[names[i]] = {};
                obj = obj[names[i]];
            }
            var isEmptyObject = false;
            if (value.length === 0) value = null;
            else {
                var type = value.substr(0, 1);
                if (type === 'o') { value = {}; isEmptyObject = true; }
                else if (type === 'a') value = JSON.parse(getValueFromSource(value));
                else if (type === 'd') value = new Date(getValueFromSource(value));
                else if (type === 'b') value = getValueFromSource(value) === 'true';
                else if (type === 'e') value = null;
                else if (type === 's') value = getValueFromSource(value);
                else value = parseFloat(getValueFromSource(value));
            }
            if (isEmptyObject){
                if (!obj[names[names.length-1]]) obj[names[names.length-1]] = value;
            } else {
                obj[names[names.length-1]] = value;
            }
        }
    };

    var result = {};
    _des(obj, result);
    return result;
};

