const RestApi = require('../common/RestApi');
const ConfigConst =require('../common/ConfigConst');

//提示信息
function alertContent(message){
    console.log(message);
}
//常量定义

//变量定义
var _self = this;
var _initiated = false;

//全局函数定义
/*
 function getCategories(params){
 params = params || {};
 params.action = 'queryCategoryList.rest';
 //var date= new Date().getTime();
 //params.dte=date;
 //return _rest.save(params).$promise;
 var defer=$q.defer();
 _rest.save(params,{},function(result){
 if(result.result.status=="OK"){
 //规格化数据
 var data=[];
 if(result.data&&result.data.categoryList) {
 angular.forEach(result.data.categoryList, function (x) {
 data.push(db2Category(x));
 });
 }
 defer.resolve(data);
 }else{
 console.warn("ComStore执行%s时，REST返回异常：%o",params.action, result);
 defer.reject(result);
 }
 },function(error){
 console.warn("ComStore执行%s时，REST异常：%o",params.action, error);
 defer.reject(error);
 });
 return defer.promise;
 }
 function saveOrUpdateCategory(params) {
 params = category2DB(params);
 params.action = 'saveOrUpdateCategory.rest';
 //var date= new Date().getTime();
 //params.dte=date;
 var defer=$q.defer();
 //return _rest.save(params).$promise;
 _rest.save(params,{},function(result){
 if(result&&result.result&&result.result.status=="OK"){
 //保存正常
 if(result.data&&result.data.id) {
 defer.resolve(result.data);
 }else{
 console.warn("ComStore执行%s时，REST返回正常，但未获取返回结果：%o",params.action, result);
 defer.reject(result);
 }
 }else{
 //保存异常
 console.warn("ComStore执行%s时，REST返回异常：%o",params.action, result);
 defer.reject(result);
 }
 },function(error){
 console.warn("ComStore执行%s时，REST异常：%o",params.action, error);
 defer.reject(error);
 });
 return defer.promise;
 }
 function deleteCategory(params) {
 params = category2DB(params);
 params = params || {};
 params.action = 'deleteCategoryById.rest';
 var date= new Date().getTime();
 params.dte=date;
 //return _rest.save(params).$promise;
 var defer=$q.defer();
 _rest.save(params,{},function(result){
 if(result&&result.result&&result.result.status=="OK"){
 //删除正常
 defer.resolve();
 }else{
 //删除异常
 console.warn("ComStore执行%s时，REST返回异常：%o",params.action, result);
 defer.reject(result);
 }
 },function(error){
 console.warn("ComStore执行%s时，REST异常：%o",params.action, error);
 defer.reject(error);
 });
 return defer.promise;
 }
 function getComponents_Old (params) {
 params = params || {};
 params.action = 'queryComponentLibraryList.rest';
 //var date= new Date().getTime();
 //params.dte=date;
 //return _rest.save(params).$promise;
 var defer=$q.defer();
 _rest.save(params,{},function(result){
 if (result && result.result.status === 'OK') {
 //规格化数据
 var data=[];
 var comList = result.data.componentLibraryList;
 angular.forEach(comList,function(oriCom){
 data.push(db2Com(oriCom));
 });
 defer.resolve(data);
 }else{
 console.warn("ComStore执行%s时，REST返回异常：%o",params.action, result);
 defer.reject(result);
 }
 },function(error){
 console.warn("ComStore执行%s时，REST异常：%o",params.action, error);
 defer.reject(error);
 });
 return defer.promise;
 }
 function getComponentCategories (params) {
 params = params || {};
 params.action = 'queryComponentLibraryList.rest';
 var date= new Date().getTime();
 params.dte=date;
 return _rest.save(params).$promise;
 }
 function getComponentJson(url){
 var defer=$q.defer();
 $http.get(url).success(function(data){defer.resolve(data);}).error(function(error){
 console.warn("ComStore下载%s时，异常：%o",url, error);
 defer.reject(error);
 });
 return defer.promise;
 }
 function saveComponent_Old(com){}
 function saveComponentJson(url, json){}
 */
function getComponents(param) {
    var action = ConfigConst.Framework.RestAction.GetComList;
    return RestApi.do(action, param).then(function(result) {
        if(result && result.result.status === 'OK' && result.data) {
            //规格化数据
            var data = [];
            var comList = result.data.componentLibraryList;
            angular.forEach(comList, function(oriCom) {
                data.push(db2Com(oriCom));
            });
            return data;
        } else {
            var str = "ComStore执行" + action + "时，REST返回异常：" + result;
            console.warn("ComStore执行%s时，REST返回异常：%o", action, result);
            alertContent(result.result.message);
            return str;
        }
    }, function(error) {
        var str = "ComStore执行" + action + "时，REST异常：" + error;
        console.warn("ComStore执行%s时，REST异常：%o", action, error);
        return str;
    });
}

