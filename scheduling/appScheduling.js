const $q = require('../common/$q');
const Format = require('../common/Format');
const JMQ = require('../common/JMQ');
const ConfigConst = require('../common/ConfigConst');
const Dag = require('../common/Dag');
const ComClass =require('../ComLib/ComClass');
const ComLib =require('../ComLib/ComLib');
const Scheduling =require('./Scheduling');
const loginService =require('../login/login.service');

let CurrentViewData={};
let _previewCache={};

/**
 * 获取数据视图节点的数据集，异步调用。该方法首次获取视图节点的数据集时，耗时较长
 * @param flowId 节点所在分析流ID
 * @param nodeId 节点ID
 * @param schemas 节点的输入数据集schema
 * @param refresh 是否强制刷新数据集，true表示强制从后台引擎中读取数据集，false表示从缓存中获取数据集
 * @returns {jQuery.promise|*|promise|d} 返回异步promise对象
 */
function ApigetDataSet(flowId,nodeId,schemas,refresh){
    let defer=$q.defer();
    if(!flowId || !nodeId || !schemas){
        setTimeout(function(){defer.resolve({});},50);
        return defer.promise;
    }
    //从缓存中查找
    let cache = _previewCache[flowId+"-"+nodeId];
    if(cache && !refresh){
        console.debug("paramSetService从缓存中提取数据集 %o",cache);
        setTimeout(function(){defer.resolve(cache);},50);
        return defer.promise;
    }

    //分析schemas中的数据表名
    let tableNames=[];
    for(let nid in schemas){
        if(nid&&schemas[nid]){
            let ds=schemas[nid];
            for(let tname in ds){
                if(tname!=="length" && tname!=="msg" && ds[tname] && ds[tname] instanceof Format.DataTable){
                    tableNames.push({rdd:tname});
                }
            }
        }
    }
    if(tableNames.length>0){
        //通过数据预览节点获取数据
        /*let previewCom=ComLib.getComponentBySn(ConfigConst.ComLib.SN_DataPreview);*/
        let previewCom = ComLib.getComponentBySn(ConfigConst.ComLib.PresetComSN.SN_DataPreview);
        let cacheDataSet = function(previewCom){
            let previewNode={
                id:nodeId,
                componentId:previewCom.id,
                paramSetting:{rdds:tableNames}
            };
            Scheduling.registerCallback(flowId,nodeId,null,function(result){
                //将DataSetMap转换成DataSet
                let dsfound=false;
                for(let ds in result){
                    if(result[ds]&&result[ds] instanceof Format.DataSet){
                        //缓存
                        _previewCache[flowId+"-"+nodeId]={
                            schemas:schemas,
                            dataSet:result[ds]
                        };
                        dsfound=true;
                        break;
                    }
                }
                if(dsfound) {
                    console.debug("paramSetService从获取数据集 %o",_previewCache[flowId+"-"+nodeId]);
                    defer.resolve(_previewCache[flowId+"-"+nodeId]);
                }
            },function(error){
                defer.resolve({});
            });
            let dag = {edges:[],nodes:[previewNode]};
            let compile = ComClass.compileDag(flowId,dag);
            compile.title=previewCom.name;
            Scheduling.run(flowId,null,nodeId,compile);
        };
        if(previewCom instanceof ComClass.Com){
            cacheDataSet(previewCom);
        }else if(previewCom.then && typeof(previewCom.then)==="function"){
            previewCom.then(function(realCom){
                if(realCom instanceof ComClass.Com) {
                    cacheDataSet(realCom);
                }else{
                    defer.resolve({});
                }
            });
        }
        return defer.promise;
    }else{
        setTimeout(function(){defer.resolve({});},50);
        return defer.promise;
    }
}
let compositionCallback =function(obj,workflow){
    //console.log(obj);
    if(allNodeMap.linkageCallback){
        allNodeMap.linkageCallback(obj);
    }
    let worktableFlowId = workflow.tableWorkflowId;
    if(!workflow){
        workflow = runDagworkflow;
    }
    if(!worktableFlowId) {
        worktableFlowId = loginService.getCookies().userName + "_" + workflow.workflowId;
    }
    if(obj.flowId === worktableFlowId){
        //处理obj.DataSet
        let workflowTableData = workflow;
        let listData = [];
        if(obj.dataSetMap instanceof Format.DataSetMap){
            for(let key in obj.dataSetMap){
                if(obj.dataSetMap[key] instanceof Format.DataSet){
                    let nodePathArr = [];
                    nodePathArr = key.split("/");
                    nodePathArr.shift();
                    console.log("获取Bind数据集，%s=%o",key,obj.dataSetMap[key]);
                    nodeViewMessage(listData,nodePathArr,workflowTableData,obj.dataSetMap[key],key)
                }
            }
        }
        //obj:obj.diagram   obj.template.diaram.
        function nodeViewMessage(listData, pathArr, obj, objDataSet, key,viewResultId) {// modified by qiyongjie, 2018.2.6 增加参数viewResultId
            //分析流
            if (obj.hasOwnProperty("diagram")) {
                let workNodes = obj.diagram.nodes;
                publicHand(listData, pathArr, workNodes, objDataSet, key,viewResultId);// modified by qiyongjie, 2018.2.6 增加参数viewResultId
            } else if (obj.com.hasOwnProperty("template")) {
                //复合组件；
                if(obj.com.type==ConfigConst.ComLib.ComType_Composite) { //modified by qiyongjie, 2018.5.15 如果是复合组件
                    //判断节点参数中是否包含运行时子图
                    if (obj.nodeMassage && obj.nodeMassage.paramSetting && obj.nodeMassage.paramSetting[ConfigConst.ComModel.Key_ParamSetting_Diagram]) {
                        let runningDag = obj.nodeMassage.paramSetting[ConfigConst.ComModel.Key_ParamSetting_Diagram];
                        let workNodes = runningDag.nodes;
                        publicHand(listData, pathArr, workNodes, objDataSet, key, viewResultId);
                    }
                }else if (obj.com.template.hasOwnProperty("diagram")&&obj.com.template.diagram) {
                    let workNodes = obj.com.template.diagram.nodes;
                    publicHand(listData, pathArr, workNodes, objDataSet, key,viewResultId);// modified by qiyongjie, 2018.2.6 增加参数viewResultId
                }
                //如果是视图组件
                else if (obj.com.template.hasOwnProperty("paramList")) {
                    let nodesParamList = obj.com.template.paramList;
                    for (let i = 0; i < nodesParamList.length; i++) {
                        if (nodesParamList[i].type === ConfigConst.ComModel.Type_Dag) {
                            let relativeKeyNodes = obj.nodeMassage.paramSetting[nodesParamList[i].key].nodes;
                            publicHand(listData, pathArr, relativeKeyNodes, objDataSet, key,viewResultId);// modified by qiyongjie, 2018.2.6 增加参数viewResultId
                        }
                    }
                }
            }
        }
        function publicHand(listData, pathArr, workNodes, objDataSet, key, viewResultId){
            // added by qiyongjie, 2018.2.5
            // 判断的情况除了视图节点、复合节点，还有联动。联动的nodePath格式：/节点ID_布局ID/节点ID_布局ID/.../节点ID
            let pathNode=pathArr[0];
            let pathLayout=null;
            let indx=pathNode.indexOf("_");
            if(indx>0&&indx<pathNode.length-1){
                pathLayout=pathNode.substr(indx+1);
                pathNode=pathNode.substr(0,indx);
            }

            for (let i = 0; i < workNodes.length; i++) {
                // added by qiyongjie, 2018.2.5
                if(workNodes[i].id==pathNode){
                    //判断当前节点是否是联动展示窗口节点，如果是则继承原viewResultId，否则使用nodePath作为viewResultId
                    let currentViewId=viewResultId?viewResultId:"";
                    let com=ComLib.getComponent(workNodes[i].componentId);
                    if(com instanceof ComClass.Com){
                        if(com.sn==ConfigConst.ComLib.PresetComSN.SubDagView){
                            //联动展示窗口节点，继承父级的viewResultId
                            currentViewId=viewResultId?viewResultId:pathArr[0];
                        }else{
                            //联动视图节点，应新开窗口
                            currentViewId+="/"+workNodes[i].id;
                        }
                    }
                    if(pathLayout){
                        // 当前节点为联动视图
                        let nodeParam=workNodes[i].paramSetting;
                        if(nodeParam&&nodeParam.chartList){
                            nodeParam.chartList.forEach(function(chart){
                                if(chart && chart.layout==pathLayout && chart.linkage){
                                    let pathNextIdArr = pathArr.slice(1);
                                    let thisNodeObj = {
                                        nodeMassage: workNodes[i],
                                        diagram: chart.linkage
                                    };
                                    nodeViewMessage(listData, pathNextIdArr, thisNodeObj, objDataSet, key,currentViewId);
                                }
                            });

                        }
                    }else if (workNodes[i].id === pathArr[0]) {
                        let pathNextIdArr = pathArr.slice(1);
                        if (pathNextIdArr.length === 0) {
                            let nodeData = {
                                workflowId: worktableFlowId,
                                node: workNodes[i],
                                nodePath: key,
                                // 增加视图路径，应用场景：针对嵌套的子图展示，有时候需要将不同层次的子图中视图展示放在父级或本级的view-result中，
                                // 因此，通过增加viewResultId表明view-result的唯一标示，viewResultController中通过比对viewResultId来判断用哪个窗口来渲染。
                                viewResultId: currentViewId,// added by qiyongjie, 2018.2.6
                                result: objDataSet
                            };
                            console.debug("向视图展示推送DataSet，%o",nodeData);
                            if(workflow.dealResult){
                                workflow.dealResult(nodeData);
                            }else {
                                comDataManage.setWorkFlowNodeData(worktableFlowId, nodeData);
                            }
                            break;
                        } else {
                            let thisCom = ComLib.getComponent(workNodes[i].componentId);
                            if (thisCom.then && typeof (thisCom.then) === "function") {
                                thisCom.then(function (comdefer) {
                                    let thisNodeObj = {
                                        nodeMassage: workNodes[i],
                                        com: comdefer
                                    };
                                    nodeViewMessage(listData, pathNextIdArr, thisNodeObj, objDataSet, key,currentViewId);// modified by qiyongjie, 2018.2.26 增加参数viewResultId
                                })
                            } else {
                                let thisNodeObj = {
                                    nodeMassage: workNodes[i],
                                    com: thisCom
                                };
                                nodeViewMessage(listData, pathNextIdArr, thisNodeObj, objDataSet, key,currentViewId)// modified by qiyongjie, 2018.2.26 增加参数viewResultId
                            }
                        }
                    }
                }
            }
        };
    }
};
JMQ.subscribe(ConfigConst.MessageQueue.DataSetReceived, compositionCallback);

