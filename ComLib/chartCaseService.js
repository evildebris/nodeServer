const $q = require('../common/$q');
const RestApi = require('../common/RestApi');
const ConfigConst =require('../common/ConfigConst');
//变量定义
var _self = this;
var _chartMap={};
var _initiated=false;
/**
 *  去重
 * @param isStrict
 * @returns {*}
 */
Array.prototype.unique = function (isStrict) {
    if (this.length < 2)
        return [this[0]] || [];
    var tempObj = {}, newArr = [];
    for (var i = 0; i < this.length; i++) {
        var v = this[i];
        var condition = isStrict ? (typeof tempObj[v] != typeof v) : false;
        if ((typeof tempObj[v] == "undefined") || condition) {
            tempObj[v] = v;
            newArr.push(v);
        }
    }
    return newArr;
}
/**
 * 获取图元列表信息
 */
function getCases(){
    return _chartMap;
}


/**
 * 新增或者编辑图元信息
 * @param param
 * @returns {*}
 */
function updateCase(chartId,name,caseMark){
    var defer = $q.defer();
    var self=this;
    var action = ConfigConst.Framework.RestAction.updateCase;
    if(name==null||name==""){
        action= ConfigConst.Framework.RestAction.deleteCase;
        RestApi.do(action,{"id":chartId}).then(function (result) {
            if (result && result.result.status === 'OK') {
                _self.refreshCases();
                defer.resolve(true);
            } else {
                var str = "ComStore执行" + action + "时，REST返回异常：" + result;
                console.warn("ComStore执行%s时，REST返回异常：%o", action, result);
                defer.reject(str);
            }
        }, function (error) {
            var str = "updateCase" + action + "时，REST异常：" + error;
            console.warn("listCase%s时，REST异常：%o", action, error);
            defer.reject(str);
        });
    }else{
        var param=null;
        if(chartId!=null){
            param={id:chartId,name:name,mark:caseMark}
        }else{
            param={name:name,mark:caseMark}
        }
        RestApi.do(action,param).then(function (result) {
            if (result && result.result.status === 'OK') {
                _self.refreshCases();
                defer.resolve(true);
            } else {
                var str = "ComStore执行" + action + "时，REST返回异常：" + result;
                console.warn("ComStore执行%s时，REST返回异常：%o", action, result);
                defer.reject(str);
            }
        }, function (error) {
            var str = "updateCase" + action + "时，REST异常：" + error;
            console.warn("listCase%s时，REST异常：%o", action, error);
            defer.reject(str);
        });
    }
    return defer.promise;
}

/**
 * 初始方法
 */
function init(){
    var action = ConfigConst.Framework.RestAction.listCase;
    RestApi.do(action,null).then(function (result) {
        if (result && result.result.status === 'OK') {
            //规格化数据
            var data = {};
            var cases=result.data.ChartCases;
            angular.forEach(cases,function(chart){
                if(_chartMap[chart.mark]){
                    if(_chartMap[chart.mark][chart.name]){
                        var chartIds=_chartMap[chart.mark][chart.name];
                        chartIds.push(chart.id);
                        chartIds=chartIds.unique();
                        _chartMap[chart.mark] = {};
                        _chartMap[chart.mark][chart.name]= chartIds;
                    }else{
                        _chartMap[chart.mark][chart.name]=[chart.id];
                    }
                }else{
                    _chartMap[chart.mark] = {};
                    _chartMap[chart.mark][chart.name]=[chart.id];
                }
            });
            _initiated = true;
            //console.log(_chartMap);
        } else {
            var str = "ComStore执行" + action + "时，REST返回异常：" + result;
            console.warn("ComStore执行%s时，REST返回异常：%o", action, result);
        }
    }, function (error) {
        var str = "listCase" + action + "时，REST异常：" + error;
        console.warn("listCase%s时，REST异常：%o", action, error);
    });
};
function initiated(){
    return _initiated;
}

/**
 *
 *
 * @param caseMark
 * @returns {Array} 查找图例库对象中具有相同caseMark的所有name列表
 */
function getCaseNames(caseMark){
    var names=[];
    if(_chartMap){
        if(_chartMap[caseMark]){
            for(var name in _chartMap[caseMark]){
                names.push(name);
            }
        }
    }
    return names;
}
init();

/**
 * 获取最新图元数据
 * @returns {*}
 */
function refreshCases(){
    var defer = $q.defer();
    var action = ConfigConst.Framework.RestAction.listCase;
    RestApi.do(action,null).then(function (result) {
        if (result && result.result.status === 'OK') {
            //规格化数据
            var cases=result.data.ChartCases;
            _chartMap={}
            angular.forEach(cases,function(chart){
                if(_chartMap[chart.mark]){
                    if(_chartMap[chart.mark][chart.name]){
                        var chartIds=_chartMap[chart.mark][chart.name];
                        chartIds.push(chart.id);
                        chartIds=chartIds.unique();
                        _chartMap[chart.mark] = {};
                        _chartMap[chart.mark][chart.name]=chartIds;
                    }else{
                        _chartMap[chart.mark][chart.name]=[chart.id];
                    }
                }else{
                    _chartMap[chart.mark] = {};
                    _chartMap[chart.mark][chart.name] = [chart.id];
                }
            });
            defer.resolve(_chartMap);
        } else {
            var str = "ComStore执行" + action + "时，REST返回异常：" + result;
            console.warn("ComStore执行%s时，REST返回异常：%o", action, result);
        }
    }, function (error) {
        var str = "listCase" + action + "时，REST异常：" + error;
        console.warn("listCase%s时，REST异常：%o", action, error);
    });
    return defer.promise;
}

/**
 *
 * @param name 图例名称
 * @returns {*|promise.promise|jQuery.promise|r.promise|promise}
 */
function getMarkByCase(name){
    var defer = $q.defer();
    var action = ConfigConst.Framework.RestAction.getMark;
    RestApi.do(action,{name:name}).then(function (result) {
        if (result && result.result.status === 'OK') {
            var cases=result.data.ChartCases;
            defer.resolve(cases);
        } else {
            var str = "RestApi" + action + "时，REST返回异常：" + result;
            console.warn("RestApi%s时，REST返回异常：%o", action, result);
        }
    }, function (error) {
        var str = "getMarkByCase" + action + "时，REST异常：" + error;
        console.warn("getMarkByCase%s时，REST异常：%o", action, error);
    });
    return defer.promise;
}
initiated();
function refresh() {
    if(initiated){
        refreshCases();
    }else {
        init();
    }
}
_self.getMarkByCase=getMarkByCase;
_self.getCases=getCases;
_self.refreshCases=refreshCases;
_self.initiated=initiated;
_self.updateCase=updateCase;
_self.refresh=refresh;
_self.getCaseNames=getCaseNames;
module.exports = _self;

