const $q = require('../common/$q');
const Utility = require('../common/Utility');
const ConfigConst =require('../common/ConfigConst');
const RestApi =require('../common/RestApi');
const JMQ =require('../common/JMQ');
const Format =require('../common/Format');
const WsMessenger =require('./WsMessenger');
const Interpreter =require('./Interpreter');
const loginService =require('../login/login.service');
const fs = require("fs");
const path = require("path");

//变量定义
var _self = this;
var _initiated = false;
var _flowList={length:0};
var _compiledScope=null;
var _currentFlowId=null;
var _lastFlowId=null;
var _defaultConfig=null;
var _baseScript="";
var _angularObjectRegistry={};
var _interpreterTag={
    "scala":"",
    "python":".pyspark",
    "r":".r"
};

//全局函数定义
function init() {
    //注册引擎消息处理
    JMQ.subscribe(ConfigConst.MessageQueue.Scheduling_ConnectChanged,onConnectChanged);
    JMQ.subscribe(ConfigConst.MessageQueue.Scheduling_Note,onFlowUpdated);
    JMQ.subscribe(ConfigConst.MessageQueue.Scheduling_Paragraph,onParagraphUpdated);
    JMQ.subscribe(ConfigConst.MessageQueue.Scheduling_AngularUpdate,onAngularObjectUpdated);
    JMQ.subscribe(ConfigConst.MessageQueue.Scheduling_AngularRemove,onAngularObjectRemoved);
    JMQ.subscribe(ConfigConst.MessageQueue.Scheduling_Timeout,onEngineTimeout);
    _defaultConfig=createDefaultConfig();
    /////////////////////////
    // 加载后端基类代码，后端调试完成后，可移植到后端
    fs.readFile(path.join(__dirname, './scala.txt'), 'utf8', function(err, scala){
        if (err) {
            console.log(err);
            console.log("scala.txt文件读入出错");
        }
        _baseScript=scala;
    });
    /////////////////////////
    _initiated = true;
}

/**
 * 创建包含不同类型的paragraph的默认执行配置，便于重用
 * @param type paragraph的EditorMode类型
 * @returns {Object} 默认配置
 */
function createDefaultConfig (type) {
    var config = {};
    if (!config.colWidth) {
        config.colWidth = 12;
    }
    if (config.editorHide===undefined) {
        config.editorHide = true;
    }
    if (config.tableHide===undefined) {
        config.tableHide = true;
    }
    config.title=true;

    if (!config.graph) {
        config.graph = {};
    }

    if (!config.graph.mode) {
        config.graph.mode = 'table';
    }

    if (!config.graph.height) {
        config.graph.height = 300;
    }

    if (!config.graph.optionOpen) {
        config.graph.optionOpen = false;
    }

    if (!config.graph.keys) {
        config.graph.keys = [];
    }

    if (!config.graph.values) {
        config.graph.values = [];
    }

    if (!config.graph.groups) {
        config.graph.groups = [];
    }

    if (!config.graph.scatter) {
        config.graph.scatter = {};
    }
    if(type) {
        config.editorMode = type;
    }else {
        config.editorMode = 'ace/mode/scala';
    }
    return config;
}

/**
 * 后端引擎的NOTE事件处理函数
 * @param note 单个NOTE的JSON对象
 */
