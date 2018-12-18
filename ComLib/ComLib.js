const $q = require('../common/$q');
const Utility = require('../common/Utility');
const ConfigConst =require('../common/ConfigConst');
const DeployConst =require('../common/DeployConst');
const dag =require('../common/Dag');
const JMQ =require('../common/JMQ');
const ComStore =require('./ComStore');
const ComClass =require('./ComClass');
const ChartCase = require("../ComLib/chartCaseService");
//常量定义

//变量定义
var _self = this;
var _initiated = false;
//算子库
var _comMap = {};

//全局函数定义
var _item = {};
var deferred ,_until_comId;
deferred = $q.defer();
function untilLastChartLoad(ComId) {
    return deferred.promise;
}

/**
 * 加载各算子的最新版本，仅加载算子的管理类信息。模板类信息采用懒惰加载策略。
 */
function init() {
    //加载所有的算子
    DeployConst.promise.then(()=>{
        console.log('---------------init comLib:loading data-----------------------');
        ComStore.getComponents().then(function (comList) {
            if (Array.isArray(comList)) {
                _comMap = {};
                angular.forEach(comList, function (oriCom) {
                    if (oriCom.id && oriCom.sn) {
                        if(oriCom.template && typeof(oriCom.template)=="string"){
                            try{
                                var tem=JSON.parse(oriCom.template);
                                oriCom.template=tem;
                            }catch (e){}
                        }
                        var com = ComClass.Com.create(oriCom);
                        if (com) {//处于调试目的，可将对com的判断注释掉
                            _comMap[oriCom.id] = com;
                        }
                        //记录分类，代码待添加
                    }
                });
                //临时取消懒加载，改为完全加载
                _until_comId = comList[comList.length-1].id;
                if (true) {
                    angular.forEach(comList, function (oriCom) {
                        getComponent(oriCom.id);
                    });
                } else {
                    //加载预置算子
                    angular.forEach(ConfigConst.ComLib.PresetComSN, function (sn) {
                        getComponentBySn(sn);
                    });
                    //加载所有图元算子
                    angular.forEach(comList, function (oriCom) {
                        if (oriCom.type === ConfigConst.ComLib.ComType_ViewAtom) {
                            getComponent(oriCom.id);
                        }
                    });
                }
                _initiated = true;
            }else{
                setTimeout(function(){init();},200);
                return;
            }
        });
        deferred.promise.success(()=>{console.log('---------------init comLib:loading data over-----------------------');});
        ComClass.ComLibSrv = _self;
        JMQ.subscribe("updateComMap", updateComMap);
    });
}

var hasLoadLocalCom = false;
function loadLocalCom() {
    if(_comMap) {
        /*_comMap[2714] = ComClass.Com.create(chartGis);
        _comMap[2256] = ComClass.Com.create(chartOne);
        _comMap[2420] = ComClass.Com.create(chartMore);
        _comMap[2356] = ComClass.Com.create(chartTable);
        _comMap["3012"] = ComClass.Com.create(chartGis2);
        _comMap["47e2f22b8ffc4efaada84ec4dddeaa60"] = ComClass.Com.create(lineChart);
        _comMap["a1f406bb51dd473fac50e1245679176f"] = ComClass.Com.create(barChart);*/
    }
}

/**
 * 异步加载算子模板，如果算子库中未查找到该算子，则加载该算子的全部对象。
 * @param comId 算子ID
 * @returns {*} 获得算子对象的promise对象。then方法获取算子对象，如果为空则表明数据库检索失败。
 */
function loadComTemplate(comId) {
    if (!comId) {
        return false;
    }
    //判断全加载还是仅加载模板
    if (_comMap[comId]) {
        //仅加载模板
        var com = _comMap[comId];
        return ComStore.getComponentTemplate(comId).then(function (template) {
            if (!template) {
                return null;
            } else {
                // if(!com.template){
                //     com.template=new ComClass.ComTemplate();
                // }
                // com.template.read(template);
                com.template = template.template;
                return com;
            }
        });
    } else {
        //全加载
        return ComStore.getComponent(comId).then(function (comObj) {
            if (comObj && typeof(comObj) === "object") {
                // var com=ComClass.Com.create(comObj);
                // _comMap[comId]=com;
                // return com;
                return comObj;
            } else {
                //获取数据库中算子对象异常
                return null;
            }
        });
    }
}

