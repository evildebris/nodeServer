/**
 * @description  ws APi接口地址npm直接查找 https://github.com/websockets/ws/blob/HEAD/doc/ws.md
 * */
const DeployConst =require('../common/DeployConst');
const ConfigConst =require('../common/ConfigConst');
const JMQ =require('../common/JMQ');
const $http = require('../common/$http');
const loginService = require('../login/login.service');
const WebSocket = require("ws");
const querystring = require('querystring');
var websocketCalls = {};
var pingIntervalId;
var ticket=undefined;
var _connected=null;
var _authReported=false;

//看门狗开关打开，表明看门狗正在工作
var _watchDogSwitch=false;
//看门狗检查时间点
var _watchDogCheckPoint=null;

// 根据部署配置生成ws的URL地址
function getWsUrl() {
    return DeployConst.engine+"/ws";
}

// 根据部署配置生成ws的API URL地址
function getApiUrl() {
    return DeployConst.engine+"/api";
}

function skipTrailingSlash(path) {
    return path.replace(/\/$/, '');
}

//获取引擎认证凭据
function auth() {
    return $http.get(getApiUrl() + '/security/ticket').then(function(response) {
        ticket = JSON.parse(response.data).body;
    }, function(errorResponse) {
        ticket=undefined;
        setTimeout(auth, 10000);
        console.error("引擎认证失败",errorResponse);
    });
}

//v0.8.1引擎认证方式
function auth2(){
    ticket=undefined;
    DeployConst.promise.then(()=>{
        $http({
            method: 'POST',
            url: getApiUrl() + '/login',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: querystring.stringify({
                'userName': loginService.getCookies().userName,
                'password': 'password1'
            })
        }).then(function successCallback(data) {
            ticket = data.body;
            JMQ.publish(ConfigConst.MessageQueue.Notification,{
                type:"info",
                msg:"引擎认证通过"
            });
            _authReported=false;
        }, function errorCallback(errorResponse) {
            ticket=undefined;
            setTimeout(auth2, 10000);
            if(!_authReported){
                JMQ.publish(ConfigConst.MessageQueue.Notification,{
                    type:"error",
                    msg:"引擎认证失败"
                });
                _authReported=true;
            }
            console.error("引擎认证失败",errorResponse);
        });
    });
}
/**
 * 看门狗检查策略：如果检查点为空表示无需检查。如果检查点时间已过则表示引擎响应超时。
 * 如果检查点时间未过则响应有效并设置下一次timeout。
 */
function watchDog(){
    if(_watchDogCheckPoint){
        var now=new Date().getTime();
        if(now<_watchDogCheckPoint){
            //检查点未过，启动下一次检查
            setTimeout(watchDog,_watchDogCheckPoint-now);
            _watchDogSwitch=true;
        }else{
            //检查点已过，响应超时。视为引擎故障
            _watchDogCheckPoint=null;
            _watchDogSwitch=false;
            JMQ.publish(ConfigConst.MessageQueue.Scheduling_Timeout,true);
            // WsMessenger.reconnect();
            setTimeout(init,1000);
        }
    }else{
        //引擎已返回全部消息，无需再检查
        _watchDogSwitch=false;
    }
}

/**
 * 设置看门狗策略：如果已有看门狗在检查，则仅修改检查点时间。否则启动看门狗。
 */
function setWatchDog() {
    if(!_watchDogSwitch){
        //启动看门狗
        setTimeout(watchDog,ConfigConst.Scheduling.EngineTimeout);
    }
    _watchDogSwitch+=(new Date()).getTime()+ConfigConst.Scheduling.EngineTimeout;
}

/**
 * 复位看门狗策略：设置检查点为空，等待看门狗自动结束。
 */
function resetWatchDog(){
    _watchDogCheckPoint=null;
}