function onFlowUpdated(note){
    console.timeEnd("GET_NOTE");
    if (!note || !note.id) {
        return;
    }
    _currentFlowId=note.id;
    _lastFlowId=_currentFlowId;
    var flow = _flowList[note.id];
    if (!flow){
        flow = new Flow(note);
        if(flow.flow&&flow.flow.id) {
            _flowList[flow.flow.id] = flow;
        }
    }else{
        flow.load(flow,note);
    }
}
function onAngularObjectUpdated(data){
    if(!data){
        return;
    }
    var engine = _flowList[data.noteId];
    if (engine) {
        console.timeEnd("ANGULAR_BIND");
        //var scope = getCompiledScope();
        var varName = data.angularObject.name;

        if (!_angularObjectRegistry[varName]) {
            _angularObjectRegistry[varName] = {
                interpreterGroupId: data.interpreterGroupId,
                noteId: data.noteId,
                paragraphId: data.paragraphId
            };
        } else {
            _angularObjectRegistry[varName].noteId = _angularObjectRegistry[varName].noteId || data.noteId;
            _angularObjectRegistry[varName].paragraphId = _angularObjectRegistry[varName].paragraphId || data.paragraphId;
        }

        //如果angularObject包含RDD数据，则解析之
        if (data.angularObject && data.angularObject.object) {
            //记录linkageWatchList，并比较是否更改
            if (engine.linkageWatchList[varName]) {
                //比较是否一致，如果一致，则不再处理
                if (angular.equals(engine.linkageWatchList[varName].value, data.angularObject.object)) {
                    console.debug("滤除重复联动消息%s", varName);
                    // return;
                } else {
                    //console.debug("联动消息%s不重复，原：%s，新：%s", varName, engine.linkageWatchList[varName].value, data.angularObject.object);
                    console.debug("联动消息%s不重复", varName);
                    engine.linkageWatchList[varName].value = data.angularObject.object;
                }
            } else {
                engine.linkageWatchList[varName] = {
                    value: data.angularObject.object
                };
            }
            var str = data.angularObject.object.toString();
            var angObj={};
            try{
                angObj=JSON.parse(str);
            }catch(e){}
            //提取paragraphId
            var nodeid=angObj["__PID__"];
            var node=engine.nodeList[nodeid];
            var rddstr = angObj["__RDD__"];
            // if (angular.isString(rddstr)) {
            if(rddstr&&rddstr.length > 0) {
                //提取数据表
                var newtable = new Format.DataSetMap(rddstr);
                // console.debug("提取DataSetMap %o",newtable);
                JMQ.publish(ConfigConst.MessageQueue.DataSetReceived,{
                    flowId:data.noteId,
                    dataSetMap:newtable
                });
            }
            if(node) {
                node.dateFinished = new Date();
                node.dateUpdated = new Date();
                node.setState(node, ConfigConst.Flow.NodeState_Finished, newtable);
            }
            // }
            var errstr=angObj["__ERR__"];
            if(node && errstr && errstr.length>0){
                node.dateFinished = new Date();
                node.dateUpdated = new Date();
                node.errorMessage=errstr;
                node.setState(node,ConfigConst.Flow.NodeState_Error, errstr);
            }
        }
    }
}
function onAngularObjectRemoved(data){
    var engine = _flowList[data.noteId];
    if (!data.noteId || engine) {
        // var scope = getCompiledScope();
        var varName = data.name;

        // clear watcher
        if (angularObjectRegistry[varName]) {
            angularObjectRegistry[varName].clearWatcher();
            angularObjectRegistry[varName] = undefined;
            delete angularObjectRegistry[varName];
        }

        // remove scope variable
        // scope[varName] = undefined;
        // delete scope[varName];
        // if (scope.original) {
        //     scope.original[varName] = undefined;
        //     delete scope.original[varName];
        // }
    }
}
function onParagraphUpdated(paragraph){
    if(!paragraph || !_currentFlowId){
        return;
    }
    var engine = _flowList[_currentFlowId];
    if(engine){
        //查找节点
        var node=engine.nodeList[paragraph.id];
        if(node){
            node.refresh(node,paragraph);
        }else{
            //添加新的node
            // engine.nodeList[paragraph.id]=new Node(paragraph);
        }
    }
}
function onConnectChanged(connected, time){
    if(connected){
        if(_lastFlowId) {
            //重新获取NOTE
            WsMessenger.getNotebook(_lastFlowId);
            //清除上次NOTE标记
            _lastFlowId = null;
        }
    }else{
        _lastFlowId=_currentFlowId;
        _currentFlowId=null;
    }
    JMQ.publish(ConfigConst.MessageQueue.Notification,{
        type:connected?"info":"error",
        msg:connected?"引擎服务已连接":"引擎服务断开连接"
    });
    console.debug(connected?"引擎服务已连接":"引擎服务断开连接");
}
function onEngineTimeout(){
    _lastFlowId=_currentFlowId;
    _currentFlowId=null;
    JMQ.publish(ConfigConst.MessageQueue.Notification,{
        type:"error",
        msg:"引擎服务未及时响应，稍后重新连接"
    });
    console.debug("引擎服务未及时响应，稍后重新连接");
}

/**
 * 触发联动事件，向引擎发送联动事件消息
 * @param linkage 联动事件名
 * @param param 联动事件值
 */
function sendLinkage(linkage, param){
    //param结构：
    //{tables:[
    //    {
    //       inputTableName:"aaaaa",
    //       rows:["1","2","3"],
    //       cols:["字段A","字段B","字段C","字段D"]
    //    },
    //    {
    //       inputTableName:"bbbbb",
    //       rows:["1","2","3"],
    //       cols:["字段A","字段B","字段C","字段D"]
    //    }
    // ]}

    //console.debug("调用联动事件：linkage=%s, param=%o",linkage,param);
    if(_angularObjectRegistry[linkage]){
        console.time("ANGULAR_BIND");
        WsMessenger.updateAngularObject(_angularObjectRegistry[linkage].noteId,
            _angularObjectRegistry[linkage].paragraphId,linkage,JSON.stringify(param),
            _angularObjectRegistry[linkage].interpreterGroupId);
    }
}

/**
 * 创建AngularObject的scope
 * @returns 包含所有AngularObject对象的scope
 */
function getCompiledScope () {
    if (!_compiledScope) {
        _compiledScope = {};
    }
    return _compiledScope;
}

/**
 * 异步方式向后端引擎提交执行参数。如果服务没有获取相应的engine引擎，会自动预取
 * @param flowId 流程ID，即noteId
 * @param flowName 流程名称
 * @param nodeId 节点ID，即paragraphId
 * @param runParam 执行参数
 * @param clearJMQ 需要去除的回调对象
 */