/**
 * 修改缓存 tanglvshuang
 * @param com
 */
function updateComMap(com){
    var operType=com.operType;
    var key=com.id;
    //add tanglvshuang 2018.2.8 算子库导入 新增算子更新,覆盖算子更新,导入分析流新增算子,导入分析流覆盖算子
    if(operType=="szkImport"||operType=="szkImportCover"||operType=="fxlImport"||operType=="fxlImportCovers"){
        var ids=com.ids;
        angular.forEach(ids,function(id){
            delete _comMap[id];
            getComponent(id, true);
        });
    }else{
        if(operType=="delete"){
            if(_comMap[key]){
                delete _comMap[key];
            }
        }else{
            var cacheCom=_comMap[key];
            if(cacheCom){
                if(cacheCom['operDate']){
                    if(cacheCom['operDate']<com['operDate']){
                        _comMap[key]=com;
                    }
                }else{
                    _comMap[key]=com;
                }
            }else{
                _comMap[key]=com;
            }
        }
    };

}

function initiated() {
    return _initiated;
}

/**
 * 获取算子。返回值的判断：com instanceof ComClass.Com
 * @param comId 算子ID
 * @returns {*} 如果已加载该算子，则返回算子对象；否则返回异步promise对象，可在then函数中获取算子对象。
 */
function getComponent(comId, force) {
    if (!comId || !(_comMap[comId] || force)) {
        //基于ComLib会自动加载所有算子的考虑
        return null;
    }
    if (_comMap[comId] && _comMap[comId].template && !force) {
        if(_until_comId === comId) {
            deferred && deferred.resolve();
        }
        return _comMap[comId];
    } else {
        //判断全加载还是仅加载模板
        if (_comMap[comId] && !force) {
            //仅加载模板
            var com = _comMap[comId];
            return ComStore.getComponentTemplate(comId).then(
                (function (cmid, com) {
                    return function (template) {
                        if (!template) {
                            return null;
                        } else {
                            //console.debug("getComponent, cmid=%s, id=%s,name=%s, %s", cmid, template.id, com.name, template.template);
                            com = _comMap[template.id];
                            com.template = template.template;
                            _comMap[template.id] = ComClass.Com.create(com);
                            if(_until_comId === com.id) {
                                deferred && deferred.resolve();
                            }
                            return _comMap[cmid];
                        }
                    }
                })(comId, com));
        } else {
            //全加载
            return ComStore.getComponent(comId).then((function (cmid) {
                return function (comObj) {
                    if (comObj && typeof(comObj) === "object") {
                        if (comObj.template) {
                            _comMap[cmid] = ComClass.Com.create(comObj);
                            return _comMap[cmid];
                        } else {
                            return ComStore.getComponentTemplate(cmid).then(function (template) {
                                com = comObj;
                                com.template = template.template;
                                _comMap[template.id] = ComClass.Com.create(com);
                                if(_until_comId === com.id) {
                                    deferred && deferred.resolve();
                                }
                                return _comMap[template.id];
                            });
                        }
                    } else {
                        //获取数据库中算子对象异常
                        return null;
                    }
                }
            })(comId));
        }
    }
}

/**
 * 获取算子。返回值的判断：com instanceof ComClass.Com
 * @param sn 算子SN
 * @returns {*} 如果已加载该算子，则返回算子对象；否则返回异步promise对象，可在then函数中获取算子对象。
 */
