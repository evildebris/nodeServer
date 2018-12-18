const concat = require('concat-stream');
const appService = require("../service/appService");
/**
 * @param {object} res响应句柄
 * @param {object} data 用户请求json数据
 * data {
 *      userName, 请求用户名
 * }
 * */
function dealData(res,data) {
    if(data&&data.userName){
        appService.getAppByUserName(data.userName,data.appName).then((result)=>{
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
        })
    }else {
        res.json({
            status: 'ERROR',
            message: "请传入userName查询app信息",
            data: null,
        });
    }
}

function getAppByUserName(app){
    app.post('/rest/getAppByUserName', function(req, res, next) {
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
            }))
        }
    });
}

module.exports = getAppByUserName;