function run (flowId, flowName, nodeId, runParam, clearJMQ, retry,defer) {
    if(!defer){
        defer=$q.defer();
    }
    if(!flowId || !nodeId || !runParam || !runParam.script){
        setTimeout(function(){defer.reject("分析流无效");},10);
        return defer.promise;
    }
    if(clearJMQ){
        JMQ.unsubscribe(clearJMQ);
    }
    //检查是否已打开当前Flow
    if(_currentFlowId!==flowId){
        if(retry>3){
            //未能获取NOTE
            JMQ.publish(ConfigConst.MessageQueue.Notification,{
                type:"error",
                msg:"引擎响应异常，未能获取或创建分析流"
            });
            setTimeout(function(){defer.reject("引擎响应异常，未能获取或创建分析流");},10);
            return defer.promise;
        }
        //切换Flow后处理
        clearJMQ=JMQ.subscribe(ConfigConst.MessageQueue.Scheduling_Note,function (note) {
            if(note.id==flowId) {
                //此处已打开当前Flow
                if (flowName&&note.name != flowName) {
                    WsMessenger.renameNote(flowId, flowName);
                } else {
                    run(flowId, flowName, nodeId, runParam, clearJMQ, retry ? retry + 1 : 1, defer);
                }
            }
        });
        //切换Flow
        console.time("GET_NOTE");
        WsMessenger.getNotebook(flowId);
    }else {
        //在脚本前加上interpreter标记
        var script=(runParam.language=="scala"?_baseScript:"")+"\n"+runParam.script+"\n"+runParam.callScript;
        if(!Utility.stringStartWith(runParam.script,"%")){
            //通过Interpreter服务获取当前用户的绑定资源
            var interpreter=findRunningInterpreter(runParam);
            if(interpreter){
                script=interpreter+script;
            }else{
                setTimeout(function(){defer.reject("未找到当前用户授权的"+runParam.interpreterGroup+"资源");},10);
                return defer.promise;
            }
        }
        console.time("RUN_PARAGRAPH");
        WsMessenger.runParagraph(nodeId, runParam.title, script, _defaultConfig, {});
        console.debug(script);
        setTimeout(function(){defer.resolve(true);},10);
    }
    return defer.promise;
}

/**
 * 根据待执行的CompileContext对象和当前用户信息，判断执行资源
 * @param runParam 待执行CompileContext对象
 * @return {*} 返回执行资源前缀，以%开头、回车符结尾。如果未找到有效资源，则为空。
 */
function findRunningInterpreter(runParam){
    var usrMsg=loginService.getCookies();
    if(usrMsg&&usrMsg.userName) {
        //add tanglvshuang 2018.1.25 获取选择的资源
        var inters= Interpreter.getSelectSource();
        if(inters) {
            var defaultInter = inters.name;
            if (!defaultInter && inters.length > 0&&inters[0]) {
                defaultInter=inters[0].name;
            }else{
                if(inters.group!=runParam.interpreterGroup &&
                    !(inters.group.length==0&&runParam.interpreterGroup=="spark")){
                    //获取用户默认的同类型解释器
                    var allInters=Interpreter.getCurrentInterpretersCache()
                        .filter(function(int){return int.group==runParam.interpreterGroup;});
                    if(allInters.length>0){
                        //查找默认资源
                        var defaultInterList=allInters.filter(function(int){return int._default=="1";});
                        if(defaultInterList.length>0){
                            defaultInter=defaultInterList[0].name;
                        }else{
                            defaultInter=allInters[0].name;
                        }
                    }else{
                        console.log("未找到当前用户授权的%s资源",runParam.interpreterGroup);
                        return "";
                    }
                }
            }
            if(defaultInter){
                // added by qiyongjie 2018.01.29 根据脚本的语言类型更改解释器标识
                //script="%"+defaultInter+"\n"+script;
                var interpreterTag=_interpreterTag[runParam.language];
                if(interpreterTag) {
                    return "%" + defaultInter + interpreterTag + "\n";
                }else{
                    return "%"+defaultInter+"\n";
                }
            }else{
                console.log("未找到当前用户授权的资源");
                return "";
            }
        }else{
            console.log("未找到当前用户授权的资源");
            return "";
        }
    }
}

