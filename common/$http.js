/**
 * @author cai.liao
 * @description 封装http
 * */
const $q = require('./$q');
const http = require('http');
const URL = require('url');
const querystring = require('querystring');
const zlib = require('zlib');
const concat = require('concat-stream');

let cookies,JSESSIONID=undefined;//JSESSIONID维护session会话id
function $http(options) {
    //init
    let isJson=false,Data=options.data;
    if(options.headers&& options.headers['Content-Type']&&options.headers['Content-Type'].indexOf('application/json')>-1){
        isJson = true;
    }
    if(JSESSIONID){
        options.headers.Cookie = JSESSIONID;
    }
    typeof Data === "object" && (Data = isJson ? JSON.stringify(options.data) : querystring.stringify(options.data));
    Data && (options.headers['Content-Length']=Buffer.byteLength(Data));
    if(options.url){ //parse url
        let _url=URL.parse(options.url);
        Object.assign(options,{
            hostname: _url.hostname||'localhost',
            method: 'POST',
            path:_url.path,
            port:_url.port
        });
    }


    const defer = $q.defer();
    const req = http.request(options, (res) => {
        console.log(`STATUS: ${res.statusCode}`);
        /*let error,{ statusCode } = res,contentType = res.headers['content-type'];
        if (statusCode !== 200) {
            error = new Error('Request Failed.\n' +
                `Status Code: ${statusCode}`);
        } else if (!/^application\/json/.test(contentType)) {
            error = new Error('Invalid content-type.\n' +
                `Expected application/json but received ${contentType}`);
        }
        if (error) {
            // consume response data to free up memory
            res.resume();
            defer.reject(error);
            console.info(error.message);
            return;
        }*/
        let isGzip =  res.headers['content-encoding'] && (res.headers['content-encoding'].indexOf('gzip') !== -1),
        isJsonParse = res.headers['content-type']&&(res.headers['content-type'].indexOf('application/json') !== -1);
        if(res.headers["set-cookie"]){
            cookies = res.headers["set-cookie"];
            if(cookies&&cookies.forEach){
                cookies.forEach(function (cookie) {
                    if(cookie.indexOf("JSESSIONID")>-1){
                        let _JSESSIONID =cookie.split(";").filter(function(e){return e.indexOf("JSESSIONID")>-1});
                        if(_JSESSIONID&&_JSESSIONID.length){
                            JSESSIONID = _JSESSIONID[0];
                        }
                    }
                });
            }
        }
        if(isGzip){
            let readRawData=concat(function(rawData){
                rawData = rawData.toString();
                if (typeof rawData === "string") {
                    try {
                        rawData = JSON.parse(rawData);
                    }catch (e){
                        console.warn(`code status ${res.statusCode}, rawData can\'t json parse.`);
                    }
                }
                defer.resolve(rawData);
                console.log('No more data in response.');
            })
            res.pipe(zlib.createGunzip()).pipe(readRawData);
        }else {
            res.setEncoding("utf8");
            res.pipe(concat((rawData)=>{
                if (typeof rawData === "string") {
                    try {
                        rawData = JSON.parse(rawData);
                    }catch (e){
                        console.warn(`code status ${res.statusCode}, rawData can\'t json parse.`);
                    }
                }
                defer.resolve(rawData);
                console.log('No more data in response.');
            }))
        }
        /*res.on('data', (chunk) => {
            rawData += chunk;
            /!*if(isGzip){
                rawData.push(chunk);
            }else {
                rawData += chunk;
            }*!/
        });
        res.on('end', () => {
            if(isGzip){
                debugger
                let buffer = new Buffer(rawData,"binary");
                zlib.gunzip(buffer, function(err, decoded) {
                    rawData = decoded.toString();
                    if (typeof rawData === "string") {
                        rawData = JSON.parse(rawData);
                    }
                    defer.resolve(rawData);
                    console.log('No more data in response.');
                })
            }else {
                if (typeof rawData === "string") {
                    rawData = JSON.parse(rawData);
                }
                defer.resolve(rawData);
                console.log('No more data in response.');
            }
        });*/
    });
    req.on('error', (e) => {
        console.info(`problem with request: ${e.message}`);
        defer.reject(e);
    });
    Data && req.write(Data);
    req.end();
    return defer.promise;
}
$http.get = function (url,data={}) {
    /*const defer = $q.defer();
    http.get(url,(res) =>{
        debugger
        const { statusCode } = res;
        const contentType = res.headers['content-type'];

        let error,isGzip = res.headers['content-encoding']&&res.headers['content-encoding'].indexOf('gzip') !== -1;
        if (statusCode !== 200) {
            error = new Error('Request Failed.\n' +
                `Status Code: ${statusCode}`);
        } else if (!/^application\/json/.test(contentType)) {
            error = new Error('Invalid content-type.\n' +
                `Expected application/json but received ${contentType}`);
        }
        if (error) {
            // consume response data to free up memory
            res.resume();
            defer.reject(error);
            console.info(error.message);
            return;
        }

        res.setEncoding('utf8');
        /!*res.pipe(concat((rawData)=>{
            if (typeof rawData === "string") {
                rawData = JSON.parse(rawData);
            }
            defer.resolve(rawData);
            console.log('No more data in response.');
        }))*!/
        let rawData = '';
        res.on('data', (chunk) => {
            rawData += chunk;
        });
        res.on('end', () => {
            try {
                let parsedData;
                parsedData =JSON.parse(rawData);
                defer.resolve(parsedData);
            } catch (e) {
                console.error(e.message);
            }
        });
    }).on('error', (e) => {
        defer.reject(e);
        console.error(`Get error: ${e.message}`);
    });
    return defer.promise;*/
    let _url=URL.parse(url);
    let options = Object.assign({
        hostname: _url.hostname||'localhost',
        method: 'GET',
        path:_url.path,
        port:_url.port,
        headers: {
            "accept-encoding" : "gzip,deflate",
            "accept-language" : "en-US,en;q=0.8",
            encoding:null,
            "accept" : "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }
    },{data});
    return $http(options);
};
$http.post =function (url,data={}) {
    let _url=URL.parse(url);
    let options = Object.assign({
        hostname: _url.hostname||'localhost',
        method: 'POST',
        path:_url.path,
        port:_url.port,
        headers: {
            'Content-Type': 'application/json;charset=UTF-8',
            "accept-encoding" : "gzip,deflate",
            "accept-language" : "en-US,en;q=0.8",
            encoding:null,
            "accept" : "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }
    },{data});
    return $http(options);
};
module.exports = $http;
//post 校验
//$http.post('http://192.168.11.101:9212/cmgr/queryComponentTemplate.rest',{"component":{"id":"2601"},"login":null,"user":null,"action":"queryComponentTemplate.rest"});
