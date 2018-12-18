/**
 * @author cai.liao
 * @description 使用Buffer实现一个简单的缓存机制
 * */
const cache = {};

class $cache{
    get(key){
        let data = cache[key];
        if(data!==undefined){
            data =  JSON.parse(data.toString());
        }
        return data;
    }
    getAll(){
        let c={};
        for(let key in cache){
            c[key] = this.get(key);
        }
        return c;
    }
    removeAll(){
        for(let key in cache){
            this.remove(key);
        }
    }
    put(key, value) {
        cache[key] = new Buffer(JSON.stringify(value));
    }
    remove(key) {
        cache[key]!==undefined && delete cache[key];
    }
}

module.exports=new $cache();