function getDataSet(nodeData) {
    ApigetDataSet(nodeData.workflowId, nodeData.node.id, CurrentViewData.schemas,true).then(function (res) {
        if(res && res.dataSet){
            let schemas ={};
            CurrentViewData.pids.split(",").forEach(function (e) {
                angular.extend(schemas,CurrentViewData.schemas[e]);
            });
            CurrentViewData.schemas = schemas;
            CurrentViewData.dataSet = res.dataSet;
            nodeData.result = res.dataSet;
            transToNodeData(nodeData);
        }
    });
}
function getSchema(nodeData,workflow) {
    let pids = findPreNodeIds(workflow.diagram,nodeData.node);
    if(angular.isArray(pids)){
        pids = pids.join(',');
    }
    Scheduling.getRddSchemas(workflow.workflowId, pids).then(function (result) {
        CurrentViewData.pids = pids;
        CurrentViewData.schemas = result;
        getDataSet(nodeData);
    })
}
function findPreNodeIds (dag, nd) {
    return dag.edges.filter(function (x) {
        return x.target == nd.id;
    }).map(function (x) {
        return x.source;
    });
}
let setNodeRunParam = function (node,runNode) {
    if(!node || !runNode){
        return;
    }
    let runParam={};
    node.params && node.params.forEach(function (e) {
        e.publishVisible && (runParam[e.key]=e.value);
    });
    if(runNode.paramSetting&&runNode.paramSetting!==""){
        let _param = runNode.paramSetting;
        angular.extend(_param, runParam);
        runNode.paramSetting = _param;
    }else{
        runNode.paramSetting = runParam;
    }
};