function getComponentBySn(sn) {
    var foundCom = null, maxver = 0;
    for (var cid in _comMap) {
        if (_comMap[cid].sn == sn) {
            var com = _comMap[cid];
            if (com.version > maxver) {
                foundCom = com;
                maxver = com.version;
            }
        }
    }
    if (foundCom) {
        if (foundCom.template) {
            return foundCom;
        } else {
            return getComponent(foundCom.id);
        }
    } else {
        //未在本地缓存中找到，则进行后端数据库搜索
        return ComStore.getComponentBySn(sn).then(function (comlist) {
            if (comlist && Array.isArray(comlist) && comlist.length > 0) {
                return ComStore.getComponentTemplate(comlist[0].id).then(function (template) {
                    if (!template) {
                        return null;
                    } else {
                        comlist[0].template = template.template;
                        _comMap[comlist[0].id] = ComClass.Com.create(comlist[0]);
                        return _comMap[comlist[0].id];
                    }
                });
            }
        });
    }
}

/**
 * 延迟加载方法
 * @param template      参数模版
 * @param paramSetting  参数值
 */
function lazyLoad(template, paramSetting) {
    var defer = $q.defer();
    var isGo = true;
    //初始递归true
    var scope = {};
    scope.iHashRef = false;
    scope.refSum = 0;
    scope.refCount = 0;
    scope.isGoCount = 0;
    var param = {
        defer: defer,
        length: 0,
        index: 0,
        count: 0,
        isGoCount: 0,
        message: "",
        allCount: 0,
        isEnd: false,
        map: {},
        lv: 0,
        "scope": scope
    };
    var reulst = lazyLoadComponent(template, paramSetting, param, isGo, true, 0);
    return reulst.defer.promise;
    //return lazyLoadComponent(template,paramSetting,defer,isGo);
}

/**
 *
 * @param template          参数模版
 * @param paramSetting      参数值
 * @param defer 递归调用时的promise对象
 * @param isGo  递归出口
 * @param isFisrt  是否第一次调用
 * @param lv
 * @returns {*}
 */