function stop(flowId,nodeId,clearJMQ){
    if(!flowId || !nodeId){
        return false;
    }
    if(clearJMQ){
        JMQ.unsubscribe(clearJMQ);
    }
    //检查是否已打开当前Flow
    if(_currentFlowId !== flowId){
        //切换Flow后处理
        clearJMQ=JMQ.subscribe(ConfigConst.MessageQueue.Scheduling_Note,function (note) {
            stop(flowId,nodeId,clearJMQ);
        });
        //切换Flow
        WsMessenger.getNotebook(flowId);
    }else {
        //此处已打开当前Flow
        WsMessenger.cancelParagraphRun(nodeId);
    }
    return true;
}
function registerCallback(flowId,nodeId,callbackState,callbackFinish,callbackError){
    //注册回调函数，类似于创建promise对象
    var engineNode = openNodeGhost(flowId, nodeId);
    if (engineNode) {
        engineNode.registerCallback(engineNode,callbackState,callbackFinish,callbackError);
    }
}
function getRunScript(flowId, nodeId, runParam) {
    if(!flowId || !nodeId || !runParam || !runParam.script){
        return "";
    }

    //在脚本前加上interpreter标记
    var script=(runParam.language=="scala"?_baseScript:"")+"\n"+runParam.script+"\n"+runParam.callScript;
    if(!Utility.stringStartWith(runParam.script,"%")){
        //通过Interpreter服务获取当前用户的绑定资源
        var usrMsg=loginService.getCookies();
        if(usrMsg&&usrMsg.userName) {
            //add tanglvshuang 2018.1.25 获取选择的资源
            var inters= Interpreter.getSelectSource();
            if(inters) {
                var defaultInter = inters.name;
                if (!defaultInter && inters.length > 0&&inters[0]) {
                    defaultInter=inters[0].name;
                }
                if(defaultInter){
                    // added by qiyongjie 2018.01.29 根据脚本的语言类型更改解释器标识
                    //script="%"+defaultInter+"\n"+script;
                    var interpreterTag=_interpreterTag[runParam.language];
                    if(interpreterTag) {
                        script = "%" + defaultInter + interpreterTag + "\n" + script;
                    }else{
                        script="%"+defaultInter+"\n"+script;
                    }
                    // end of codes added by qiyongjie 2018.01.29 根据脚本的语言类型更改解释器标识
                    return script;
                }else{
                    console.log("未找到当前用户授权的资源");
                    return "";
                }
            }else{
                console.log("未找到当前用户授权的资源");
                return "";
            }

        }else{
            console.log("当前用户未登录");
            return "";
        }
    }
    return runParam.script;
}

/**
 * 查找指定的分析流节点引擎，如果该节点不存在，则创建之。
 * @param flowId 分析流ID
 * @param nodeId 节点ID
 * @returns {*}
 */
function openNodeGhost (flowId, nodeId) {
    if (!flowId || !nodeId || flowId.length === 0 || nodeId.length === 0)
        return null;
    var engine = _flowList[flowId];
    var engineNode = null;
    if (!engine) {
        engine=new Flow();
        engine.flow.id=flowId;
        _flowList[flowId]=engine;
    }
    if (!engine.nodeList) {
        engine.nodeList = {};
    }
    engineNode = engine.nodeList[nodeId];
    if (!engineNode) {
        engineNode = new Node({id: nodeId});
        engine.nodeList[nodeId]=engineNode;
    }
    return engineNode;
}

/**
 * 获取指定分析流的指定节点的输出RDD结构，异步调用
 * @param flowId 分析流ID
 * @param nodeIdList 节点ID列表（数组或逗号分隔的字符串），支持多个节点同时查询
 * @param interpreterName 查询资源名称
 * @returns {*} promise对象，获取节点的输出RDD结构：{{节点ID:Format.DataSet对象}}
 */
function getRddSchemas(flowId, nodeIdList,interpreterName,defer){
    //参数检查
    var nidStr;
    if(!defer) defer=$q.defer();

    if(!flowId || flowId.length===0 || !nodeIdList || nodeIdList.length===0){
        setTimeout(function(){defer.reject();},0);
        return defer.promise;
    }

    if(typeof nodeIdList==="string"){
        nidStr = nodeIdList;
    }else if(Array.isArray(nodeIdList)){
        nidStr = nodeIdList.join(',');
    }else{
        setTimeout(function(){defer.reject();},0);
        return defer.promise;
    }
    //构造传入参数
    var pp = null;
    if (interpreterName) {
        pp = {
            noteId: flowId,
            paragraphIds: nidStr
            //interpreterName: interpreterName
        };
    } else {
        pp = {noteId: flowId, paragraphIds: nidStr};
    }

    WsMessenger.rest(ConfigConst.Scheduling.RestAction.GetRddSchemas,
        pp,true).then(function (result) {
        var tcount=0,schema;
        if(result.body) {
            //检查返回的数据表数量，如果为0则使用noteId再次获取RDD
            for (var p in result.body) {
                if (typeof (result.body[p]) !== "function") {
                    tcount++;
                }
            }
        }
        if(tcount>0){
            schema= transSchemas(result.body);
        }else{
            //此处再用分析流的NoteId和paragraphId尝试获取RDD
            RestApi.do(ConfigConst.Framework.RestAction.GetFlowById,{id:flowId}).then(function(restResult){
                if(restResult && restResult.data && restResult.data.workflow){
                    var noteId=restResult.data.workflow.noteId;
                    var dag=null,pids=null;

                    try{
                        dag=JSON.parse(restResult.data.workflow.diagramJSONString);
                        pids=nodeIdList.map(function(x){
                            for(var i=0;i<dag.nodes.length;i++){
                                if(dag.nodes[i].id === x){
                                    return dag.nodes[i].paragraphId;
                                }
                            }
                        });
                    }catch(ex) {}

                    if(noteId && pids && pids.length>0){
                        return WsMessenger.rest(ConfigConst.Scheduling.RestAction.GetRddSchemas,{noteId:noteId,paragraphIds:pids.join(",")},true).then(function (rddResult) {
                            if(rddResult.body) {
                                schema= transSchemas(rddResult.body);
                            }else{
                                schema= null;
                            }
                        });
                    }else{
                        schema= null;
                    }
                }else{
                    schema= null;
                }
                setTimeout(function(){defer.resolve(schema)},10);
            });
            return;
        }
        setTimeout(function(){defer.resolve(schema)},10);
    },function(error){
        console.error("获取RDD Schema通信异常，%s",JSON.stringify(error));
        //关闭与引擎的连接，重新登录，再次获取Schema
        onConnectChanged(false);
        WsEvents.init();
        var handler=JMQ.subscribe(ConfigConst.MessageQueue.Scheduling_ConnectChanged,function(connected){
            if(connected){
                JMQ.unsubscribe(handler);
                getRddSchemas(flowId, nodeIdList,interpreterName,defer);
            }
        });
    });
    return defer.promise;
}