/**
 * 自定义执行app
 * */
function reSetParam(currentParamSettings) {
    //重新读取该值 主要针对嵌套指令
   /* currentParamSettings.forEach(function (node) {
        node.params&&node.params.length&&node.params.forEach(function (param) {
            if(param.publishVisible&&param.getSetting&&typeof param.getSetting === "function"){
                param.value = param.getSetting();
            }
        });
    });*/
    currentParamSettings.forEach(function (node) {
        let _node = tempNodeMap[node.id];
        setNodeRunParam(node,_node);
    });
}
let stopNodeMap = {},allNodeMap={},tempNodeMap={},currentParamSettings;
let timer,timeId,runDagworkflow;
let runDagWhenStop = function (startNode,dag,workflow,userName,periodTime,periodOpt) {
    timeId && clearTimeout(timeId);
    timer && clearTimeout(timer);
    runDagworkflow = workflow;
    let analyNodes = dag.nodes,
        runTaskList = [], hasFirst = false, canStop = true;
    if (!startNode) {
        startNode = analyNodes[0];
    }
    if (periodTime > 0) {
        canStop = false;
        if (startNode.id !== analyNodes[0].id) {
            return;
        }
    }
    analyNodes.forEach(function (node, i) {
        if (node.id === startNode.id) {
            hasFirst = true;
        }
        if (hasFirst) {
            runTaskList.push(node);
        }
        /*if (canStop && hasFirst && stopNodeMap[node.id]) {
            hasFirst = false;
            return false;
        }*/
    });
    let isError = false;
    //逐个节点执行
    if (runTaskList && runTaskList.length > 0) {
        //runTaskList = runTaskList[0];
        runTaskList.forEach(function (node) {
            tempNodeMap[node.id] = node;
        });
        reSetParam(workflow.paramSetting);
        let iNd = -1;
        let timeoutFunc = function () {
            if (iNd >= runTaskList.length - 1) {
                JMQ.publish("hideLoad:autoPage");
                workflow.hasDone && workflow.hasDone();
                //所有节点已执行完毕，自动保存流程
                if (periodTime > 0&&!periodOpt.stop) {
                    let periodFun = function () {
                        JMQ.publish("showLoad:autoPage");
                        runDagWhenStop(startNode, dag, workflow,periodTime,periodOpt)
                    };
                    timer = setTimeout(periodFun, periodTime);
                    periodOpt.clear = function () {
                        timer && clearTimeout(timer);
                    };
                    return;
                } else {
                    return;
                }
            }
            iNd++;

            let timeoutId, runFunc = function () {
                timeoutId && clearTimeout(timeoutId);
                let dg = {
                    edges: [],
                    nodes: [runTaskList[iNd]]
                };
                if (runTaskList[iNd].id === "virtualEndNode") {//虚拟伪节点
                    return;
                }

                //let consoleAddText = tableMenuService.getAddText();
                let flowDag = {
                    edges:workflow.diagram.edges,
                    nodes:workflow.diagram.nodes,
                    ports:[]
                },nodeList=[];
                nodeList.push(runTaskList[iNd]);
                if(runTaskList[iNd].workflowId){
                    workflow.workflowId = runTaskList[iNd].workflowId;
                    flowDag.nodes = flowDag.nodes.filter(function (node) {
                        return node.workflowId === workflow.workflowId;
                    })
                }
                //comdesignService.setRunNodeParamSetting(nodeList, flowDag);
                if(!userName){
                    userName =loginService.getCookies().userName;
                }
                let tableWorkflowId = userName+"_"+workflow.workflowId;
                workflow.tableWorkflowId = tableWorkflowId;
                let compile = ComClass.compileDag(tableWorkflowId,flowDag, dg);

                let runCurrentNode = function (compile) {
                    compile.title = runTaskList[iNd].displayName;
                    Scheduling.registerCallback(tableWorkflowId, runTaskList[iNd].id,
                        function (state) {

                        },
                        function (result) {
                            JMQ.publish('voicePrompt', {
                                type: 'audio',
                                state: 'success'
                            });
                            let nodeObj = {
                                flowId: tableWorkflowId,
                                dataSetMap: result
                            };
                            /*debugger
                            runTaskList[iNd];*/
                            compositionCallback(nodeObj,workflow);
                            timeoutFunc();
                        },
                        function (error) {
                            console.error("单步执行错误: %s", error);
                            JMQ.publish('voicePrompt', {
                                type: 'audio',
                                state: 'error'
                            });
                            isError = true;
                            workflow.dealResult && workflow.dealResult(error,true);
                            JMQ.publish("hideLoad:autoPage");
                        });
                    Scheduling.run(tableWorkflowId, workflow.name, runTaskList[iNd].id, compile).then(function () {

                    },function (err) {
                        console.warn("单步执行错误: %s", err);
                        workflow.dealResult && workflow.dealResult(err,true);
                        JMQ.publish("hideLoad:autoPage");
                    });
                };
                if(compile.then){
                    compile.then(function () {
                        compile = ComClass.compileDag(workflow.workflowId, dg);
                        runCurrentNode(compile);
                    })
                }else {
                    runCurrentNode(compile);
                }
            };
            setTimeout(runFunc, 10);
        };
        timeoutFunc();
    }
    /*$scope.runnableDag = analyDag;*/

};
let autoAppModel={};
let initAppDag = function (paramSettings,workflow,dealResult,userName) {
    let tempParamSetting =[];
    let startPos = 0,runNode,lastLoad=[];
    let diagram = angular.isString(workflow.diagram)?JSON.parse(workflow.diagram):workflow.diagram;
    currentParamSettings = paramSettings;
    workflow.dealResult = dealResult;
    tempNodeMap = {};
    stopNodeMap = {};
    allNodeMap = {};
    diagram.nodes = Dag.straightenDag(diagram);
    workflow.diagram = diagram;

    let j = 0,stopNum=0,stopButtonMap={},stopButtonMap2={},currentNum=-1;
    diagram.nodes.forEach(function (node,i) {
        let promise =ComLib.getComponent(node.componentId);
        if(node.id !== paramSettings[j].id){
            tempParamSetting.push(node);
        }else {
            tempParamSetting.push(paramSettings[j]);
            j++
        }
        allNodeMap[node.id] = node;
        if(promise && promise.then){
            lastLoad.push(promise);
        }
    });

    if(lastLoad.length){
        let loadNum=0;
        lastLoad.forEach(function (promise) {
            promise.then(function () {
                loadNum++;
                if(loadNum === lastLoad.length){
                    runDagWhenStop(diagram.nodes[0], diagram, workflow,userName);
                }
            })
        });
    }else {
        runDagWhenStop(diagram.nodes[0], diagram, workflow,userName);
    }
    return diagram;
};
let runApp = function (...args) {
    ComLib.untilLastChartLoad().then(function () {
        initAppDag(...args);
    });
};
let doLinkage = function (linkageId,selectData,callBack) {
    if(callBack){
        allNodeMap.linkageCallback = function (...args) {
            callBack(args);
            allNodeMap.linkageCallback = null;
        }
    }
    Scheduling.sendLinkage(linkageId,selectData);
};
module.exports = {
    initAppDag:initAppDag,
    runApp:runApp,
    runDagWhenStop:runDagWhenStop,
    doLinkage
};