function lazyLoadComponent(template, paramSetting, paramDefer, isGo, isFisrt, lv) {
    paramDefer.isGoCount++;
    if (template && angular.isDefined(template.paramList) && template.paramList != null && template.paramList.length > 0 && isGo && paramSetting) {
        var count = 0;
        var paramList = template.paramList;
        angular.forEach(paramList, function (param) {
            if (param.element == "mullist" || param.type == "dag") {
                count++;
            }
        });
        //递归出口
        if (typeof(count) == 'undefined') {
            isGo = false;
        } else {
            isGo = count > 0;
        }
    } else {
        isGo = false;
    }
    if (template && angular.isDefined(template.paramList) && template.paramList != null && template.paramList.length > 0 && isGo && paramSetting) {
        var paramList = template.paramList;
        if (lv == 0) paramDefer.length = paramList.length;
        if (isGo) {

            angular.forEach(paramList, function (param, i) {

                if (param.type == "component") {
                    var key = param.key;
                    var obj = paramSetting[key]; //如果第一级的参数是引用类型则直接加载该算子不必循环加载该算子的emplate.paramList var com=_self.getComponent(id);
                    var id = obj.value;
                    paramDefer.scope.refSum++;
                    paramDefer.scope.iHashRef = true;
                    //b
                    if (id) {
                        var com = _self.getComponent(id);
                        setTimeout(function () {
                            paramDefer.scope.refCount++;
                            paramDefer.scope.$apply();
                        }, 10);
                    } //e
                }
                if (param.element == "mullist" && param.type != "component" && param.type != "dag") {
                    var key = param.key;
                    var childParamlist = param.paramList; //参数列表
                    if (childParamlist) {

                        angular.forEach(childParamlist, function (item, j) {

                            if (item.type == "component") {
                                var ckey = item.key;
                                var list = paramSetting[key]; //获取算子ID
                                paramDefer.scope.refSum++;
                                paramDefer.scope.iHashRef = true;
                                if(list==null||list.length==0){
                                    isGo = false;
                                    setTimeout(function () {
                                        paramDefer.scope.refCount++;
                                        paramDefer.scope.$apply();
                                    }, 10);
                                }else{
                                    angular.forEach(list, function (childItem) {
                                        if (childItem[ckey]) {
                                            var id = childItem[ckey].value;
                                            if (id) {
                                                var com = _self.getComponent(id);
                                                var obj = {};
                                                obj[ckey] = childItem[ckey];
                                                if (com instanceof ComClass.Com) {
                                                    var subTemplate = com.template;
                                                    lazyLoadComponent(subTemplate, obj, paramDefer, isGo, false, lv++);
                                                    setTimeout(function () {
                                                        paramDefer.scope.refCount++;
                                                        paramDefer.scope.$apply();
                                                    }, 10);
                                                } else {
                                                    /* com.then(function (rCom) {
                                                         lazyLoadComponent(subTemplate, obj, paramDefer, isGo, false, lv++);
                                                         setTimeout(function () {
                                                             paramDefer.scope.refCount++;
                                                             paramDefer.scope.$apply();
                                                         }, 10);
                                                     });*/
                                                    if (com&&com.then && typeof(com.then) == "function") {
                                                        com.then(function(rCom){
                                                            var subTemplate = rCom.template;
                                                            lazyLoadComponent(subTemplate, obj, paramDefer, isGo, false, lv++);
                                                            setTimeout(function () {
                                                                paramDefer.scope.refCount++;
                                                                paramDefer.scope.$apply();
                                                            }, 10);
                                                        });
                                                    }else{
                                                        setTimeout(function () {
                                                            paramDefer.scope.refCount++;
                                                            paramDefer.scope.$apply();
                                                        }, 10);
                                                    }

                                                }
                                            }
                                        }
                                    });
                                }
                            }
                            if (item.element == "mullist" && item.type != "component" && param.type != "dag") {
                                var ckey = item.key;
                                var obj = paramSetting[key];
                                var childObj = obj[ckey];
                                var pObj = {};
                                pObj[ckey] = childObj;
                                paramDefer.scope.refSum++;
                                paramDefer.scope.iHashRef = true;
                                lazyLoadComponent(item, pObj, paramDefer, isGo, false, lv++);
                                setTimeout(function () {
                                    paramDefer.scope.refCount++;
                                    paramDefer.scope.$apply();
                                }, 10);
                            }
                            if (item.type == "dag") {
                                var ckey = item.key;
                                var list = paramSetting[key]; //参数列表
                                angular.forEach(list, function (childItem) {
                                    if (childItem[ckey]) {
                                        var obj = childItem[ckey];
                                        var nodes = obj.nodes;
                                        paramDefer.scope.refSum = paramDefer.scope.refSum + nodes.length;
                                        paramDefer.scope.iHashRef = true;
                                        angular.forEach(nodes, function (node) {
                                            var nodeParamSetting = node.paramSetting;
                                            var componentId = node.componentId;
                                            if (componentId) {
                                                var com = _self.getComponent(componentId);
                                                if (com instanceof ComClass.Com) {
                                                    var subTemplate = com.template;
                                                    lazyLoadComponent(subTemplate, nodeParamSetting, paramDefer, isGo, false, lv++);
                                                    setTimeout(function () {
                                                        paramDefer.scope.refCount++;
                                                        paramDefer.scope.$apply();
                                                    }, 10);
                                                } else {
                                                    /*com.then(function (rCom) {
                                                        var subTemplate = rCom.template;
                                                        lazyLoadComponent(subTemplate, nodeParamSetting, paramDefer, isGo, false, lv++);
                                                        setTimeout(function () {
                                                            paramDefer.scope.refCount++;
                                                            paramDefer.scope.$apply();
                                                        }, 10);
                                                    });*/
                                                    if (com&&com.then && typeof(com.then) == "function") {
                                                        com.then(function(rCom){
                                                            var subTemplate = rCom.template;
                                                            lazyLoadComponent(subTemplate, obj, paramDefer, isGo, false, lv++);
                                                            setTimeout(function () {
                                                                paramDefer.scope.refCount++;
                                                                paramDefer.scope.$apply();
                                                            }, 10);
                                                        });
                                                    }else{
                                                        setTimeout(function () {
                                                            paramDefer.scope.refCount++;
                                                            paramDefer.scope.$apply();
                                                        }, 10);
                                                    }
                                                }
                                            }
                                        });
                                    }
                                });
                            }

                        });
                    }
                }
                ;
                if (param.type == "dag") {
                    var key = param.key;
                    var obj = paramSetting[key];
                    if(obj&&obj.nodes&&obj.nodes.length>0) {
                        var nodes = obj.nodes;
                        paramDefer.scope.refSum = paramDefer.scope.refSum + nodes.length;
                        paramDefer.scope.iHashRef = true;
                        angular.forEach(nodes, function (node) {
                            var nodeParamSetting = node.paramSetting;
                            var componentId = node.componentId;
                            if (componentId) {
                                var com = _self.getComponent(componentId);
                                if (com instanceof ComClass.Com) {
                                    var subTemplate = com.template;
                                    lazyLoadComponent(subTemplate, nodeParamSetting, paramDefer, isGo, false, lv++);
                                    setTimeout(function () {
                                        paramDefer.scope.refCount++;
                                        paramDefer.scope.$apply();
                                    }, 10);
                                } else {
                                    /* com.then(function (rCom) {
                                         var subTemplate = rCom.template;
                                         lazyLoadComponent(subTemplate, nodeParamSetting, paramDefer, isGo, false, lv++);
                                         setTimeout(function () {
                                             paramDefer.scope.refCount++;
                                             paramDefer.scope.$apply();
                                         }, 10);
                                     });*/
                                    if (com&&com.then && typeof(com.then) == "function") {
                                        com.then(function(rCom){
                                            var subTemplate = rCom.template;
                                            lazyLoadComponent(subTemplate, obj, paramDefer, isGo, false, lv++);
                                            setTimeout(function () {
                                                paramDefer.scope.refCount++;
                                                paramDefer.scope.$apply();
                                            }, 10);
                                        });
                                    }else{
                                        setTimeout(function () {
                                            paramDefer.scope.refCount++;
                                            paramDefer.scope.$apply();
                                        }, 10);
                                    }
                                }
                            }
                        });
                    }
                }
                /* if(i==paramList.length-1){
                 if(checkMax(paramDefer.map)){
                 paramDefer.map = {}
                 paramDefer.map["LV_MAX_STATUS_"+nowlv_i]=true;
                 console.log("最外层的firstFor11====");
                 }
                 }*/
            });
        }
    }
    if (!isGo && isFisrt) {
        paramDefer.defer.resolve(true);
    }
    if (!isGo) {
        if (paramDefer.scope) {
            paramDefer.scope.$watch('refCount', function () {
                //checkMax(paramDefer.map)
                if (paramDefer.scope.refSum == paramDefer.scope.refCount && paramDefer.scope.iHashRef) {
                    paramDefer.defer.resolve(true);
                }
            });
        }
    }
    return paramDefer;
}