/**
 * 判断分析流的指定节点是否执行成功，异步调用。该调用比getRddSchemas更轻量，返回更快。
 * @param flowId 分析流ID
 * @param nodeIdList 节点ID列表（数组或逗号分隔的字符串），支持多个节点同时查询
 * @param interpreterName 查询资源名称
 * @returns {*} promise对象，获取节点的执行状态：true / false
 */
function isNodeRunned(flowId, nodeIdList,interpreterName){
    //参数检查
    var defer=$q.defer(), nidStr;

    if(!flowId || flowId.length===0 || !nodeIdList || nodeIdList.length===0){
        setTimeout(function(){defer.reject();},0);
        return defer.promise;
    }

    if(typeof nodeIdList==="string"){
        nidStr = nodeIdList;
    }else if(Array.isArray(nodeIdList)){
        nidStr = nodeIdList.join(',');
    }else{
        setTimeout(function(){defer.reject();},0);
        return defer.promise;
    }
    //构造传入参数
    var pp = null;
    if (interpreterName) {
        pp = {
            noteId: flowId,
            paragraphIds: nidStr
            //interpreterName: interpreterName
        };
    } else {
        pp = {noteId: flowId, paragraphIds: nidStr};
    }

    return WsMessenger.rest(ConfigConst.Scheduling.RestAction.IsNodeRunned,
        pp,true).then(function (result) {
        var tcount=0;
        if(result.body) {
            //检查返回的数据表数量，如果为0则使用noteId再次获取RDD
            for (var p in result.body) {
                if (typeof (result.body[p]) !== "function") {
                    tcount++;
                }
            }
        }
        return result.body;
    });
}

/**
 * 将REST获得的数据转化成RDD Schema对象的内部函数
 * @param restData REST接口返回的body数据
 * @returns {{}}包含schema的对象，属性名是节点id，值是DataSet对象
 * Modified by songgaoke on 2018/4/8.
 */
function transSchemas(restData){
    var rdds={};
    for (var ndid in restData) {
        if (typeof(restData[ndid]) !== "function") {
            var ds = new Format.DataSet();
            rdds[ndid] = ds;
            var tmpArray = restData[ndid];
            for (var i = 0; i < tmpArray.length; i++) {
                var rddschema = tmpArray[i];
                var dt = new Format.DataTable();
                //按顺序，第一项一定为rddName，第二项一定为RDD的类型，第三项开始为按顺序的字段。
                //但也有例外，如果有某个字段名是纯数字，则有可能出现在rddName之前。
                var rddname=null,rddtype=null;
                var index=0,namefinding=false;
                for(var rddcol in rddschema){
                    if(typeof(rddcol) !== "function"){
                        if(rddcol=="rddName"){
                            if(Utility.stringEndWith(rddschema[rddcol],"_zzjz$reRun")||
                                Utility.stringEndWith(rddschema[rddcol],"_zzjz$paramSetting")){
                                break;
                            }
                            rddname=rddschema[rddcol];
                            namefinding=true;
                            continue;
                        }else if(namefinding){
                            //默认rddName的下一个就是RDD类型，不确定是否有例外情况
                            var sch = new Format.FieldSchema();
                            sch.name = rddcol;
                            sch.datatype = rddschema[rddcol];
                            sch.index=-1;
                            dt.schema.splice(0,0,sch);
                            namefinding=false;
                            continue;
                        }
                        var sch = new Format.FieldSchema();
                        sch.name = rddcol;
                        sch.datatype = rddschema[rddcol];
                        sch.index=index++;
                        dt.schema.push(sch);
                    }
                }
                if(rddname){
                    dt.name=rddname;
                    ds[dt.name] = dt;
                    ds.length++;
                }
            }
        }
    }
    return rdds;
}

/**
 * 获取当前用户的解释器
 * @returns {*}
 */
function getInterpreter(){
    var usrMsg=loginService.getCookies();
    if(usrMsg&&usrMsg.interpreters&&usrMsg.interpreters.length>0){
        for(var i=0;i<usrMsg.interpreters.length;i++){
            var inter=usrMsg.interpreters[i];
            if(inter.resourceName){
                inter=inter.resourceName.split(" ");
                if(inter.length>1){
                    var inters=inter[1].split(",");
                    if(inters.length>0){
                        if(Utility.some(inters,function(x){return x.indexOf("spark")>=0;})){
                            return inter[0]+".spark";
                        }
                    }
                }
            }
        }
    }
    return null;
}

