const $q = require('../common/$q');
const ConfigConst =require('../common/ConfigConst');
const $http = require('../common/$http');
const $cache = require('../common/$cache');
const loginService = require('../login/login.service');
const RestApi = require('../common/restApi');
const WsMessenger = require('./WsMessenger');

const $scope = {};
//获取所有用户
function getAllNotebook() {
    var defer = $q.defer();
    $http.get(WsMessenger.getApiUrl() + '/notebook').
    success(function(data, status, headers, config) {
        defer.resolve(data);
    }).
    error(function(data, status, headers, config) {
        //console.log('Error %o %o', status, data.message);
        defer.resolve(data);
    });
    return defer.promise;
}

//获取绑定信息
function getInterpreterBundle(id) {
    var defer = $q.defer();
    $http.get(WsMessenger.getApiUrl() + '/interpreter/bind/' + id).
    success(function(data, status, headers, config) {
        defer.resolve(data);
    }).
    error(function(data, status, headers, config) {
        //console.log('Error %o %o', status, data.message);
        defer.resolve(data);
    });
    return defer.promise;
}

//获取用户信息
function getNotebook(id) {
    var defer = $q.defer();
    $http.get(WsMessenger.getApiUrl() + '/notebook/' + id + '/permissions').
    success(function(data, status, headers, config) {
        defer.resolve(data);
    }).
    error(function(data, status, headers, config) {
        //console.log('Error %o %o', status, data.message);
        defer.resolve(data);
    });
    return defer.promise;
}

//获取所有资源
function getAllInterpreter1() {
    var defer = $q.defer();

    if($cache.get('setting') == undefined) {
        $http.get(WsMessenger.getApiUrl() + '/interpreter/setting').
        success(function(data) {
            $cache.put('setting', data);
            defer.resolve(data.body);
        }).
        error(function(data) {
            //console.log('Error %o %o', status, data.message);
            defer.resolve(data);
        });
        return defer.promise;
    } else {
        defer.resolve($cache.get('setting').body);
    }
    return defer.promise;
}

//分配选择的资源给当前的用户
function setInterpreterToUser(data) {
    var defer = $q.defer();
    defer.resolve(data);

    return defer.promise;
}

//保存用户资源
function saveUserResource(param) {
    var defer = $q.defer();
    var action = ConfigConst.Framework.RestAction.saveUserResource;
    RestApi.do(action, param).then(function(result) {
        if(result && result.result.status === 'OK' && result.data) {

            defer.resolve(result);
        } else {
            var str = "uploadService执行" + action + "时，REST返回异常：" + result;
            //console.warn("uploadService%s时，REST返回异常：%o", action, result);
            defer.reject(str);
        }
    }, function(error) {
        var str = "copyItem" + action + "时，REST异常：" + error;
        //console.warn("getFiles%s时，REST异常：%o", action, error);
        defer.reject(str);
    });
    return defer.promise;
}

//编辑用户资源 updateUserResource: "updateUserResource.rest",
function updateUserResource(param) {
    var defer = $q.defer();
    var action = ConfigConst.Framework.RestAction.updateUserResource;
    RestApi.do(action, param).then(function(result) {
        if(result && result.result.status === 'OK' && result.data) {

            defer.resolve(result);
        } else {
            var str = "uploadService执行" + action + "时，REST返回异常：" + result;
            defer.reject(str);
        }
    }, function(error) {
        var str = "copyItem" + action + "时，REST异常：" + error;
        defer.reject(str);
    });
    return defer.promise;
}

function alertContents(data) {
    console.log(data);
}

//清空工作区  add tanglvshuang 2018.3.29
function clearWorkspace(isAlert,call,backText,confirmText){
    $scope.call=call;
    var inter=selectSource;
    var param = { "noteId":"" };
    $scope.backText=backText;
    $scope.confirmText=confirmText;
    $http({
        method: 'put',
        data: param,
        url: WsMessenger.getApiUrl() + '/interpreter/setting/restart/' + inter.id
    }).success(function (data, status, headers, config) {
        alertContents("清空工作区成功!");
    }).error(function (data, status, headers, config) {
        if (data.message) {
            alertContents(data.message);
        } else {
            alertContents("服务器响应失效!");
        }
    });
}

//退出系统 add taoyahui 2018.4.18
function newSignOut(isAlert,call){
    $scope.flag=false;
    var param = { "noteId":"" };
    if(isAlert){
        var curuser=loginService.getCookies();//当前用户.userName
        getUserInterpreter(curuser).then(function(m) {
            angular.forEach(m,function (item) {
                $http({
                    method: 'put',
                    data: param,
                    url: WsMessenger.getApiUrl() + '/interpreter/setting/restart/' + item.id
                })
            })
        });
        call();
    }
}

//查询用户资源列表 getUserResourceList: "getUserResourceList.rest",
function getUserResourceList(param) {
    var defer = $q.defer();
    var action = ConfigConst.Framework.RestAction.getUserResourceList;

    RestApi.do(action,param).then(function(result) {
        if(result && result.result.status === 'OK' && result.data) {

            defer.resolve(result);
        } else {
            var str = "uploadService执行" + action + "时，REST返回异常：" + result;
            //console.warn("uploadService%s时，REST返回异常：%o", action, result);
            defer.reject(str);
        }
    }, function(error) {
        var str = "copyItem" + action + "时，REST异常：" + error;
        //console.warn("getFiles%s时，REST异常：%o", action, error);
        defer.reject(str);
    });
    return defer.promise;
}

