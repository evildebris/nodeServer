const concat = require('concat-stream');
const appService = require("../service/appService");
let isRunning = false;

/**
 * @param {object} res响应句柄
 * @param {object} data 用户请求json数据
 * data {
 *      appName, 请求app name
 * }
 * */
function sendData(res,data,_callback) {
    if (_callback){
        res.type('application/json');
        res.jsonp(data);
    }else {
        res.json(data);
    }
}
function dealData(res,data,_callback) {
    if(data&&data.userName){
        appService.getAppByUserName(data.userName,data.appName).then((result)=>{
            let r;
            if(angular.isString(result)){
                r = {
                    status:'ERROR',
                    message:result,
                    data:null,
                };
                res.json(r);
            }else {
                r ={
                    status:'OK',
                    message:"",
                    data:result,
                };
                sendData(res,r,_callback);
                console.log(result);
            }
        })
    }else {
        sendData(res,{
            status: 'ERROR',
            message: "请传入userName查询app信息",
            data: null,
        },_callback);
    }
}

function getAppByName(app){
    function handleGetAppByAppName(req, res, next) {
        let jsonData;
        let _callback = req.query.callback;
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, POST');
        res.set('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
        if (req.body) {
            if(req.method === 'GET'){
                jsonData = req.query;
            }else {
                jsonData = req.body;
            }
            dealData(res,jsonData,_callback);
        }else {//json解析不出来 自己读取原始数据
            req.pipe(concat((rawData)=>{
                if (typeof rawData === "string") {
                    try {
                        rawData = JSON.parse(rawData);
                    }catch (e){
                        console.warn(`code status ${req.statusCode},getAppByUserName data can\'t json parse.`);
                    }
                }
                jsonData = rawData;
                dealData(res,jsonData,_callback);
            }))
        }
    }
    app.post('/rest/getAppByAppName', handleGetAppByAppName);
    app.get('/rest/getAppByAppName', handleGetAppByAppName);
}

module.exports = getAppByName;