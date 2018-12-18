/**
 * @author cai.liao
 * @description node服务端是没有cookie域保存，连接响应是有cookie但这是基于客户端这里是模拟包括sessionStorage
 * */

class $cookies{
    constructor(){
        this.$$cookieStore={};
    }
    get(key){
        return this.$$cookieStore[key];
    }
    getObject(key) {
        let value = this.get(key);
        return value ? JSON.parse(value) : value;
    }
    putObject(key, value, options) {
        this.put(key, JSON.stringify(value), options);
    }
    getAll(){
        return this.$$cookieStore;
    }
    put(key, value) {
        this.$$cookieStore[key]=value;
    }
    remove(key, options) {
        this.$$cookieStore[key]!==undefined && delete this.$$cookieStore[key];
    }
}
class sessionStorage{
    constructor(){

    }
    setItem(key, value){
        this[key]=value;
    }
    getItem(key){
        return this[key];
    }
    removeItem(key){
        this[key]!==undefined&&delete this[key];
    }
    clear(){
        for(let key in this){
            this[key]!==undefined&&delete this[key];
        }
    }
}
//兼容以前前端代码以免报错
if(!global.window) {
    global.window = {};
    global.window.sessionStorage = new sessionStorage();
}
module.exports = new $cookies();