function getComponentTemplate(comId) {
    var action = ConfigConst.Framework.RestAction.GetComTemplate;
    return RestApi.do(action, {
        component: {
            id: comId
        }
    }).then(function(result) {
        if(result && result.result.status === "OK" && result.data) {
            //解析template
            //if(com.template){
            //    com.template.read(result.data.template);
            //}
            result.data.comId=comId;
            return result.data;
        } else {
            var str = "ComStore执行" + action + "时，REST返回异常：" + result;
            console.warn("ComStore执行%s时，REST返回异常：%o", action, result);
            alertContent(result.result.message);
            return null;
        }
    }, function(error) {
        var str = "ComStore执行" + action + "时，REST异常：" + error;
        console.warn("ComStore执行%s时，REST异常：%o", action, error);
        return null;
    });
}

function getComponent(comId) {
    var action = ConfigConst.Framework.RestAction.GetComById;
    return RestApi.do(action, {
        component: {
            id: comId
        }
    }).then(function(result) {
        if(result && result.result.status === 'OK' && result.data) {
            //规格化数据
            var com = db2Com(result.data.component);
            com.template = result.data.template;
            return com;
        } else {
            var str = "ComStore执行" + action + "时，REST返回异常：" + result;
            console.warn("ComStore执行%s时，REST返回异常：%o", action, result);
            alertContent(result.result.message);
            return str;
        }
    }, function(error) {
        var str = "ComStore执行" + action + "时，REST异常：" + error;
        console.warn("ComStore执行%s时，REST异常：%o", action, error);
        return str;
    });
}

function saveComponent(com) {
    var isNew = true;
    if(com.id) {
        isNew = false;
    } else {
        isNew = true;
    }
    var action = ConfigConst.Framework.RestAction.SaveCom;
    return RestApi.do(action, {
        component: com2DB(com)
    }).then(function(result) {
        if(result && result.result.status === "OK") {
            //检查算子模板是否需要更新
            if(com.template) {
                if(result.data.id) {
                    com.id = result.data.id;
                    com.sn = result.data.sn;
                    com.updateTime = result.data.updateTime;
                    com.createTime = result.data.createTime;
                }

                var newTempl = com.template.write(com.template);
                //更新模板
                action = ConfigConst.Framework.RestAction.SaveComTemplate;
                return RestApi.do(action, {
                    component: {
                        id: com.id,
                        template: newTempl,
                        isnew: isNew
                    }
                }).then(function(result) {
                    if(result && result.result.status === "OK") {
                        //更新模板成功
                        // com.template=newTempl;
                        return com;
                    } else {
                        var str = "ComStore执行" + action + "时，REST返回异常：" + result;
                        console.warn("ComStore执行%s时，REST返回异常：%o", action, result);
                        alertContent(result.result.message);
                        return result;
                    }
                }, function(error) {
                    var str = "ComStore执行" + action + "时，REST异常：" + error;
                    console.warn("ComStore执行%s时，REST异常：%o", action, error);
                    return error;
                });
            }
            return com;
        } else {
            var str = "ComStore执行" + action + "时，REST返回异常：" + result;
            console.warn("ComStore执行%s时，REST返回异常：%o", action, result);
            alertContent(result.result.message);
            return result;
        }
    }, function(error) {
        var str = "ComStore执行" + action + "时，REST异常：" + error;
        console.warn("ComStore执行%s时，REST异常：%o", action, error);
        return error;
    });
}

function deleteComponent(comId,userId) {
    var action = ConfigConst.Framework.RestAction.DeleteCom;
    return RestApi.do(action, {
        component: {
            id: comId,
            userId:userId
        }
    }).then(function(result) {
        if(result && result.result.status === "OK") {
            return comId;
        } else {
            var str = "ComStore执行" + action + "时，REST返回异常：" + result;
            console.warn("ComStore执行%s时，REST返回异常：%o", action, result);
            alertContent(result.result.message);
            return result;
        }
    }, function(error) {
        var str = "ComStore执行" + action + "时，REST异常：" + error;
        console.warn("ComStore执行%s时，REST异常：%o", action, error);
        return error;
    });
}

