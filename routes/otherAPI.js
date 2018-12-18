const concat = require('concat-stream');
const appService = require("../service/appService");
const ChartCase = require("../ComLib/chartCaseService");
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
function dealData(res,_callback) {
    const cases = ChartCase.getCases();
    const result = {
        status:'OK',
        message:"",
        data:cases,
    };
    sendData(res,result,_callback);
}
function dealData2(res,data,_callback) {
    if(data&&data.appId!==undefined){
        appService.runAppGetChartData(data.appId,data.params).then((result,hasError,err)=>{
            let r;
            if(result&&result.hasError){
                r = {
                    status:'ERROR',
                    message:"app执行出错",
                    errorData:result.error,
                    data:result.results
                };
            } else if(angular.isString(result)){
                r = {
                    status:'ERROR',
                    message:result,
                    data:null,
                };
            } else {
                r ={
                    status:'OK',
                    message:"",
                    data:result,
                };
            }
            sendData(res,r,_callback);
            console.log(result);
        })
    }else {
        sendData(res,{
            status: 'ERROR',
            message: "请传入appId",
            data: null,
        },_callback);
    }

}
function dealData3(res,data,_callback) {
    if(data&&data.appId!==undefined&&data.linkageId&&data.selectedData){
        appService.runLinkage(data.appId,data.linkageId,data.selectedData).then((result,hasError,err)=>{
            let r;
            if(result&&result.hasError){
                r = {
                    status:'ERROR',
                    message:"app执行出错",
                    errorData:result.error,
                    data:result.results
                };
            } else if(angular.isString(result)){
                r = {
                    status:'ERROR',
                    message:result,
                    data:null,
                };
            } else {
                r ={
                    status:'OK',
                    message:"",
                    data:result,
                };
            }
            sendData(res,r,_callback);
            console.log(result);
        })
    }else {
        sendData(res,{
            status: 'ERROR',
            message: "请传入刷选参数",
            data: null,
        },_callback);
    }

}
function dealData4(res,data,_callback) {
    if(data&&data.appId!==undefined&&data.linkageId&&data.selectedData){
        /**/
    }else {
        sendData(res,{
            status: 'ERROR',
            message: "请传入刷选参数",
            data: null,
        },_callback);
    }

}

function otherAPI(app){
    function dealGetCase(req, res, next) {
        let jsonData;
        let _callback = req.query.callback;
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, POST');
        res.set('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
        if (req.body) {
            jsonData = req.body;
            dealData(res,_callback);
        }else {//json解析不出来 自己读取原始数据
            req.pipe(concat((rawData) => {
                dealData(res,_callback);
            }))
        }
    }
    function dealRunAppGetChartData(req, res, next){
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
            dealData2(res,jsonData,_callback);
        }else {//json解析不出来 自己读取原始数据
            req.pipe(concat((rawData) => {
                if (typeof rawData === "string") {
                    try {
                        rawData = JSON.parse(rawData);
                    }catch (e){
                        console.warn(`code status ${req.statusCode},runAppGetChartData data can\'t json parse.`);
                    }
                }
                jsonData = rawData;
                dealData2(res,jsonData,_callback);
            }))
        }
    };
    function dealRunLinkage(req, res, next){
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
            dealData3(res,jsonData,_callback);
        }else {//json解析不出来 自己读取原始数据
            req.pipe(concat((rawData) => {
                if (typeof rawData === "string") {
                    try {
                        rawData = JSON.parse(rawData);
                    }catch (e){
                        console.warn(`code status ${req.statusCode},runLinkage data can\'t json parse.`);
                    }
                }
                jsonData = rawData;
                dealData3(res,jsonData,_callback);
            }))
        }
    };
    function dealQuery(methodName,callBack,req, res) {
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
            callBack(res,jsonData,_callback);
        }else {//json解析不出来 自己读取原始数据
            req.pipe(concat((rawData) => {
                if (typeof rawData === "string") {
                    try {
                        rawData = JSON.parse(rawData);
                    }catch (e){
                        console.warn(`code status ${req.statusCode},${methodName} data can\'t json parse.`);
                    }
                }
                jsonData = rawData;
                callBack(res,jsonData,_callback);
            }))
        }
    }
    app.get('/rest/getCase',dealGetCase );
    app.post('/rest/getCase',dealGetCase );
    app.get('/rest/runAppGetChartData',dealRunAppGetChartData );
    app.post('/rest/runAppGetChartData',dealRunAppGetChartData );
    app.get('/rest/runLinkage',dealRunLinkage );
    app.post('/rest/runLinkage',dealRunLinkage );
    app.get('/rest/addApp.rest',(req, res, next) => {dealQuery('addApp.rest',dealData4,req, res)} );
    app.post('/rest/addApp.rest',(req, res, next) => {dealQuery('addApp.rest',dealData4,req, res)} );
}

module.exports = otherAPI;