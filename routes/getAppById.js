const concat = require('concat-stream');
const appService = require("../service/appService");
/**
 * @param {object} res响应句柄
 * @param {object} data 用户请求json数据
 * data {
 *      appId, app的id
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
    if(data&&data.appId){
        appService.getAppById2(data.appId).then((result)=>{
            let data;
            if(angular.isString(result)){
                data = {
                    status:'ERROR',
                    message:result,
                    data:null,
                };
            } else {
                data = {
                    status:'OK',
                    message:"",
                    data:result,
                };
            }
            sendData(res,data,_callback);
        })
    }else {
        sendData(res,{
            status: 'ERROR',
            message: "请传入appId查询app信息",
            data: null,
        },_callback);
    }
}

function getAppById(app){
    function dealGetAppById(req, res, next) {
        let jsonData;
        let _callback = req.query.callback;
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
        if (req.body) {
            if(req.method === 'GET'){
                jsonData = req.query;
            }else {
                jsonData = req.body;
            }
            dealData(res,jsonData,_callback);
        }else {//json解析不出来 自己读取原始数据
            req.pipe(concat((rawData) => {
                if (typeof rawData === "string") {
                    try {
                        rawData = JSON.parse(rawData);
                    }catch (e){
                        console.warn(`code status ${req.statusCode},getAppById data can\'t json parse.`);
                    }
                }
                jsonData = rawData;
                dealData(res,jsonData,_callback);
            }))
        }
    }
    app.get('/rest/getAppById',dealGetAppById );
    app.post('/rest/getAppById',dealGetAppById );
}

module.exports = getAppById;