/**
 * 取最大值
 * @param map
 */
function checkMax(map) {
    if (!map) {
        return false;
    }
    for (var v in map) {
        if (!map[v]) {
            return false;
        }
    }
    return true;
}

/**
 * 获取当前算子库中所有算子
 * @returns {{}} 以算子ID作为属性名的对象。即{comId: com, ... }
 */
function getComponents() {
    return _comMap;
}

/**
 * 获取算子库中最新版本算子的列表
 * @returns {Array} 包含最新版本算子对象的数组
 */
function getLastComponents() {
    var result = [];
    angular.forEach(_comMap, function (com, comid) {
        var found = false;
        for (var i = 0; i < result.length; i++) {
            if (result[i].sn == com.sn) {
                found = true;
                if (result[i].version < com.version) {
                    result.splice(i, 1, com);
                    break;
                }
            }
        }
        if (!found) {
            result.push(com);
        }
    });
    return result;
}

/**
 * 异步保存算子到数据库
 * @param com 算子对象
 * @returns {*} 异步promise对象。如果保存成功则返回算子对象，否则返回错误文本
 */
function saveComponent(com) {
    var defer = $q.defer();
    ComStore.saveComponent(com).then(function (com2) {
        if (com2 instanceof ComClass.Com) {
            _comMap[com2.id] = com2;
            if (com2 instanceof ComClass.ChartCom) {
                //保存图例
                ChartCase.updateCase(com2.id, com2.template.case, com2.template.caseMark).then(function () {
                    defer.resolve(com2);
                }, function () {
                    defer.resolve(com2);
                });
            } else {
                defer.resolve(com2);
            }
        }
        defer.resolve();
    });
    return defer.promise;
}

