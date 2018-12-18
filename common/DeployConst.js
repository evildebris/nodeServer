const fs = require("fs");
const $q = require("./$q");

const deploy={
    //zzjz引擎的IP地址。增加：齐工，2016/12/22。
    engineIP:"",
    //zzjz引擎的IP端口。增加：齐工，2016/12/22。
    enginePort:"",
    //服务管理引擎的URL地址。增加：齐工，2017/05/02。
    // managerUrl:"192.168.11.26:9090/cmgr/"
    managerUrl:""
    ,
    //服务管理引擎的IP地址。增加：齐工，2016/12/22。
    //managerIP:"192.168.11.26"
    //,
    //服务管理引擎的端口。增加：齐工，2016/12/22。
    //managerPort:"9009"
    //,
    CMGR_WS:"ws://192.168.11.101:9212/cmgr/websocket.rest",
    uploadUrl_web:"/api/rest/"
    ,
    downLoadUrl_web:"/api/rest/",
    HdfsUrlPrefix:"hdfs://master.zzjz.com:8020",    //集群HDFS上传根地址
    WebUrlPrefix:"/api/rest/",                         //WEB上传根地址
    EngineUrlPrefix:"",                             //引擎上传根地址
    //统一权限管理的IP地址。增加：齐工，2016/12/22。
    authorityUrl:"http://192.168.11.101:9212",
    tyqxUrl:"/auth/:doAction",
    parallelFlag:false,
    //统一权限管理的IP地址。增加：齐工，2016/12/22。
    // authorityIP:"192.168.1.26"
    // ,
    //统一权限管理的端口。增加：齐工，2016/12/22。
    // authorityPort:"9090"

    /**
     * node http 请求映射地址
     * */
    apiRest:"http://192.168.11.101:9212/cmgr",
    upload:"http://192.168.11.101:9212/cmgr/upload",
    auth:"http://192.168.11.101:9212",
    engine:"http://192.168.11.26:8898",
    appMapTiles:"http://192.168.11.102:6091/app/MapTiles",

    /**
     * engineUser 引擎登录用户,默认app列表查询用户
     * */
    engineUser:"liaocai",
};
const defer = $q.defer();
deploy.promise = defer.promise;
//path.join(__dirname, '../config/config.json')
fs.readFile(process.cwd()+'/config/config.json', 'utf8', function(err, data){
    if (err) {
        console.log(err);
        console.log("config.json文件读取出错");
        defer.resolve();
        return;
    }
    try {
        let json = JSON.parse(data);
        Object.assign(deploy, json);
        console.log(json);
        defer.resolve();
    }catch (e){
        defer.resolve();
        console.log("config.json文件解析出错，格式请用json文件")
    }
});
module.exports =deploy;