//查询对于用户下的所有资源
function getResourceListByUser(user) {
    var defer = $q.defer();
    var arr = [];
    var param ={};
    var usrMsg=loginService.getCookies();
    if(!(user&& user.userName)){
        param = {
            'user':usrMsg.userName
        };
    }else{
        param  = {
            'user':user.userName
        }
    }
    getUserResourceList(param).then(function(data) {
        angular.forEach(data.data.vos, function(m) {
            if(m.user == user.userName) {
                var defalute = {
                    "interpreter": m.interpreter,
                    "default": m._default,
                    "checked": false,
                    "bandingId": m.id
                }
                if(m._default == "1") {
                    defalute.checked = true;
                }
                arr.push(defalute);
            }
        });
        defer.resolve(arr);
        return defer.promise;
    });
    return defer.promise;
}

//删除用户资源 deleteUserResource: "deleteUserResource.rest",
function deleteUserResource(param) {
    var defer = $q.defer();
    var action = ConfigConst.Framework.RestAction.deleteUserResource;
    RestApi.do(action, param).then(function(result) {
        if(result && result.result.status === 'OK' && result.data) {

            defer.resolve(result);
        } else {
            var str = "uploadService执行" + action + "时，REST返回异常：" + result;
            //console.warn("uploadService%s时，REST返回异常：%o", action, result);
            defer.reject(str);
        }
    }, function(error) {
        var str = "copyItem" + action + "时，REST异常：" + error;
        //console.warn("getFiles%s时，REST异常：%o", action, error);
        defer.reject(str);
    });
    return defer.promise;
}

//通过id查询资源详情 getUserResourceByParam: "getUserResourceByParam.rest",
function getUserResourceByParam(param) {
    var defer = $q.defer();
    var action = ConfigConst.Framework.RestAction.getUserResourceByParam;
    RestApi.do(action, param).then(function(result) {
        if(result && result.result.status === 'OK' && result.data) {
            defer.resolve(result);
        } else {
            var str = "uploadService执行" + action + "时，REST返回异常：" + result;
            //console.warn("uploadService%s时，REST返回异常：%o", action, result);
            defer.reject(str);
        }
    }, function(error) {
        var str = "copyItem" + action + "时，REST异常：" + error;
        //console.warn("getFiles%s时，REST异常：%o", action, error);
        defer.reject(str);
    });
    return defer.promise;
}

//获取指定用户下绑定的资源,其中default值为1表示默认资源
var interpreterLists;
function getUserInterpreter(user) {
    var defer = $q.defer();
    var arr = [];
    var interpreterList = [];
    var param ={};
    var usrMsg=loginService.getCookies();
    if(!(user&& user.userName)){
        param = {
            'user':usrMsg.userName
        };
        //add tanglvshuang 2018.1.24 未传
        user={
            userName:usrMsg.userName
        }
    }else{
        param  = {
            'user':user.userName
        }
    }
    getUserResourceList(param).then(function(data) {
        angular.forEach(data.data.vos, function(m) {
            if(m.user == user.userName) {
                var defalute = {
                    "interpreter": m.interpreter,
                    "default": m._default,
                    "checked": false,
                    "bandingId": m.id
                };
                if(m._default == "1") {
                    defalute.checked = true;
                }
                angular.forEach(arr, function(pp) {
                    if(m.interpreter == pp.interpreter){
                        //code...
                    }
                });
                arr.push(defalute);
            }
        });

        //去重处理
        function unique(arr) {
            var arr2 = arr.sort();
            var res = [arr2[0]];
            for(var i = 1; i < arr2.length; i++) {
                if(arr2[i].interpreter !== res[res.length - 1].interpreter) {
                    res.push(arr2[i]);
                }
            }
            return res;
        }
        var tmp = unique(arr);
        arr = tmp;
        getAllInterpreter1().then(function(inters) {
            interpreterLists = inters;
            angular.forEach(interpreterLists, function(q) {
                q.isband = false;
                if(arr[0]) {
                    angular.forEach(arr, function(p) {
                        if(p.interpreter == q.name) {
                            q.default = p.default;
                            q.checked = p.checked;
                            q.bandingId = p.bandingId;
                            q.isband = true;
                            interpreterList.push(q);
                        }
                    });
                }
            });
            defer.resolve(interpreterList);
        });

    });
    return defer.promise;
}

//获取指定用户下未绑定的资源
function getUserUnInterpreter() {
    var defer = $q.defer();
    var noBand = [];
    angular.forEach(interpreterLists, function(mm) {
        if(mm.isband === false) {
            mm.checked = false;
            mm.default = "0";
            noBand.push(mm);
        }
    });
    defer.resolve(noBand);

    return defer.promise;
}

//获取选中的用户执行资源 add tanglvshuang 2018.1.24 start
var selectSource = null;
function setSelectSource(s){
    selectSource=s;
}
function getSelectSource(){
    return selectSource;
}

module.exports = {
    getSelectSource: getSelectSource,
    setSelectSource: setSelectSource,
    getAllNotebook: getAllNotebook,
    getInterpreterBundle: getInterpreterBundle,
    getAllInterpreter1: getAllInterpreter1,
    setInterpreterToUser: setInterpreterToUser,
    getNotebook: getNotebook,
    saveUserResource: saveUserResource,
    updateUserResource: updateUserResource,
    getUserResourceList: getUserResourceList,
    deleteUserResource: deleteUserResource,
    getUserResourceByParam: getUserResourceByParam,
    getUserInterpreter: getUserInterpreter,
    getUserUnInterpreter: getUserUnInterpreter,
    getResourceListByUser: getResourceListByUser,
    clearWorkspace:clearWorkspace,
    newSignOut:newSignOut
};