function clear(){
    _currentFlowId=null;
}
JMQ.subscribe("clearSpace",function () {
    clear();
});
//类
/**
 * 节点类。采用new方法创建实例
 * @param paragraph 从后台获取的paragraph对象
 * @constructor
 */
function Node(paragraph) {
    //成员定义
    this.id=undefined;
    this.config=undefined;
    this.dateCreated=undefined;
    this.dateFinished=undefined;
    this.dateStarted=undefined;
    this.dateUpdated=undefined;
    this.jobName=undefined;
    this.progressUpdateIntervalMs=undefined;
    this.nodeParam = undefined;
    this.settings = undefined;
    this.state = undefined;
    this.progress = undefined;
    this.runningWatchKey = undefined;
    this.resultList =undefined;
    this.errorMessage=undefined;
    this.changed=undefined;
    this.apps=undefined;
    this.text=undefined;
    this.user=undefined;
    var nodeSelf=this;

    /**
     * 类函数
     */
    function newNode (p) {
        nodeSelf.id = p.id;
        if (p.config) {
            nodeSelf.config = {
                editorMode: p.config.editorMode
            };
        }
        var vd = Date.parse(p.dateCreated);
        if (!isNaN(vd))
            nodeSelf.dateCreated = new Date(vd);
        vd = Date.parse(p.dateFinished);
        if (!isNaN(vd))
            nodeSelf.dateFinished = new Date(vd);
        vd = Date.parse(p.dateStarted);
        if (!isNaN(vd))
            nodeSelf.dateStarted = new Date(vd);
        vd = Date.parse(p.dateUpdated);
        if (!isNaN(vd))
            nodeSelf.dateUpdated = new Date(vd);
        nodeSelf.jobName = p.jobName;
        nodeSelf.progressUpdateIntervalMs = p.progressUpdateIntervalMs;
        nodeSelf.nodeParam = {
            script: p.text,
            type: p.config ? p.config.editorMode : undefined,
            tableNameList: [],
            inParamList: [],
            outParamList: []
        };
        nodeSelf.settings = p.settings;
        nodeSelf.state = getNodeStatus(p.status);
        nodeSelf.progress = 100;
        nodeSelf.runningWatchKey = "";
        if (nodeSelf.state === ConfigConst.Flow.NodeState_Finished) {
            nodeSelf.resultList=undefined;
            delete nodeSelf.resultList;
            nodeSelf.resultList = buildResultList(p.results);
        } else {
            nodeSelf.resultList = {};
            if(nodeSelf.state === ConfigConst.Flow.NodeState_Error && p.results){
                if(p.results.msg){
                    nodeSelf.errorMessage="";
                    angular.forEach(p.results.msg,function(x){
                        nodeSelf.errorMessage=x.data+"\n";
                    });
                }else{
                    nodeSelf.errorMessage=p.errorMessage;
                }
            }else{
                nodeSelf.errorMessage="";
            }
        }
        nodeSelf.apps=p.apps;
        nodeSelf.text=p.text;
        nodeSelf.user=p.user;
        nodeSelf.changed = true;

    }

    function refresh (instance, p) {
        //首先比较paragraph的4个时间，如果有变化则继续比较其他属性，否则视该paragraph没有变化
        instance.changed = false;
        var vd = Date.parse(p.dateCreated);
        if (!isNaN(vd)) {
            if (!instance.dateCreated || instance.dateCreated.getTime() !== vd) {
                vd = new Date(vd);
                instance.dateCreated = vd;
                instance.changed = true;
            }
        }
        vd = Date.parse(p.dateFinished);
        if (!isNaN(vd)) {
            if (!instance.dateFinished || instance.dateFinished.getTime() !== vd) {
                vd = new Date(vd);
                instance.dateFinished = vd;
                instance.changed = true;
            }
        }
        vd = Date.parse(p.dateStarted);
        if (!isNaN(vd)) {
            if (!instance.dateStarted || instance.dateStarted.getTime() !== vd) {
                vd = new Date(vd);
                instance.dateStarted = vd;
                instance.changed = true;
            }
        }
        vd = Date.parse(p.dateUpdated);
        if (!isNaN(vd)) {
            if (!instance.dateUpdated || instance.dateUpdated.getTime() !== vd) {
                vd = new Date(vd);
                instance.dateUpdated = vd;
                instance.changed = true;
            }
        }
        var newState = getNodeStatus(p.status);
        if (newState !== instance.state){
            instance.changed=true;
        }
        if (!instance.changed) {
            return;
        }
        if (!instance.config) {
            instance.config = p.config;
            instance.changed = true;
        } else {
            if (!angular.equals(instance.config, p.config)) {
                angular.extend(instance.config, p.config);
                instance.changed = true;
            }
        }
        if (instance.jobName !== p.jobName) {
            instance.jobName = p.jobName;
            instance.changed = true;
        }
        if (instance.progressUpdateIntervalMs !== p.progressUpdateIntervalMs) {
            instance.progressUpdateIntervalMs = p.progressUpdateIntervalMs;
            instance.changed = true;
        }
        if (instance.progress !== p.progress) {
            instance.progress = p.progress;
        }
        if (newState !== instance.state) {
            if (newState === ConfigConst.Flow.NodeState_Finished) {
                console.timeEnd("RUN_PARAGRAPH");
                instance.resultList=undefined;
                delete instance.resultList;
                instance.resultList = buildResultList(p.results);
            } else {
                instance.resultList = {};
                if(newState === ConfigConst.Flow.NodeState_Error && p.results){
                    console.timeEnd("RUN_PARAGRAPH");
                    if(p.results.msg){
                        instance.errorMessage="";
                        angular.forEach(p.results.msg,function(x){
                            instance.errorMessage=x.data+"\n";
                        });
                    }else{
                        instance.errorMessage=p.errorMessage;
                    }
                }else{
                    instance.errorMessage="";
                }
            }
        }
        instance.apps=p.apps;
        if(instance.text!== p.text){
            instance.text=p.text;
        }
        if(instance.user!== p.user){
            instance.user=p.user;
        }
        setState(instance, newState);
        return instance;
    }

    function getNodeStatus (p) {
        if (!p) return undefined;
        else if (p === "READY") return ConfigConst.Flow.NodeState_Waiting;
        else if (p === "PENDING") return ConfigConst.Flow.NodeState_Pending;
        else if (p === "RUNNING") return ConfigConst.Flow.NodeState_Running;
        else if (p === "FINISHED") return ConfigConst.Flow.NodeState_Finished;
        else if (p === "ABORT") return ConfigConst.Flow.NodeState_Waiting;
        else return ConfigConst.Flow.NodeState_Error;
    }

    /**
     * 解析paragraph返回的结果信息，如果是数据表，则返回DataSet对象，否则返回结果文本的普通对象。要求结果信息必须包含表名才能正确解析。
     * @param presult 结果信息
     * @returns {*} DataSet对象或普通对象
     */
    function buildResultList (presult) {
        if(!presult){
            return new Format.DataSetMap();
        }else{
            return new Format.DataSetMap(presult.msg);
        }
    }

    function setState (instance, state, forcePush) {
        var oldstate = instance.state;
        if (oldstate !== state) {
            instance.state = state;
            instance.changed = true;
        }
        if (forcePush || oldstate !== state) {
            //状态更改消息推送
            if (instance.defer) {
                try {
                    instance.defer.notify(instance.state);
                } catch (exp) {
                    console.error("%o", exp);
                }
            } else if (instance.callback && instance.callback.state) {
                try {
                    instance.callback.state(instance.state);
                } catch (exp) {
                    console.error("%o", exp);
                }
            }
            //完成或错误消息推送
            if (oldstate !== undefined && state === ConfigConst.Flow.NodeState_Finished) {
                if (instance.defer) {
                    try {
                        instance.defer.resolve(instance.resultList);
                    } catch (exp) {
                        console.error("%o", exp);
                    }
                } else if (instance.callback && instance.callback.finish) {
                    try {
                        if (forcePush) {
                            //检查是否是数据表列表
                            /*
                            var tcount = 0,
                                tfound = true;
                            for (var t in forcePush) {
                                if (typeof(forcePush[t]) != 'function') {
                                    var tb = forcePush[t];
                                    if (!tb) {
                                        tfound = false;
                                        break;
                                    }
                                    if (tb.tableName && tb.schema && tb.table) {
                                        tcount++;
                                    }
                                }
                            }
                            if (tcount > 0 && tfound) {
                             instance.callback.finish(forcePush);
                            } else {
                                console.warn("强制推送模式下，推送对象非数据表 %o", forcePush);
                            }*/
                            instance.resultList=forcePush;
                            instance.callback.finish(forcePush);
                        } else {
                            instance.callback.finish(instance.resultList);
                        }
                        //仅推送一次
                        //instance.callback.finish=undefined;
                    } catch (exp) {
                        console.error("%o", exp);
                    }
                    //通过JMQ发送DataSetReceived消息
                    // if(instance.resultList instanceof Format.DataSetMap) {
                    //     var tfound=false;
                    //     for(var ds in instance.resultList){
                    //         if(ds && instance.resultList[ds] && instance.resultList[ds] instanceof Format.DataSet){
                    //             tfound=true;
                    //             break;
                    //         }
                    //     }
                    //     if(tfound) {
                    //         JMQ.publish(ConfigConst.MessageQueue.DataSetReceived, {
                    //             flowId: _currentFlowId,
                    //             dataSetMap: instance.resultList
                    //         });
                    //     }
                    // }
                }
            } else if (oldstate != undefined &&state == ConfigConst.Flow.NodeState_Error) {
                if (instance.defer) {
                    try {
                        instance.defer.reject(instance.errorMessage);
                    } catch (exp) {
                        console.error("%o", exp);
                    }
                } else if (instance.callback && instance.callback.error) {
                    try {
                        instance.callback.error(instance.errorMessage);
                    } catch (exp) {
                        console.error("%o", exp);
                    }
                    //仅推送一次
                    //instance.callback.error=undefined;
                }
            }
        }
    }

    function registerCallback(instance, callbackState,callbackFinish,callbackError){
        //注册回调函数，类似于创建promise对象
        if (!instance.callback) {
            instance.callback = {};
        }
        if (!callbackState || typeof(callbackState)=="function") {
            instance.callback.state = callbackState;
        }
        if (!callbackFinish || typeof(callbackFinish)=="function") {
            instance.callback.finish = callbackFinish;
        }
        if (!callbackError || typeof(callbackError)=="function") {
            instance.callback.error = callbackError;
        }
        if(instance.defer) {
            instance.defer = undefined;
        }
    }

    //原型定义方法
    if(Node.prototype.__initNode__ !== true){
        Node.prototype.refresh=refresh;
        Node.prototype.setState=setState;
        Node.prototype.registerCallback=registerCallback;
        Node.prototype.__initNode__=true;
    }

    /**
     * 类属性定义
     */
    if (paragraph && paragraph.id) {
        newNode(paragraph);
    }else{
        this.id=Utility.newNodeId();
    }

}