/**
 * 删除算子
 * @param comId 算子对象
 * @returns {*} 删除结果的promise对象
 */
function deleteComponent(comId) {
    //判断当前库中是否包含该算子。如果有，则删除数据库后还需要删除当前库中算子
    if (_comMap[comId]) {
        return ComStore.deleteComponent(comId).then(function (com) {
            if (com) {
                delete _comMap[comId];
            }
            return com;
        });
    } else {
        var defer = $q.defer();
        setTimeout(function () {
            defer.resolve(null);
        }, 5);
        return defer.promise;
    }
}

/**
 * 根据指定的算子和参数设置，加载所有引用到的算子。
 * @param com 算子对象，必须是Com类
 * @param setting 算子的参数设置对象
 * @param defer 递归调用时的promise对象
 * @returns {*} 如果已经加载了所有引用的算子，则返回true；否则返回promise对象。
 */
function loadRefComponents(template, setting, defer) {
    // if(!defer){
    //     defer=$q.defer();
    // }
    if (!template || !template.paramList || !setting) {
        defer = defer ? defer : $q.defer();
        setTimeout(function () {
            defer.resolve(false);
        }, 0);
        return defer.promise;
    }
    var refList = template.getParamValuesByType_New2(setting, ConfigConst.ComModel.Type_Component);
    var refComList = [];
    for (var i = 0; i < refList.length; i++) {
        //每个指向一个算子
        if (refList[i] && refList[i].componentId) {
            refComList.push({
                com: getComponent(refList[i].componentId),
                setting: refList[i]
            });
        }
    }
    for (var i = 0; i < refComList.length; i++) {
        var ref = refComList[i].com;
        if (ref.then && typeof(ref.then) == "function") {
            //ref是未加载的算子
            defer = defer ? defer : $q.defer();
            (function (idx) {
                ref.then(function (refcom) {
                    loadRefComponents(refcom, refComList[idx].setting, defer);
                });
            })(i);
            return defer.promise;
        } else if (ref instanceof ComClass.Com) {
            // ref是已加载的算子，此时需要递归检查其是否继续引用了其他算子
            var ref2 = loadRefComponents(ref, refComList[i].setting, defer);
            if (ref2.then && typeof(ref2.then) == "function") {
                //内部继续引用了未加载的算子
                defer = defer ? defer : $q.defer();
                (function (idx) {
                    ref2.then(function (refcom) {
                        loadRefComponents(refComList[idx].com, refComList[idx].setting, defer);
                    });
                })(i);
                return defer.promise;
            }
        }
    }
    //所有引用算子已加载，返回
    if (defer) {
        setTimeout(function () {
            defer.resolve(true);
        }, 0);
        return defer.promise;
    }
    return true;
}

/**
 * 为节点的参数设置界面重构参数模型
 * @param paramList
 * @param paramSetting
 * @returns {null}
 */
function makeValuedParams(paramList, paramSetting) {
    var obj = null;
    if (!paramSetting) obj = JSON.parse(paramSetting);
    var len = paramList.length;
    for (var i = 0; i < len; i++) {
        paramList[i].value = paramList[i].default;
        if (obj && obj[paramList[i].key]) paramList[i].value = obj[paramList[i].key];
    }
    return paramList;
}

/**
 * 获取和指定的图元参数模型相匹配的图例名称
 * @param paramList 图元参数模型对象
 * @returns {*} 同步返回包含图例名称的数组
 */
