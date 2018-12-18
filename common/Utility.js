const $q = require('./$q');
const RestApi = require('./restApi');
const ConfigConst = require('./ConfigConst');
const self= {
    uuid: function (len, radix) {
        var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        var uuid = [], i;
        radix = radix || chars.length;

        if (len) {
            for (i = 0; i < len; i++) {
                uuid[i] = chars[0 | Math.random() * radix];
            }
        } else {
            var r;
            uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
            uuid[14] = '4';
            uuid[0]=chars[10 | Math.random() * 16];
            for (i = 0; i < 36; i++) {
                if (!uuid[i]) {
                    r = 0 | Math.random() * 16;
                    uuid[i] = chars[(i === 19) ? (r & 0x3) | 0x8 : r];
                }
            }
        }

        return uuid.join('');
    },
    uuid2:function(len){
        //产生最多25位36进制随机数
        if(!len || typeof(len) !== "number"|| len>25 || len<0){
            len=25;
        }
        var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        var uuid=[];
        uuid.push(chars[Math.floor(Math.random()*26)+10]);
        for(var i=0;i<len-1;i++){
            uuid.push(chars[Math.floor(Math.random()*36)]);
        }
        return uuid.join("");
    },
    uuid3:function(len){
        //产生最多8位62进制随机数
        if(!len || typeof(len) !== "number"|| len>8 || len<0) len=8;
        var chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        var uuid=[];
        uuid.push(chars[Math.floor(Math.random()*52)+10]);
        for(var i=0;i<len-1;i++){
            uuid.push(chars[Math.floor(Math.random()*62)]);
        }

        return uuid.join("");
    },
    timeUuid: function(){
        return String.fromCharCode(65+Math.random()*26)+((new Date()).getTime()-1223701200000).toString(36).toUpperCase();
    },
    timeUuid2Date: function(uuid){
        return new Date(parseInt(uuid.substr(1),36)+1223701200000);
    },
    inherit:function(parent,child){
        //继承父成员
        angular.copy(parent,child);
        //继承父原型方法
        for(var key in parent.__proto__){
            if(key !== "constructor" && key !== "__proto__"){
                child.__proto__[key]=parent.__proto__[key];
            }
        }
        return child;
    },
    parseDate:function(dateStr,format){
        if(!format){
            format="yyyy-MM-dd HH:mm:ss";
        }
        if(format === "yyyy-MM-dd HH:mm:ss"){
            var d=Date.parse(dateStr.replace(/-/g,"/"));
            return isNaN(d)?new Date(0):new Date(d);
        }else if(format === "yyyy/MM/dd HH:mm:ss"){
            var d=Date.parse(dateStr);
            return isNaN(d)?new Date(0):new Date(d);
        }
    },
    upload:function(destination, subdir, file, isFiles,dirId){
        if(!destination || !file){//|| !file.name
            //直接reject
            var defer=$q.defer();
            setTimeout(function(){defer.reject("未指定上传目的或上传文件");},0);
            return defer.promise;
        }
        //根据上传目的和文件类型，对子目录做限制
        var filename = "";
        if(!isFiles){
            var filename = file.name.toLowerCase();
        }
        if(destination === ConfigConst.Framework.Upload.Destination_Web){
            var subdirprefix="";
            if(self.stringStartWith(file.type,"image/")){
                //图片文件
                subdirprefix="/"+ConfigConst.Framework.Upload.SubDirectory_WebImage;
            }else if(self.stringEndWith(filename,"html")||self.stringEndWith(filename,"htm")){
                //页面模板文件
                subdirprefix="/"+ConfigConst.Framework.Upload.SubDirectory_WebTemplate;
            }else{
                subdirprefix="/"+ConfigConst.Framework.Upload.SubDirectory_WebOther;
            }
            if(subdir && subdir.length>0){
                subdir=subdirprefix+((subdir[0]!=='/')?"/":"")+subdir;
            }else{
                subdir=subdirprefix;
            }
        }
        //返回上传的promise对象
        return RestApi.uploadFile(destination,subdir,file,isFiles,dirId);
    },

    /**
     * SGK: apputillity.factory.js文件迁移过来的方法
     *
     * */
    appUuid: function (len, radix) {
        var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
        var uuid = [], i;
        radix = radix || chars.length;

        if (len) {
            for (i = 0; i < len; i++) {
                uuid[i] = chars[0 | Math.random() * radix];
            }
        } else {
            var r;
            uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
            uuid[14] = '4';
            uuid[0] = chars[10 | Math.random() * 16];
            for (i = 0; i < 36; i++) {
                if (!uuid[i]) {
                    r = 0 | Math.random() * 16;
                    uuid[i] = chars[(i === 19) ? (r & 0x3) | 0x8 : r];
                }
            }
        }

        return uuid.join('');
    },
    appTimeUuid: function(){
        var now = new Number((new Date()).getTime()-1223701200000);
        return now.toString(36).toUpperCase();
    },
    time2str: function(now){
        var nowstr=now.getFullYear().toString();
        nowstr+=now.getMonth()<9?"0"+(now.getMonth()+1).toString():(now.getMonth()+1).toString();
        nowstr+=now.getDate()<10?"0"+now.getDate().toString():now.getDate().toString();
        nowstr+="-";
        nowstr+=now.getHours()<10?"0"+now.getHours().toString():now.getHours().toString();
        nowstr+=now.getMinutes()<10?"0"+now.getMinutes().toString():now.getMinutes().toString();
        nowstr+=now.getSeconds()<10?"0"+now.getSeconds().toString():now.getSeconds().toString();
        return nowstr;
    },
    removeArrayItem: function (arr, filter) {
        if (!arr || !filter) return arr;
        if (typeof(filter) === "function") {
            for (var i = arr.length - 1; i >= 0; i--) {
                if (filter(arr[i])) {
                    for (var j = i + 1; j < arr.length; j++) {
                        arr[j - 1] = arr[j];
                    }
                    arr.length = arr.length - 1;
                }
            }
        } else if (typeof(filter) === "number") {
            if (filter >= 0 && filter < arr.length) {
                for (var n = filter + 1; n < arr.length; n++) {
                    arr[n - 1] = arr[n];
                }
                arr.length = arr.length - 1;
            }
        }
        return arr;
    },
    indexOf: function (arr, indexFn) {
        if (!arr || !indexFn || (typeof(indexFn) !== "function")) return -1;
        for (var i = 0; i < arr.length; i++) {
            if (indexFn(arr[i])) return i;
        }
        return -1;
    },
    isArray: function (obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    },
    contains: function (arr, item) {
        if (!arr || !item) return false;
        if (this.isArray(arr)) {
            return arr.some(function (x) { return angular.equals(x, item) });
        } else {
            for (var key in arr) {
                if (angular.equals(arr[key], item)) return true;
            }
            return false;
        }
    },
    mergeArrays: function (mergeto, srcArray) {
        if(!mergeto) return angular.copy(srcArray);
        if(!srcArray) return mergeto;
        srcArray.forEach(function (x) {
            if(!self.contains(mergeto, x)) mergeto.push(x);
        });
        return mergeto;
    },
    stringStartWith: function (str, searched) {
        if(!str || !searched) return false;
        return str.indexOf(searched) === 0;
    },
    stringEndWith: function (str, searched) {
        if(!str || !searched || str.length<searched.length) return false;
        return str.substring(str.length-searched.length) === searched;
    },
    some:function(obj, fn){
        if(!obj || !fn) return false;
        var found=false;
        if(angular.isArray(obj)){
            for(var i=0; i<obj.length; i++){
                if(fn(obj[i], i, obj)){
                    found=true;
                    break;
                }
            }
        }else{
            for(var k in obj){
                var v = obj[k];
                if(v && typeof(v) !== 'function'){
                    if(fn(v,k,obj)){
                        found=true;
                        break;
                    }
                }
            }
        }
        return found;
    },
    distinctArray:function(arr){
        var newArr=[],obj={};
        for(var i=0, len=arr.length; i<len; i++){
            if(!angular.equal(obj[typeof(arr[i])+arr[i]],arr[i])){
                newArr.push(arr[i]);
                obj[typeof(arr[i])+arr[i]]=arr[i];
            }
        }
        return newArr;
    },
    newNodeId:function(randLen){
        // 采用uuid2则产生大小写不敏感的唯一码，采用uuid3则产生大小写敏感的唯一码
        //return randLen?self.uuid2(randLen):self.uuid2(ConfigConst.Scheduling.DefaultNodeIdLength);
        return randLen?self.uuid3(randLen):self.uuid3(ConfigConst.Scheduling.DefaultNodeIdLength);
    },
    /**
     * 按照对象内各属性的名称字母序，生成对象的深度拷贝
     * @param source输入对象
     * @return {{}}输入对象的深度拷贝
     */
    sortProperties:function(source){
        var target=undefined,proper=[];
        if(source){
            if(source instanceof Array) {
                target = [];
                for(var i=0;i<source.length;i++){
                    target.push(self.sortProperties(source[i]));
                }
            }else if(typeof(source)=="object"){
                target={};
                for(var key in source){
                    if(key&&key!="$$hashKey"&&typeof(source[key])!="function"){
                        proper.push(key);
                    }
                }
                var sorted=proper.sort();
                for(var i=0;i<sorted.length;i++){
                    var key=sorted[i],value=source[sorted[i]];
                    if(value&&typeof(value)=="object"){
                        if(value instanceof Date || value instanceof RegExp){
                            target[key]=value;
                        }else {
                            target[key]=self.sortProperties(value);
                        }
                    }else{
                        target[key]=value;
                    }
                }
            }else{
                return source;
            }
        }
        return target;
    },
    /**
     * 按照对象内各属性的名称字母序，生成对象的JSON文本
     * @param obj 输入对象
     * @return {string}JSON文本
     * @constructor
     */
    stringifySortly:function(obj){
        if(!obj) return "";
        if(typeof obj != "object") return obj.toString();
        var cp=self.sortProperties(obj);
        return angular.toJson(cp);
    }
};

module.exports=self;