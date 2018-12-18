const DeployConst =require('./DeployConst');
const ConfigConst =require('./ConfigConst');
const JMQ =require('./JMQ');
const $q = require('./$q');
const $http = require('./$http');
const $cookies = require('./$cookies');

function getApiUrl() {
    var url = DeployConst.apiRest+"/:action";
    return url;
}
function getWsCmgrUrl() {
    var wsProtocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    var port = Number(location.port);
    if (!port) {
        port = 80;
        if (location.protocol === 'https:') {
            port = 443;
        }
    }
    var wsUrl = wsProtocol + "//";
    wsUrl += location.hostname + ":" + port+"/cmgrWebsocket/cmgr/websocket.rest";
    return wsUrl;
}
function getUploadUrl() {
    var url = "";
    if(DeployConst.managerUrl && DeployConst.managerUrl.length > 0) {
        var deployUrl = DeployConst.managerUrl.toLowerCase();
        if(deployUrl.indexOf("http://") !== 0 && deployUrl.indexOf("https://") !== 0) {
            url = location.protocol + "//";
        }
        url += DeployConst.managerUrl;
        //自动补齐地址为 http://XXXXXXX/:action 格式
        if(deployUrl.lastIndexOf(":action") !== (deployUrl.length - 7)) {
            if(deployUrl.lastIndexOf("/") !== (deployUrl.length - 1)) {
                url += "/:action";
            } else {
                url += ":action";
            }
        }
    } else {
        url += ConfigConst.Framework.RestUrl;
    }
    return url;
}
function getDownloadUrl() {
    var url = "";
    if(DeployConst.managerUrl && DeployConst.managerUrl.length > 0) {
        var deployUrl = DeployConst.managerUrl.toLowerCase();
        if(deployUrl.indexOf("http://") !== 0 && deployUrl.indexOf("https://") !== 0) {
            url = location.protocol + "//";
        }
        url += DeployConst.managerUrl;
        //自动补齐地址为 http://XXXXXXX/:action 格式
        if(deployUrl.lastIndexOf(":action") !== (deployUrl.length - 7)) {
            if(deployUrl.lastIndexOf("/") !== (deployUrl.length - 1)) {
                url += "/:action";
            } else {
                url += ":action";
            }
        }
    } else {
        url += ConfigConst.Framework.RestUrl;
    }
    return url;
}
function getTyqxUrl() {
    var url=DeployConst.tyqxUrl;
    return url;
}
function getAuthorityUrl() {
    var url;
    url = DeployConst.auth;
    return url;
}
function getHdfsUrl() {}

var _self = {
    do: function (...args) {
        return DeployConst.promise.then( () => {
            return _self._do(...args);
        })
    },
    "_do": function(action, params, nocache,tyqx) {
        params = params || {};
        //增加登录会话信息
        params.login = _self.loginSession.login;
        var state =_self.getLoginState(),url;
        if(!state){
            return $q.defer().promise;// modified by cai.liao 2018/1/29 pf-1767
        }
        if(!params.hasOwnProperty("user")) {
            params.user =_self.loginSession.user; //usrMsg.userName;
        }
        if(nocache !== undefined) {
            params.dte = new Date().getTime();
        }
        if(tyqx){
            url = this.getTyqxUrl().replace(":action", action);
            params.doAction=action;
            return $http.post(url,params).then(function(result) {
                if(!result) {
                    JMQ.publish(ConfigConst.MessageQueue.Notification, {
                        type: "error",
                        msg: "统一权限服务断开连接"
                    });
                }
                return result;
            }, function(error) {
                JMQ.publish(ConfigConst.MessageQueue.Notification, {
                    type: "error",
                    msg: error.statusText
                });
            });
        }else{
            url = this.getApiUrl().replace(":action", action);
            params.action = action;
            return $http.post(url,params).then(function(result) {
                if(result.result.code !== "2000") {

                    JMQ.publish(ConfigConst.MessageQueue.Notification, {
                        type: "error",
                        msg:result.result.message?result.result.message:"CMGR服务异常"
                    });
                }
                return result;
            }, function(error) {
                var statusText = "服务器响应失效!";
                if(error.status == 504){
                    statusText = "服务器响应超时!"
                }else if(error.status == 500){
                    statusText = "服务器响应失效!";
                }else if(error.status == 404){
                    statusText = "服务器请求失败!";
                }else{
                    statusText = error.statusText;
                }
                JMQ.publish(ConfigConst.MessageQueue.Notification, {
                    type: "error",
                    msg: statusText
                });
                return {result:Object.assign(error,{message:statusText})};
            });
        }
    },
    "uploadFile": function(destination, subdir, file, isFiles,dirId) {
        var self = this;
        var url = "";
        //PF-2022 add tanglvshuang 2018.3.3
        //var userName = loginUser.getLoginUser();
        var userName=_self.getLoginUser();
        var usrMsg=$cookies.getObject(userName);
        if(!isFiles) {
            url = self.getApiUrl().replace(":action", ConfigConst.Framework.RestAction.UploadFile);
            //返回上传的promise对象
            return Upload.upload({
                url: url,
                headers: {
                    'Content-Type': 'multipart/form-data; charset=UTF-8'
                },
                data: {
                    'destination': destination,
                    'directory': subdir,
                    'files': file,
                    'fileName': file.name,
                    'fileContentType': file.type,
                    'dirId':dirId,
                    'user':usrMsg.userName
                }
            });
        } else {
            url = self.getApiUrl().replace(":action", ConfigConst.Framework.RestAction.UploadFiles);
            var defer = $q.defer();
            var formData = new FormData();
            if(formData){
                //PF-2022 add tanglvshuang 2018.3.3
                formData.append('user',usrMsg.userName);
            }
            file.forEach&&file.forEach(function(p) {
                formData.append('file', p);
            });
            $http({
                method: 'post',
                url: url,
                data: formData,
                headers: {
                    'Content-Type': undefined
                },
            }).then(function(request) {
                defer.resolve(request);
            });
            return defer.promise;
        }

    },
    "getApiUrl": getApiUrl,
    "getAuthorityUrl": getAuthorityUrl,
    "loginSession": {
        login: null,
        user: null
    },
    "getLoginUser":function(){
        if(!_self.loginSession||!_self.loginSession.user) {//modified by qiyongjie, 2018.3.9
            var  myStorage = window.sessionStorage;//modified by tanglvshuang, 2018.3.9
            var userName = myStorage.getItem("myName");
            if(userName){
                _self.loginSession.user=userName;
            }
        }
        return _self.loginSession.user;
    },
    "getLoginState":function(){
        var userMsg = $cookies.getObject($cookies.getObject('lastLoginUser'));
        var storage = window.sessionStorage;
        if(userMsg||storage){
            return true;
        }else{
            return false;
        }
    },
    "getWsCmgrUrl":getWsCmgrUrl
};
module.exports = _self;