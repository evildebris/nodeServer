const restApi = require('../common/restApi'),
    ConfigConst = require('../common/ConfigConst'),
    DeployConst = require('../common/DeployConst'),
    loginServer =require('../login/login.service'),
    $q = require('../common/$q'),
    $http = require('../common/$http'),
    Utility = require('../common/Utility'),
    Interpreter = require('../scheduling/Interpreter'),
    ComLib = require('../ComLib/ComLib'),
    appScheduling = require('../scheduling/appScheduling');
/*{
    "apiRest":"http://192.168.1.154:6081/cmgr",
    "upload":"http://192.168.1.154:6081/cmgr/upload",
    "auth":"http://192.168.1.154:6081",
    "engine":"http://192.168.1.154:8898",
    "appMapTiles":"http://192.168.1.154:6080/app/MapTiles",


    "engineUser":"huangruoheng",
    "port":"4000"
}*/
let usrMsg = loginServer.getCookies();
DeployConst.promise.then(()=>{
    usrMsg = loginServer.getCookies();
});
function getPermission(usrData=usrMsg){
    const url = restApi.getAuthorityUrl() + '/tyqxgl/rest/deepInsight/app/' + usrData.userId + '/getPermission';

    return $http.post(url);
}
function getUserId(userName){
    const url = restApi.getAuthorityUrl() + '/tyqxgl/rest/user/' + userName + '/getUserDetailByUserName';

    return $http.get(url).then(function (result) {
        if(result&&result.obj){
            return result.obj
        }else {
            console.warn("ComStore执行%s时，REST返回异常：%o", result);
            return;
        }
    });
}
function deleteAppFlow(appId) {
    let action = ConfigConst.Framework.RestAction.deleteAppFlow,
        component={
            ids:appId
        },param={
            component:component,
            user:usrMsg.userName,
            /*login:usrMsg.userId*/
        };
    return restApi.do(action,param).then(function (result) {
        if (result && result.result.status === "OK") {
            return result;
        } else {
            let str = "ComStore执行" + action + "时，REST返回异常：" + result;
            console.warn("ComStore执行%s时，REST返回异常：%o", action, result);
            return result;
        }
    }, function (error) {
        let str = "ComStore执行" + action + "时，REST异常：" + error;
        console.warn("ComStore执行%s时，REST异常：%o", action, error);
        return error;
    });
}
function getAppByName(name,params) {
    if(!usrMsg){
        return $q.defer().promise;// modified by cai.liao 2018/1/29 pf-1767
    }
    let action = ConfigConst.Framework.RestAction.getAppByFlow;
    let component={
        name:name,
        loginUser:usrMsg.userName
    },param={
        component:component,
        user:usrMsg.userName,
        login:usrMsg.userid,
        pageSize:params.pageSize,
        pageNum:params.pageNum,
    };
    if(angular.isArray(params.ids) && params.ids.length){
        component.ids = params.ids.join(",");
    }
    return restApi.do(action,param).then(function (result) {
        if (result && result.result.status === "OK") {
            return result;
        } else {
            console.warn("ComStore执行%s时，REST返回异常：%o", action, result);
            return result;
        }
    }, function (error) {
        console.warn("ComStore执行%s时，REST异常：%o", action, error);
        return error;
    });
}
function getAppByIds(ids,userName){

    let action = ConfigConst.Framework.RestAction.getAppByFlow;
    let component={
        loginUser:userName
    },param={
        component:component,
        user:userName,
        /*login:usrMsg.userId*/
    };
    if(ids.length){
        component.ids = ids.join(",");
    }
    return restApi.do(action,param).then(function (result) {
        if (result && result.result.status === "OK") {
            return result;
        } else {
            console.warn("ComStore执行%s时，REST返回异常：%o", action, result);
            return result;
        }
    }, function (error) {
        console.warn("ComStore执行%s时，REST异常：%o", action, error);
        return error;
    });
}
function getAppByIds2(ids){

    let action = ConfigConst.Framework.RestAction.getAppByFlow;
    let component={
    },param={
        component:component
        /*login:usrMsg.userId*/
    };
    if(ids.length){
        component.ids = ids.join(",");
    }
    return restApi.do(action,param).then(function (result) {
        if (result && result.result.status === "OK") {
            return result;
        } else {
            console.warn("ComStore执行%s时，REST返回异常：%o", action, result);
            return result;
        }
    }, function (error) {
        console.warn("ComStore执行%s时，REST异常：%o", action, error);
        return error;
    });
}
function hasUserInterpreter(usrMsg){
    return Interpreter.getUserInterpreter(usrMsg).then(function (inters) {
        console.log("资源列表：%o",inters);
        if(inters) {
            let defaultInter = null;
            Utility.some(inters, function (x) {
                if (x.default == "1") {
                    defaultInter = x.name;
                    return true;
                } else return false;
            });
            if (!defaultInter && inters.length > 0&&inters[0]) {
                defaultInter=inters[0].name;
            }
            angular.forEach(inters, function (item) {
                if (item.checked) {
                    Interpreter.setSelectSource(item);
                }
            });
            if(defaultInter){
                return true;
            }else{
                console.log("未找到当前用户授权的资源");
                return false;
            }
        }else{
            console.log("未找到当前用户授权的资源");
            return false;
        }
    });
}
function getAppList(userData,name = '') {
    console.log("---------------appService:getAppList data-----------------------");
    return getPermission(userData).then(function (result) {
        let ids = [];
        let map={};
        if (result && result.data && result.data.length) {
            result.data.forEach(function (e) {
                map[e.targetId] = e;
                ids.push(e.targetId);
            });
        }
        return appService.getAppByName(name,{ids:ids,pageNum:1,pageSize:999999}).then(function (result) {
            if(result && result.data && result.data.list&&result.data.list.recordList && result.data.list.recordList.length) {
                console.log("---------------appService:getAppList data over-----------------------");
                return result.data.list.recordList;
            }else if (result && result.data && result.data.list && result.data.list.length) {
                let apps = result.data.list.filter(function (app) {
                    if(app.createUser!==userData.userName&&!(map[app.id].permission&8)){
                        return false;
                    }
                    return true;
                });
                console.log("---------------appService:getAppList data over-----------------------");
                return apps;
            }else {
                console.log("---------------appService:getAppList data empty over-----------------------");
                return [];
            }
        });
        /*return getAppByIds(ids,userData.userName).then(function (result) {
            if (result && result.data && result.data.list && result.data.list.length) {
                let apps = result.data.list.filter(function (app) {
                    if(app.createUser!==userData.userName&&!(map[app.id].permission&8)){
                        return false;
                    }
                    return true;
                });
                console.log("---------------appService:getAppList data over-----------------------");
                return apps;
            }
        })*/
    })
}
function getAppByUserName(userName,name='') {
    return getUserId(userName).then((userData)=> {
        if (userData) {
            usrMsg = userData;
            commonViewCom = ComLib.getComponentBySn(ConfigConst.ComLib.PresetComSN.DataView);
            linkageViewCom = ComLib.getComponentBySn(ConfigConst.ComLib.PresetComSN.LinkageView);
            originalViewCom = ComLib.getComponentBySn(ConfigConst.ComLib.PresetComSN.SubDagView);
            return getAppList(userData, name).then((result) => {
                if (result) {
                    let apps = result;
                    if (apps && apps.length) {
                        apps = apps[0];
                        let diagram = angular.isString(apps.diagram) ? JSON.parse(apps.diagram) : apps.diagram,
                            comMap = {}, reuslt, params = {},numParams={};
                        const chartLists = {};
                        apps.paramSetting = JSON.parse(apps.paramSetting);
                        appParamMap[apps.id] = {};
                        apps.paramSetting.forEach(function (node) {
                            node.params && node.params.length && node.params.forEach(function (param, i) {
                                if (param.publishVisible) {
                                    if (!appParamMap[apps.id][node.id]) {
                                        appParamMap[apps.id][node.id] = {};
                                    }
                                    if (params[param.key]) {
                                        let newKey = param.key + "_" + numParams[param.key]++;
                                        appParamMap[apps.id][node.id][i] = newKey;
                                        params[newKey] = param.value;
                                    } else {
                                        appParamMap[apps.id][node.id][i] = param.key;
                                        params[param.key] = param.value;
                                        numParams[param.key] = 0;
                                    }
                                }
                            });
                        });
                        if (diagram.nodes && diagram.nodes.length) {
                            diagram.nodes.forEach(function (node) {
                                getViewCom(node, comMap, chartLists);
                            });
                        }
                        result = {
                            viewComMap: comMap,
                            id: apps.id,
                            name: apps.name,
                            paramSetting: params,
                            chartMap: chartLists
                        };
                        return result;
                    }
                    return "app查询结果为空";
                }
                else {
                    return "该用户信息为空，请确认用户名是否正确!";
                }
            })
        }
    });
}
function initAppList() {
    console.log("---------------init appService:loading data-----------------------");
    return getUserId(usrMsg.userName).then(function (userData) {
        if(userData){
            usrMsg.userId = userData.userId;
            return getPermission().then(function (result) {
                let ids = [];
                let map={};
                if (result && result.data && result.data.length) {
                    result.data.forEach(function (e) {
                        map[e.targetId] = e;
                        ids.push(e.targetId);
                    });
                }
                return getAppByIds(ids).then(function (result) {
                    if (result && result.data && result.data.list && result.data.list.length) {
                        let apps = result.data.list.filter(function (app) {
                            if(app.createUser!==usrMsg.userName&&!(map[app.id].permission&8)){
                                return false;
                            }
                            return true;
                        });
                        console.log("---------------init appService:loading data over-----------------------");
                        return apps;
                    }
                })
            })
        }
    });
}
//let initPromise = initAppList();
function setCurrentParam(paramSettings,currentParam,paramNodeMap,appId) {
    if(paramSettings&&currentParam&&paramNodeMap){
        if(currentParam.length) {
            currentParam.forEach && currentParam.forEach(function (node) {
                let currentNode = paramNodeMap[node.id], i = 0;
                if (currentNode) {
                    currentNode.params.forEach(function (param) {
                        if (param.key === (node.params[i] && node.params[i].key)) {
                            param.value = node.params[i].value;
                            i++;
                            if (node.params.length >= i) {
                                return false;
                            }
                        }
                    })
                }
            });
        }else{
            if(appParamMap[appId]){
                for(let nodeId in appParamMap[appId]){
                    let currentNode = paramNodeMap[nodeId];
                    for(let pos in appParamMap[appId][nodeId]){
                        let key =  appParamMap[appId][nodeId][pos];
                        currentParam[key] && (currentNode.params[pos].value = currentParam[key]);
                    }
                }
            }
        }
    }
}
function dealViewMap(app) {
    let template = JSON.parse(app.template),len=0;
    template.layouts && template.layouts.forEach(function (node) {
        if(node.type === "group"){
            node.group.forEach(function () {
                len++;
            })
        }
        len++;
    });
    return len;
}