function getCaseNames(paramList) {
    if (!paramList) {
        return [];
    }
    return ChartCase.getCaseNames(md5.hex(angular.toJson(paramList)));
}

/**
 * 获取指定图例名称下的图元列表
 * @param name 图例名称
 * @returns {Array} 同步返回包含图元算子的列表
 */
function getCaseCharts(name) {
    if(!hasLoadLocalCom) {
        loadLocalCom();
        hasLoadLocalCom = true;
    }
    var result = {};
    var cases = ChartCase.getCases();
    for (var mark in cases) {
        if (mark && cases[mark]) {
            var chcases = cases[mark];
            for (var cn in chcases) {
                if (cn === name && chcases[cn]) {
                    var chartIds = chcases[cn];
                    for (var i = 0; i < chartIds.length; i++) {
                        //console.log(chartIds[i]);
                        var chart = _comMap[chartIds[i]];
                        if (chart) {
                            //过滤，仅保留最新版本的图元
                            if (!result[chart.sn]) {
                                result[chart.sn] = {};
                                result[chart.sn] = chart;
                            } else {
                                if (chart.version > result[chart.sn].version) {
                                    result[chart.sn] = chart;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    //转成数组
    var arr = [];
    for (var sn in result) {
        if (result[sn] && typeof(result[sn]) === "object") {
            arr.push(result[sn]);
        }
    }
    return arr;
}

/**
 * 查找判断指定的图例名称和图元参数模型是否有效
 * @param name 图例名称
 * @param paramList 图元参数模型
 * @returns {*|promise|jQuery.promise|d} 异步返回图例名称是否有效，true表示有效，false表示已被其他图元算子使用。
 */
function isCaseNameValid(name, paramList) {
    var defer = $q.defer();
    if (!name || !paramList) {
        setTimeout(function () {
            defer.resolve(false);
        }, 0);
        return defer.promise;
    }
    ChartCase.getMarkByCase(name).then(function (markList) {
        if (markList && Array.isArray(markList)) {
            if (markList.length > 0) {
                var mark = md5.hex(angular.toJson(paramList));
                if (markList.some(function (x) {
                        return x.mark != mark;
                    })) {
                    setTimeout(function () {
                        defer.resolve(false);
                    }, 0);
                } else {
                    setTimeout(function () {
                        defer.resolve(true);
                    }, 0);
                }
            } else {
                setTimeout(function () {
                    defer.resolve(true);
                }, 0);
            }
        } else {
            setTimeout(function () {
                defer.resolve(false);
            }, 0);
        }
    });
    return defer.promise;
}

/**
 * 新建视图展示节点的初始化联动子图对象
 * @param node 包含子图对象的节点
 * @returns {{edges: Array, nodes: Array}} 异步返回子图DAG对象
 */
function makeLinkageSubDag(node) {
    //子图包含虚拟数据输入节点和虚拟数据输出节点
    var inputCom = getComponentBySn(ConfigConst.ComLib.PresetComSN.SN_VirtualSourceCom);
    var outputCom = getComponentBySn(ConfigConst.ComLib.PresetComSN.SN_VirtualDestinationCom);
    var linkageCom= getComponentBySn(ConfigConst.ComLib.PresetComSN.SubDagView);
    var linkageDataCom= getComponentBySn(ConfigConst.ComLib.PresetComSN.LinkageSelectedData);
    var defer = $q.defer();
    var createDag = function (inCom, outCom, linkCom, dataCom,parent) {
        if (inCom instanceof ComClass.Com && outCom instanceof ComClass.Com && linkCom instanceof ComClass.Com) {
            //已获取所有算子
            var vInNode = {
                id: Utility.newNodeId(),
                componentId: inCom.id,
                w: 80,
                h: 86,
                left: 80,
                top: 80,
                displayName: "输入数据",
                imageUrl: inCom.bigIcon,
                state: ConfigConst.Flow.NodeState_Waiting,
                libarary: inCom,
                type: "necessary"
            };
            var vOutNode = {
                id: Utility.newNodeId(),
                componentId: outCom.id,
                w: 80,
                h: 86,
                left: 80,
                top: 320,
                displayName: "输出数据",
                imageUrl: inCom.bigIcon,
                state: ConfigConst.Flow.NodeState_Waiting,
                libarary: outCom,
                type: "necessary"
            };
            var vlinkageNode = {
                id: Utility.newNodeId(),
                componentId: linkCom.id,
                w: 80,
                h: 86,
                left: 80,
                top: 200,
                displayName: "原联动窗口",
                imageUrl: linkCom.bigIcon,
                state: ConfigConst.Flow.NodeState_Waiting,
                libarary: linkCom,
                type: "necessary"
            };
            var vlinkageDataNode = {
                id: Utility.newNodeId(),
                componentId: dataCom.id,
                w: 80,
                h: 86,
                left: 200,
                top: 80,
                displayName: "联动筛选数据",
                imageUrl: dataCom.bigIcon,
                state: ConfigConst.Flow.NodeState_Waiting,
                libarary: dataCom,
                type: "necessary"
            };
            if(parent && parent.paramSetting && parent.paramSetting.layout) {
                vlinkageNode.paramSetting = {
                    chartList: [],
                    layout: angular.copy(parent.paramSetting.layout)
                };
                angular.forEach(vlinkageNode.paramSetting.layout,function (x) {
                    vlinkageNode.paramSetting.chartList.push({
                        case:"",
                        chart:{},
                        layout:x.id
                    });
                });
            }
            setTimeout(function () {
                defer.resolve({
                    edges: [{source:vInNode.id,target:vlinkageDataNode.id}],
                    nodes: [vInNode,vlinkageDataNode, vlinkageNode, vOutNode],
                    ports: []
                });
            });
        }
    };
    if (inputCom instanceof ComClass.Com) {
        createDag(inputCom, outputCom,linkageCom,linkageDataCom, node);
    } else {
        inputCom.then(function (com) {
            inputCom = com;
            createDag(inputCom, outputCom,linkageCom,linkageDataCom, node);
        });
    }
    if (outputCom instanceof ComClass.Com) {
        createDag(inputCom, outputCom,linkageCom,linkageDataCom, node);
    } else {
        outputCom.then(function (com) {
            outputCom = com;
            createDag(inputCom, outputCom,linkageCom,linkageDataCom, node);
        });
    }
    if (linkageCom instanceof ComClass.Com) {
        createDag(inputCom, outputCom,linkageCom,linkageDataCom, node);
    } else {
        linkageCom.then(function (com) {
            linkageCom = com;
            createDag(inputCom, outputCom,linkageCom,linkageDataCom, node);
        });
    }
    if (linkageDataCom instanceof ComClass.Com) {
        createDag(inputCom, outputCom,linkageCom,linkageDataCom, node);
    } else {
        linkageDataCom.then(function (com) {
            linkageDataCom = com;
            createDag(inputCom, outputCom,linkageCom,linkageDataCom, node);
        });
    }
    return defer.promise;
}



//类定义

this.initiated = initiated;
this.getComponent = getComponent;
this.saveComponent = saveComponent;
this.deleteComponent = deleteComponent;
this.getComponents = getComponents;
this.getLastComponents = getLastComponents;
this.loadRefComponents = loadRefComponents;
this.lazyLoad = lazyLoad;
this.makeValuedParams = makeValuedParams;
this.getComponentBySn = getComponentBySn;
this.untilLastChartLoad = untilLastChartLoad;
this.makeLinkageSubDag=makeLinkageSubDag;
/*this.getCases = ChartCase.getCases;*/
this.getCaseNames = getCaseNames;
this.getCaseCharts = getCaseCharts;
this.isCaseNameValid = isCaseNameValid;
this.updateComMap=updateComMap;

function register() {
    //explorer.register(ConfigConst.DriverNames.Component, _self);
}

init();
register();
module.exports = this;
