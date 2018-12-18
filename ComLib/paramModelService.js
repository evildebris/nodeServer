const $q = require('../common/$q');
var _model = {};
var _diagram =  null;
function  extend(o,n){
    for(p in n){
        o[p] = n[p];
    }
}
var setParamModel=function(type,data){
    //_model = data;
    _model[type] = data;
};
module.exports ={
    setParamModel:setParamModel,
    getParamModel:function(){
        return _model;
    },
    designParamModel:function(data){
        if(_model[data.type])
            var model = angular.copy(_model[data.type]);
        if(model){
            model.name = data.name;
            extend(model,{checked:false,linkageObj:null});
        }
        return model;
    },
    assignParamModel:function(param){
        var model = angular.copy(_model[param.type]);
        model.name = param.displayName;
        angular.forEach(model.paramList,function(item){
            if(param[item.key]){
                item.cvalue = param[item.key];
            }
        });
        angular.extend(model,{checked:true,linkageObj:param.linkageObj});
        return model;
    },
    setDiagramList:function(diagram){
        _diagram = diagram;
    },
    getDiagramList:function(){
        return _diagram;
    },
    deleteDiagramByName:function(name){
        for(var i = 0; i < _diagram.length;i++){
            if(_diagram[i] == name){
                _diagram.splice(i,1);
            }
        }
    },
    getModelFirstValueByType: function (model, ptype) {
        if(!model) return null;

        var paramTemplate=null;
        if(model.type){
            paramTemplate=_model[model.type];
        }
        if(model.modelList){
            paramTemplate=_model[model.modelList[0].type];
        }
        if(paramTemplate==null){
            return null;
        }
        if(paramTemplate) {
            var subClass= paramTemplate.subclass;
            if(!subClass){
                return null;
            }
            var paramList=null;
            for(var x=0;x<subClass.length;x++){
                if(model.type){
                    if(model.subType){
                        if(model.subType==subClass[x].type){
                            paramList=subClass[x].paramList;
                        }
                    }else{
                        if(model.type==subClass[x].type){
                            paramList=subClass[x].paramList;
                        }
                    }
                }
                if(model.modelList){
                    if(model.modelList[0].subType==subClass[x].type){
                        paramList=subClass[x].paramList;
                    }
                }
            }
            if(paramList==null){
                return null;
            }else{
                for (var i = 0; i < paramList.length; i++) {
                    var p = paramList[i];
                    if (p.ptype == ptype) {
                        return model[p.key];
                    }
                }
            }
        }
        return null;
    },
    getModelValuesByType: function (model, ptype) {
        var pList=null;
        if(_model[model.type]&&_model[model.type].subclass){
            pList =_model[model.type].subclass;
        }else{
            pList =_model[model.type];
        }
        var paramTemplate = null;
        angular.forEach(pList,function(item){
            if(item.type == model.subType){
                paramTemplate = item;
            }
        });
        var result={};
        if(paramTemplate) {
            if(paramTemplate.paramList){
                for (var i = 0; i < paramTemplate.paramList.length; i++) {
                    var p = paramTemplate.paramList[i];
                    if (p.ptype == ptype) {
                        result[p.key]= model[p.key];
                    }
                }
            }

        }
        return result;
    },
    refreshParamModel: {}
}