function init() {
    //完成必要的公开对象和方法初始化
    websocketCalls.rest = function (action, params, nocache) {
        params = params || {};
        params.action = action;
        if (nocache != undefined) {
            params.dte = new Date().getTime();
        }
        var url = getApiUrl()+ "/notebook/:action";
        url = url.replace(":action", action);
        return $http.post(url,params);
    };
    websocketCalls.apiRest = function (action, params, nocache) {
        params = params || {};
        params.action = action;
        if (nocache != undefined) {
            params.dte = new Date().getTime();
        }
        var url = getApiUrl()+ "/:action";
        url = url.replace(":action", action);
        return $http.post(url,params);
    };
    websocketCalls.getApiUrl=getApiUrl;

    //判断ws是否已连接
    if(websocketCalls.ws&&websocketCalls.isConnected()){
        //关闭连接
        websocketCalls.ws.close(true);
        websocketCalls.ws=undefined;
        setTimout(init,100);
        return websocketCalls;
    }
    websocketCalls.init=init;

    //使用登录用户名登录引擎
    var usrMsg=loginService.getCookies();
    if(!usrMsg || !usrMsg.userName) {
        //关闭连接
        if(websocketCalls&&websocketCalls.ws&&websocketCalls.ws.close) {
            websocketCalls.ws.close(true);
        }
        websocketCalls.ws = undefined;
        setTimeout(init,100);
        return websocketCalls;
    }
    //认证以获取凭据
    auth2();

    DeployConst.promise.then(()=>{
        websocketCalls.ws = new WebSocket(getWsUrl());
        websocketCalls.ws.reconnectIfNotNormalClose = true;

        websocketCalls.ws.on("open",function () {
            //console.log('Websocket created');
            pingIntervalId = setInterval(function () {
                websocketCalls.sendNewEvent({op: 'PING'});
            }, 30000);
            _connected = true;
            JMQ.publish(ConfigConst.MessageQueue.Scheduling_ConnectChanged, true, new Date());
        });

        websocketCalls.ws.on("message",function (data) {
            var payload;
            if (data) {
                payload = JSON.parse(data);
            }else {
                return;
            }
            console.log('引擎 << %o, %o', payload.op, payload);
            //默认关闭看门狗，某些消息重新打开看门狗
            resetWatchDog();
            var op = payload.op;
            var data = payload.data;
            if (op === 'NOTE') {
                JMQ.publish(ConfigConst.MessageQueue.Scheduling_Note, data.note);
            } else if (op === 'NEW_NOTE') {
                //
            } else if (op === 'NOTES_INFO') {
                JMQ.publish('setNoteMenu', data.notes);
            } else if (op === 'LIST_NOTE_JOBS') {
                JMQ.publish('setNoteJobs', data.noteJobs);
            } else if (op === 'LIST_UPDATE_NOTE_JOBS') {
                JMQ.publish('setUpdateNoteJobs', data.noteRunningJobs);
            } else if (op === 'AUTH_INFO') {
                var btn = [];
                if (ticket.roles === '[]') {
                    JMQ.publish(ConfigConst.MessageQueue.Notification,{
                        type:"error",
                        msg:"引擎认证失败"
                    });
                } else {
                    // btn = [{
                    //     label: 'Login',
                    //     action: function (dialog) {
                    //         dialog.close();
                    //         angular.element('#loginModal').modal({
                    //             show: 'true'
                    //         });
                    //     }
                    // }, {
                    //     label: 'Cancel',
                    //     action: function (dialog) {
                    //         dialog.close();
                    //         // using $rootScope.apply to trigger angular digest cycle
                    //         // changing $location.path inside bootstrap modal wont trigger digest
                    //         $rootScope.$apply(function () {
                    //             $location.path('/');
                    //         });
                    //     }
                    // }];
                }

                // BootstrapDialog.show({
                //     closable: false,
                //     closeByBackdrop: false,
                //     closeByKeyboard: false,
                //     title: 'Insufficient privileges',
                //     message: data.info.toString(),
                //     buttons: btn
                // });

            } else if (op === 'PARAGRAPH') {
                JMQ.publish('updateParagraph', data.paragraph);
            } else if (op === 'RUN_PARAGRAPH_USING_SPELL') {
                JMQ.publish('runParagraphUsingSpell', data);
            } else if (op === 'PARAGRAPH_APPEND_OUTPUT') {
                //后续仍然有消息
                setWatchDog();
                JMQ.publish('appendParagraphOutput', data);
            } else if (op === 'PARAGRAPH_UPDATE_OUTPUT') {
                JMQ.publish('updateParagraphOutput', data);
            } else if (op === 'PROGRESS') {
                //后续仍然有消息
                JMQ.publish('updateProgress', data);
            } else if (op === 'COMPLETION_LIST') {
                JMQ.publish('completionList', data);
            } else if (op === 'EDITOR_SETTING') {
                JMQ.publish('editorSetting', data);
            } else if (op === 'ANGULAR_OBJECT_UPDATE') {
                JMQ.publish('angularObjectUpdate', data);
            } else if (op === 'ANGULAR_OBJECT_REMOVE') {
                JMQ.publish('angularObjectRemove', data);
            } else if (op === 'APP_APPEND_OUTPUT') {
                JMQ.publish('appendAppOutput', data);
            } else if (op === 'APP_UPDATE_OUTPUT') {
                JMQ.publish('updateAppOutput', data);
            } else if (op === 'APP_LOAD') {
                JMQ.publish('appLoad', data);
            } else if (op === 'APP_STATUS_CHANGE') {
                JMQ.publish('appStatusChange', data);
            } else if (op === 'LIST_REVISION_HISTORY') {
                JMQ.publish('listRevisionHistory', data);
            } else if (op === 'NOTE_REVISION') {
                JMQ.publish('noteRevision', data);
            } else if (op === 'INTERPRETER_BINDINGS') {
                JMQ.publish('interpreterBindings', data);
            } else if (op === 'ERROR_INFO') {
                BootstrapDialog.show({
                    closable: false,
                    closeByBackdrop: false,
                    closeByKeyboard: false,
                    title: 'Details',
                    message: data.info.toString(),
                    buttons: [{
                        // close all the dialogs when there are error on running all paragraphs
                        label: 'Close',
                        action: function () {
                            BootstrapDialog.closeAll();
                        }
                    }]
                });
            } else if (op === 'SESSION_LOGOUT') {
                JMQ.publish('session_logout', data);
            } else if (op === 'CONFIGURATIONS_INFO') {
                JMQ.publish('configurationsInfo', data);
            } else if (op === 'INTERPRETER_SETTINGS') {
                JMQ.publish('interpreterSettings', data);
            } else if (op === 'PARAGRAPH_ADDED') {
                JMQ.publish('addParagraph', data.paragraph, data.index);
            } else if (op === 'PARAGRAPH_REMOVED') {
                JMQ.publish('removeParagraph', data.id);
            } else if (op === 'PARAGRAPH_MOVED') {
                JMQ.publish('moveParagraph', data.id, data.index);
            } else if (op === 'NOTE_UPDATED') {
                JMQ.publish('updateNote', data.name, data.config, data.info);
            } else if (op === 'SET_NOTE_REVISION') {
                JMQ.publish('setNoteRevisionResult', data);
            } else if (op === 'PARAS_INFO') {
                JMQ.publish('updateParaInfos', data);
            } else {
                //console.error(`unknown websocket op: ${op}`);
            }
        });

        websocketCalls.ws.on("error",function (event) {
            console.error('引擎异常: ', event);
            JMQ.publish('setConnectedStatus', false);
            //如果引擎从来没有连接成功，则会一直报告此错误。如果需要只上报一次，则取消下行注释
            //if(_connected || _connected==null) {
            JMQ.publish('connectChanged', false, new Date());
            //}
            _connected=false;
        });

        websocketCalls.ws.on("close",function (event) {
            console.info('关闭引擎连接: ', event);
            if (pingIntervalId !== undefined) {
                clearInterval(pingIntervalId);
                pingIntervalId = undefined;
            }
            _connected=false;
            JMQ.publish('connectChanged', false,new Date());
        });
    });


    websocketCalls.sendNewEvent = function (data) {
        if (ticket !== undefined) {
            data.principal = ticket.principal;
            data.ticket = ticket.ticket;
            data.roles = ticket.roles;
        } else {
            data.principal = '';
            data.ticket = '';
            data.roles = '';
        }
        if (websocketCalls.isConnected()) {
            if (data.op !== "PING") {
                // 不显示大量的PING消息
                console.log('引擎 >> %o, %o, %o, %o, %o', data.op, data.principal, data.ticket, data.roles, data);
            }
            if (!_connected) {
                JMQ.publish(ConfigConst.MessageQueue.Scheduling_ConnectChanged, true, new Date());
            }
        } else {
            console.error('引擎断开 >> %o, %o, %o, %o, %o', data.op, data.principal, data.ticket, data.roles, data);
            if (_connected) {
                _connected = false;
                JMQ.publish(ConfigConst.MessageQueue.Scheduling_ConnectChanged, false, new Date());
            }
        }
        websocketCalls.ws.send(JSON.stringify(data));
        if(websocketCalls.isConnected()&&data.op!=="PING"){
            setWatchDog();
        }
    };

    websocketCalls.isConnected = function () {
        return (websocketCalls.ws.readyState === 1);
    };

    return websocketCalls;
}
module.exports =init();