/**
 * 分析流类。采用new方法创建实例。
 * @param noteObj 从后端获取的note对象。如果没有note对象，则创建一个空分析流，并预设一个流程ID。
 * @constructor
 */
function Flow(noteObj){
    //成员定义
    this.flow={};
    this.nodeList={};
    this.linkageWatchList={};
    var flowSelf=this;

    //类函数
    /**
     * 通过加载后台返回的note对象，刷新当前分析流对象。实例化调用。
     * @param instance note 从后端获取的note对象
     */
    function load(instance, note){
        if(!instance.flow.id){
            instance.flow.id=note.id;
            instance.flow.changed=true;
        }
        if (instance.flow.name !== note.name) {
            instance.flow.name = note.name;
            instance.flow.changed = true;
        }
        //config和info是否有意义，待分析
        if (!instance.flow.config) {
            instance.flow.config = note.config;
            instance.flow.changed = true;
        } else {
            if (!angular.equals(instance.flow.config, note.config)) {
                instance.flow.config = angular.extend(instance.flow.config, note.config);
                instance.flow.changed = true;
            }
        }
        if (!instance.flow.info) {
            instance.flow.info = note.info;
            instance.flow.changed = true;
        } else {
            if (!angular.equals(instance.flow.info, note.info)) {
                instance.flow.info = angular.extend(instance.flow.info, note.info);
                instance.flow.changed = true;
            }
        }

        //更新nodeList，对顺序没有要求，不减只加，因为openEngineNodeGhost需要
        for(var nid in instance.nodeList){
            var node=instance.nodeList[nid];
            if(node && typeof node !== "function"){
                var newIdx = Utility.indexOf(note.paragraphs, function (x) {
                    return x.id === node.id;
                });
                if (newIdx >= 0) {
                    //比较相应的属性值是否一致
                    node.refresh(node,note.paragraphs[newIdx]);
                    // } else {
                    //     delete instance.nodeList[nid];
                }
            }
        }
        //再加
        note.paragraphs.forEach(function (x) {
            if (!instance.nodeList[x.id]) {
                //添加新的node
                instance.nodeList[x.id]=new Node(x);
            }
        });
        //更新runningNodeId, engineState, changed
        instance.runningNodeId=undefined;
        instance.engineState=ConfigConst.Flow.NodeState_Waiting;
        note.paragraphs.some(function (x) {
            if (x.state === "RUNNING") {
                instance.runningNodeId = x.id;
                instance.engineState=ConfigConst.Flow.NodeState_Running;
                return true;
            } else {
                return false;
            }
        });
        instance.changed=false;
        for(var nid in instance.nodeList){
            var node=instance.nodeList[nid];
            if(node && typeof(node) !== "function"){
                if(node.changed){
                    instance.changed=true;
                    break;
                }
            }
        }
    }

    /**
     * 向当前分析流增加一个节点，并预设节点ID。该方法不会向后端提交新增paragraph请求。实例化调用。
     * @returns {Node} 新增的节点对象
     */
    function addNode(instance){
        var node=new Node();
        instance.nodeList[node.id]=node;
        return node;
    }

    //类原型方法
    if(Flow.prototype.__initFlow__!==true){
        Flow.prototype.load=load;
        Flow.prototype.addNode=addNode;
        Flow.prototype.__initFlow__=true;
    }

    //构造函数逻辑
    if(noteObj){
        load(this, noteObj);
    }else{
        this.flow.id=Utility.newNodeId();
        this.flow.name="unamedFlow_"+Utility.timeUuid();
    }
}

//服务代码
_self.run=run;
_self.stop=stop;
_self.registerCallback=registerCallback;
_self.openNodeGhost=openNodeGhost;
_self.Node=Node;
_self.Flow=Flow;
_self.getRddSchemas=getRddSchemas;
_self.isNodeRunned=isNodeRunned;
_self.sendLinkage=sendLinkage;
_self.getRunScript=getRunScript;
_self.findRunningInterpreter=findRunningInterpreter;
_self.clear=clear;

init();

module.exports = _self;