function getComponentBySn(sn) {
    var action=ConfigConst.Framework.RestAction.GetComBySn;
    return RestApi.do(action,{component:{sn:sn}}).then(function (result) {
        if(result && result.result.status === 'OK' && result.data) {
            //规格化数据
            var data = [];
            var comList = result.data.componentLibraryList;
            angular.forEach(comList, function(oriCom) {
                data.push(db2Com(oriCom));
            });
            return data;
        } else {
            var str = "ComStore执行" + action + "时，REST返回异常：" + result;
            console.warn("ComStore执行%s时，REST返回异常：%o", action, result);
            alertContent(result.result.message);
            return str;
        }
    },function (error) {
        var str = "ComStore执行" + action + "时，REST异常：" + error;
        console.warn("ComStore执行%s时，REST异常：%o", action, error);
        return str;
    });
}

//数据对象归一化
function db2Category(db) {
    return db;
}

function category2DB(obj) {
    return obj;
}

function db2Com_Old(db) {
    var obj = {};
    obj.id = db.componentID;
    obj.name = db.componentName;
    obj.comment = db.comment;
    obj.author = db.author;
    obj.category = db.categoryId;
    obj.type = db.componentType;
    obj.icon = db.icon;
    obj.image = db.image;
    obj.toolTip = db.toolTips;
    obj.toolTipImageUrl = db.toolUrl;
    obj.jsonUrl = db.jsonUrl;
    obj.package = db.package;
    return obj;
}

function com2DB_Old(obj) {
    var db = {};
    db.componentID = obj.id;
    db.componentName = obj.name;
    db.comment = obj.comment;
    db.author = obj.author;
    db.categoryId = obj.category;
    db.componentType = obj.type;
    db.icon = obj.icon;
    db.image = obj.image;
    db.toolTips = obj.toolTip;
    db.toolUrl = obj.toolTipImageUrl;
    db.jsonUrl = obj.jsonUrl;
    db.package = obj.package;
    return db;
}

function db2Com(db) {
    var obj = {};
    obj.id = db.id;
    obj.name = db.name;
    obj.sn = db.sn;
    obj.type = db.type;
    obj.comment = db.comment;
    obj.version = 1;
    try {
        obj.version = parseInt(db.version);
    } catch (ex) {
        console.error("ComStore.db2Com转换version异常：%s", ex);
    }
    obj.createUser = db.createUser;
    //          obj.createTime = Utility.parseDate(db.createTime);
    obj.updateUser = db.updateUser;
    //          obj.updateTime = Utility.parseDate(db.updateTime);
    try {
        obj.authority = db.authority;
    } catch (ex) {
        console.error("ComStore.db2Com转换authority异常：%s", ex);
    }
    if (!obj.authority || isNaN(obj.authority)) {
        obj.authority = 0;
    }
    obj.smallIcon = db.smallIcon;
    obj.bigIcon = db.bigIcon;
    obj.tip = db.tip;
    obj.tipIcon = db.tipIcon;
    obj.categoryId = db.categoryId; //临时使用，未来将取消
    if(db.template){
        obj.template=db.template;
    }
    obj.svnVersion = db.svnVersion;
    return obj;
}

function com2DB(obj) {
    var db = {};
    db.id = obj.id;
    db.name = obj.name;
    db.sn = obj.sn;
    db.type = obj.type;
    db.comment = obj.comment;
    db.version = obj.version;
    db.createUser = obj.createUser;
    db.createTime = obj.createTime;
    db.updateUser = obj.updateUser;
    db.updateTime = obj.updateTime;
    db.authority = obj.authority;
    db.smallIcon = obj.smallIcon;
    db.bigIcon = obj.bigIcon;
    db.tip = obj.tip;
    db.tipIcon = obj.tipIcon;
    db.categoryId = obj.categoryId; //临时使用，未来将取消
    db.userId = obj.userId;
    db.file = obj.file;
    db.operType = obj.operType;
    db.overwrite = obj.overwrite;
    db.svnVersion = obj.svnVersion;
    db.currentSvnVersion = obj.currentSvnVersion;
    return db;
}

//类定义

//服务代码
// this.getCategories=getCategories;
// this.saveOrUpdateCategory=saveOrUpdateCategory;
// this.deleteCategory=deleteCategory;
// this.getComponents=getComponents;
// this.getComponentCategories=getComponentCategories;
// this.getComponentJson=getComponentJson;
// this.saveComponentJson=saveComponentJson;

this.getComponents = getComponents;
this.getComponentTemplate = getComponentTemplate;
this.getComponent = getComponent;
this.saveComponent = saveComponent;
this.deleteComponent = deleteComponent;
this.getComponentBySn=getComponentBySn;
module.exports = this;

