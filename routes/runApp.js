const concat = require('concat-stream');
const appService = require("../service/appService");
let isRunning = false;

/**
 * @param {object} res响应句柄
 * @param {object} data 用户请求json数据
 * data {
 *      appId , 执行appid
 *      userName, 请求用户名
 *      params,   反填app参数为[{id:nodeId,params:[{key,value,paramList}]},{id:nodeId,params:[{key,value,paramList}]}]
 * }
 * */
function dealData(res,data) {
    if(data&&data.userName&&data.appId!==undefined){
        isRunning = true;
        appService.runAppById(data.appId,data.userName,data.params).then((result,hasError,err)=>{
            isRunning = false;
            if(result&&result.hasError){
                res.json({
                    status:'ERROR',
                    message:"app执行出错",
                    errorData:result.error,
                    data:result.results
                });
                return;
            }
            if(angular.isString(result)){
                res.json({
                    status:'ERROR',
                    message:result,
                    data:null,
                });
            }else {
                res.json({
                    status:'OK',
                    message:"",
                    data:result,
                });
            }
            console.log(result);
        })
    }else {
        res.json({
            status: 'ERROR',
            message: "请传入userName和appId",
            data: null,
        });
    }
}

function runAppById(app){
    app.post('/rest/runApp', function(req, res, next) {
        let jsonData;
        if (req.body) {
            jsonData = req.body;
            dealData(res,jsonData);
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
                dealData(res,jsonData);
            }));
        }
    });
}

module.exports = runAppById;