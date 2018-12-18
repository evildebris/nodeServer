/**
 * @author cai.liao
 * @description 封装es6 promise 伪装成angular的$q方法,一些常用方法
 * */
/*const originThen = Promise.prototype.then;
Promise.prototype.then =function (...args) {
    return originThen.apply(this,(data)=>{
        debugger
        if(data===false){
            return new Promise((resolve,reject)=>{
                reject(data);
            });
        }else {
            originThen.apply(this,args[0])
        }
    },args[1]);
};*/
Promise.prototype.success = Promise.prototype.then;
Promise.prototype.error = Promise.prototype.catch;

const $q = {};
const toString  = Object.prototype.toString;
class Deferred {
    constructor(){
        this.promise = new Promise((resolve,reject)=>{
            this.resolve =resolve;
            this.reject = reject;
        });
    }
}
$q.defer = function () {
   return new Deferred();
};

let _typeof = function(arg){
    return Object.prototype.toString.call(arg);
};

let isArray = function(arg){
    return _typeof(arg) === '[object Array]';
};

let isDate = function(arg){
    return _typeof(arg) === '[object Date]';
};

let isRegExp = function(arg){
    return _typeof(arg) === '[object RegExp]';
};

let isObject = function(arg){
    return _typeof(arg) === '[object Object]';
};

let isFunction = function(arg){
    return _typeof(arg) === '[object Function]';
};
function isWindow(obj) {
    return obj && obj.window === obj;
}

function isScope(obj) {
    return obj && obj.$evalAsync && obj.$watch;
}

function isString(value) {return typeof value === 'string';}

function isFile(obj) {
    return toString.call(obj) === '[object File]';
}

function isFormData(obj) {
    return toString.call(obj) === '[object FormData]';
}

function isBlob(obj) {
    return toString.call(obj) === '[object Blob]';
}


function isBoolean(value) {
    return typeof value === 'boolean';
}

function isNumber(value) {return typeof value === 'number';}

function isPromiseLike(obj) {
    return obj && isFunction(obj.then);
}
function isUndefined(value) {return typeof value === 'undefined';}
function isDefined(value) {return typeof value !== 'undefined';}
function isBlankObject(value) {
    return value !== null && typeof value === 'object' && !getPrototypeOf(value);
}

const copy = function(source, destination, stackSource, stackDest) {

    if (!destination) {
        destination = source;
        if (source) {
            if (isArray(source)) {
                destination = copy(source, [], stackSource, stackDest);
            } else if (isDate(source)) {
                destination = new Date(source.getTime());
            } else if (isRegExp(source)) {
                destination = new RegExp(source.source,source.toString().match(/[^\/]*$/)[0]);
                destination.lastIndex = source.lastIndex;
            } else if (isObject(source)) {
                var emptyObject = Object.create(Object.getPrototypeOf(source));
                destination = copy(source, emptyObject, stackSource, stackDest);
            }
        }
    } else {
        if (source === destination)
            throw new Error("Can't copy! Source and destination are identical.");
        stackSource = stackSource || [];
        stackDest = stackDest || [];
        if (isObject(source)) {
            var index = stackSource.indexOf(source);
            if (index !== -1)
                return stackDest[index];
            stackSource.push(source);
            stackDest.push(destination);
        }
        var result;
        if (isArray(source)) {
            destination.length = 0;
            for (var i = 0; i < source.length; i++) {
                result = copy(source[i], null , stackSource, stackDest);
                if (isObject(source[i])) {
                    stackSource.push(source[i]);
                    stackDest.push(result);
                }
                destination.push(result);
            }
        } else {
            if (isArray(destination)) {
                destination.length = 0;
            } else {
                for(var key in destination){
                    delete destination[key];
                }
            }
            for (var key in source) {
                if (source.hasOwnProperty(key)) {
                    result = copy(source[key], null , stackSource, stackDest);
                    if (isObject(source[key])) {
                        stackSource.push(source[key]);
                        stackDest.push(result);
                    }
                    destination[key] = result;
                }
            }
        }
    }
    return destination;
}
function runItem(call,...args) {
    call && call(...args);
}
let forEach = function (arr,callback) {
    if(arr.forEach) {
        arr.forEach(callback);
    }else if(isObject(arr)){
        for (let name in arr){
            arr.hasOwnProperty(name)&&runItem(callback,arr[name],name);
        }
    }
};

function createMap() {
    return Object.create(null);
}

function equals(o1, o2) {
    if (o1 === o2) return true;
    if (o1 === null || o2 === null) return false;
    if (o1 !== o1 && o2 !== o2) return true; // NaN === NaN
    var t1 = typeof o1, t2 = typeof o2, length, key, keySet;
    if (t1 == t2) {
        if (t1 == 'object') {
            if (isArray(o1)) {
                if (!isArray(o2)) return false;
                if ((length = o1.length) == o2.length) {
                    for (key = 0; key < length; key++) {
                        if (!equals(o1[key], o2[key])) return false;
                    }
                    return true;
                }
            } else if (isDate(o1)) {
                if (!isDate(o2)) return false;
                return equals(o1.getTime(), o2.getTime());
            } else if (isRegExp(o1)) {
                return isRegExp(o2) ? o1.toString() == o2.toString() : false;
            } else {
                if (isScope(o1) || isScope(o2) || isWindow(o1) || isWindow(o2) ||
                    isArray(o2) || isDate(o2) || isRegExp(o2)) return false;
                keySet = createMap();
                for (key in o1) {
                    if (key.charAt(0) === '$' || isFunction(o1[key])) continue;
                    if (!equals(o1[key], o2[key])) return false;
                    keySet[key] = true;
                }
                for (key in o2) {
                    if (!(key in keySet) &&
                        key.charAt(0) !== '$' &&
                        isDefined(o2[key]) &&
                        !isFunction(o2[key])) return false;
                }
                return true;
            }
        }
    }
    return false;
}

function toJsonReplacer(key, value) {
    var val = value;

    if (typeof key === 'string' && key.charAt(0) === '$' && key.charAt(1) === '$') {
        val = undefined;
    } else if (isWindow(value)) {
        val = '$WINDOW';
    } else if (value &&  global === value) {
        val = '$GLOBAL';
    } else if (isScope(value)) {
        val = '$SCOPE';
    }

    return val;
}

function toJson(obj, pretty) {
    if (typeof obj === 'undefined') return undefined;
    if (!isNumber(pretty)) {
        pretty = pretty ? 2 : null;
    }
    return JSON.stringify(obj, toJsonReplacer, pretty);
}

function fromJson(json) {
    return isString(json)
        ? JSON.parse(json)
        : json;
}
if(!console.debug){
    console.debug = console.warn;
}
if(!global.angular){
    global.angular={
        copy,
        isFunction,
        isObject,
        isRegExp,
        isDate,
        isNumber,
        isUndefined,
        isDefined,
        isBlankObject,
        isFile,
        isBlob,
        isFormData,
        isScope,
        isArray,
        _typeof,
        forEach,
        isString,
        equals,
        toJson,
        fromJson,
        extend:Object.assign
    }
}
module.exports=$q;