/**
 * getAppById2 相关功能 构造app初始化时候前端所需要一切数据
 * */
var commonViewCom={},linkageViewCom={},originalViewCom={},FlowOutputCom={};
//FlowOutputCom = ComLib.getComponentBySn(ConfigConst.ComLib.PresetComSN.FlowOutput);
const tableNameList = ['nodeTableName', 'tableName', 'tableName2', 'legendTable', 'mapTableName', 'networkRelationTableName', 'relationTableName', 'newNode', 'newEdge', 'dataFloorTableName', 'channelTableName', 'warnTableName', 'faultTableName', 'transTableName', 'equTableName', 'coordinateTableName'];
const appParamMap = {};
const linkChartMap = {};
let cases;
function anlaysisChartCase(chart,comMap,chartLists,node,pos,parentId,parentChart) {
    if(!chart || !chart.case){
        return;
    }
    cases = ComLib.getCaseCharts(chart.case);
    const pelList = [];
    let selectedChart = '',isLinkage = false;

    cases && cases.forEach(function (_case){
        if(!comMap[_case.id]){
            comMap[_case.id] = _case;
        }
        // 设置下拉被选图元
        pelList.push({
            'value' : _case.id,
            'text' : _case.name
        });
        if (_case.id === chart.chart.value) {
            selectedChart = _case.id;
        }
    });
    //判断联动分析是否显示
    if (chart.linkage && chart.linkage.nodes && chart.linkage.nodes.length > 0) {
        isLinkage = true;
    }

    // 图元参数空格处理
    for (let c in chart.chart) {
        if (chart.chart[c] && !(typeof chart.chart[c] === 'object')) {
            chart.chart[c] = chart.chart[c].replace(/(^\s*)|(\s*$)/g, "");
        }
    }
    let chartId = 'chart_' + node.id + chart.layout,tableMap={};
    //该chart图所使用的所有表的名称
    for(let paramName in chart.chart){
        let hasTable = false;
        tableNameList.forEach(function (t) { if(t === paramName){ hasTable = true; } });
        if(!hasTable && paramName.toLowerCase().indexOf('tablename')>-1){
            hasTable = true;
        }
        if(hasTable){
            tableMap[chart.chart[paramName]] = true;
        }
    }
    if(!chartLists[chartId]) {
        chartLists[chartId] = {
            paramSetting: chart.chart,
            caseVal: chart.case,
            selectedData: {},
            theme: '',
            layoutId: chart.layout,
            chartId,
            layout: {},
            isLinkage,
            isChartList: chart.case?true:false,
            timer: 0,
            pelList: pelList, // 图元下拉列表
            selectedChart: selectedChart, // 初始化被选中图元
            nodeId: node.id,
            nodeName: node.displayName,
            pos
        };
        if(parentId) {
            chartLists[chartId]['parentLinkChartId'] = 'chart_' + parentId + parentChart.layout;
        }
    }

}
 function getViewCom(node,comMap,chartLists,parentId,parentChart){
    //视图联动的解析
    if(node && node.paramSetting && node.paramSetting.chartList && node.paramSetting.chartList.length){
        node.paramSetting.chartList.forEach(function (chart,pos) {
            anlaysisChartCase(chart,comMap,chartLists,node,pos,parentId,parentChart);
            if(chart.linkage && chart.linkage.nodes && chart.linkage.nodes.length){
                chart.linkage.nodes.forEach(function (linkNode) {
                    if(linkNode.componentId === commonViewCom.id){
                        linkNode.paramSetting.chartList.forEach(function (t,i) {
                            anlaysisChartCase(t,comMap,chartLists,linkNode,i);
                        });
                    }else if(linkNode.componentId === linkageViewCom.id) {
                        getViewCom(linkNode,comMap,chartLists);
                    }else if(linkNode.componentId === originalViewCom.id) {
                        getViewCom(linkNode,comMap,chartLists,node.id,chart);
                    }
                });
            }
        });
    }
    //子图处理
    if(node && node.paramSetting && node.paramSetting.subDag&&node.paramSetting.subDag.nodes&&node.paramSetting.subDag.nodes.length){
        node.paramSetting.subDag.nodes.forEach(function (linkNode) {
            if(linkNode.componentId === commonViewCom.id){
                linkNode.paramSetting.chartList.forEach(function (t,i) {
                    anlaysisChartCase(t,comMap,chartLists,linkNode,i);
                });
            }else if(linkNode.componentId === linkageViewCom.id || linkNode.componentId === originalViewCom.id) {
                getViewCom(linkNode,comMap,chartLists);
            }
        });
    }
    if(node.ctype == ConfigConst.ComLib.ComType_Composite){
        for(let key in node.paramSetting){
            let param = node.paramSetting[key];
            if(param.chartList){
                param.chartList.forEach(function (chart,pos) {
                    anlaysisChartCase(chart,comMap,chartLists,node,pos,parentId,parentChart);
                    if(chart.linkage && chart.linkage.nodes && chart.linkage.nodes.length){
                        chart.linkage.nodes.forEach(function (linkNode,i) {
                            if(linkNode.componentId === commonViewCom.id){
                                linkNode.paramSetting.chartList.forEach(function (t) {
                                    anlaysisChartCase(t,comMap,chartLists,linkNode,i);
                                });
                            }else if(linkNode.componentId === linkageViewCom.id) {
                                getViewCom(linkNode,comMap,chartLists);
                            }else if(linkNode.componentId === originalViewCom.id) {
                                getViewCom(linkNode,comMap,chartLists,node.id,chart);
                            }
                        });
                    }
                });
            }
        }
    }
}
function getAppById2(id) {
    commonViewCom = ComLib.getComponentBySn(ConfigConst.ComLib.PresetComSN.DataView);
    linkageViewCom = ComLib.getComponentBySn(ConfigConst.ComLib.PresetComSN.LinkageView);
    originalViewCom = ComLib.getComponentBySn(ConfigConst.ComLib.PresetComSN.SubDagView);
    return getAppByIds2([id]).then(function (result) {
        if (result && result.data && result.data.list && (result.data.list.length || result.data.list.recordList)) {
            let apps = result.data.list.recordList || result.data.list;
            if (apps && apps.length) {
                apps = apps[0];
                let diagram = angular.isString(apps.diagram)?JSON.parse(apps.diagram):apps.diagram,comMap={},reuslt,params={},numParams={};
                const chartLists = {};
                apps.paramSetting =JSON.parse(apps.paramSetting);
                appParamMap[apps.id] = {};
                apps.paramSetting.forEach(function (node) {
                    node.params&&node.params.length&&node.params.forEach(function (param,i) {
                        if(param.publishVisible){
                            if(!appParamMap[apps.id][node.id]) {
                                appParamMap[apps.id][node.id] = {};
                            }
                            if(params[param.key] !== undefined){
                                let newKey = param.key+"_"+ numParams[param.key]++;
                                appParamMap[apps.id][node.id][i] = newKey;
                                params[newKey] = param.value;
                            }else {
                                appParamMap[apps.id][node.id][i] = param.key;
                                params[param.key] = param.value;
                                numParams[param.key] = 0;
                            }
                        }
                    });
                });
                if(diagram.nodes && diagram.nodes.length){
                    diagram.nodes.forEach(function (node) {
                        getViewCom(node,comMap,chartLists);
                    });
                }
                result = {
                    viewComMap : comMap,
                    id: apps.id,
                    name: apps.name,
                    paramSetting: params,
                    chartMap: chartLists
                };
                return result;
            }
        }
        return `appId:${id} 获取app数据为空,请确认appId正确!`;
    });
}
const nodeOriginal = {};
function runAppById(id,userName = usrMsg.userName,params,isMap = false) {
    console.log("---------------appService:runAppById init data -----------------------");
    return getAppByIds2([id],userName).then(function (result) {
        if (result && result.data && result.data.list && (result.data.list.length||result.data.list.recordList)) {
            let apps = result.data.list.recordList || result.data.list;
            if(apps&&apps.length){
                let app =apps[0];
                return hasUserInterpreter({userName}).then(function (result) {
                    let defer = $q.defer();
                    if(!result) {
                        console.log("未找到当前用户授权的资源,不能执行App");
                        defer.resolve("未找到当前用户授权的资源,不能执行App");
                    }else if(app){
                        app.paramSetting =JSON.parse(app.paramSetting);
                        let paramNodeMap={},viewLength=dealViewMap(app),len=0,results=[];
                        app.paramSetting.forEach((e)=>{
                            paramNodeMap[e.id] = e;
                            if(nodeOriginal[e.id]){
                                delete nodeOriginal[e.id]
                            }
                        });
                        if(!isMap) {
                            params && setCurrentParam(app.paramSetting, params, paramNodeMap, app.id);
                        }else if(appParamMap[app.id] && params){// 回填app参数映射数据 key:appParam[node.id][i]
                            let appParam = appParamMap[app.id];
                            app.paramSetting.forEach(function (node) {
                                node.params&&node.params.length&&node.params.forEach(function (param,i) {
                                    if(param.publishVisible && appParam[node.id] && appParam[node.id][i] !== undefined){
                                        param.value = params[appParam[node.id][i]];
                                    }
                                });
                            });
                        }
                        app.hasDone =function () {
                            defer.resolve(results);
                        };
                        appScheduling.runApp(app.paramSetting,app,(r,hasError)=>{
                            len++;
                            if(hasError){
                                defer.resolve({results, hasError,error:r});
                            }else {
                                results.push(r);
                            }
                        },userName);
                    }
                    return defer.promise;
                });
            }
        }
        return `appId:${id} 获取app数据为空,请确认appId正确!`;
    })
}
function runAppGetChartData(id,params) {
    if(angular.isString(params)){
        try {
            params = JSON.parse(params);
            if(angular.isString(params)){
                params = JSON.parse(params);
            }
        }catch(e) {
            params = undefined;
        }
    }
    return runAppById(id,undefined,params,true).then(function (result) {
        const defer = $q.defer();
        if((result&&result.hasError) ||angular.isString(result)){//出错时候不处理
            defer.resolve(result);
        }else {//app运行结果构造出chart对象数据
            result && result.forEach((nodeData)=>{
                nodeData.chartList = [];
                nodeOriginal[nodeData.node.id] = angular.copy(nodeData.node);
                nodeData.node&&nodeData.node.paramSetting&&nodeData.node.paramSetting.chartList &&
                nodeData.node.paramSetting.chartList.forEach(function (chart,pos) {
                    if(chart && chart.case){
                        nodeData.chartList.push('chart_'+ nodeData.node.id + chart.layout);
                    }
                });
                delete nodeData.node;
            });
            defer.resolve(result);
        }
        return defer.promise;
    })
}
function runLinkage(id,linkageId,selectData) {
    const defer = $q.defer();
    if(angular.isString(selectData)){
        selectData = JSON.parse(selectData);
    }
    appScheduling.doLinkage(linkageId,selectData,(obj) => {
        obj = obj[0];
        let dataSetMap = obj.dataSetMap;
        for(let name in dataSetMap){
            if(name.indexOf(linkageId)>-1){
                defer.resolve(dataSetMap[name]);
                return;
            }
        }
        defer.resolve(`${linkageId}数据解析为空!`);
    });
    return defer.promise;
}

const appService = {
    //promise:initPromise,
    getAppById:getAppByIds,
    getAppByName,
    getAppByUserName,
    runAppById,
    getAppList,
    runLinkage,
    getAppById2,
    runAppGetChartData
};
module.exports = appService;
