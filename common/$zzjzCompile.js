/**
 * @author cai.liao
 * @description 封装schedule脚本使用的编译方法，目前只支持简单的循环和分支编译
 * 外部引用三方插件fast-xml-parser修改了部分源码
 * */
const fastXmlParser = require('../lib/_fast-xml-parser@3.11.1@fast-xml-parser/src/parser');
const testScript = 'import com.zzjz.deepinsight.util._\r\nimport org.apache.spark.sql.{ DataFrame, Row }\r\n<#zzjzRepeat=\"tb in zzjzParam.tables\"#>val srcRdd<#$index#> = inputRDDs(\"<#tb.inputTableName#>\").asInstanceOf[org.apache.spark.sql.DataFrame]\r\n<#zzjzIf=\"tb.rows.length==0\"#>val selectedDF<#$index#> = DataSelectUtil.dataSelected(srcRdd<#$index#>,None<#zzjzRepeat=\"col in tb.cols\"#>,\"<#col.col#>\"<#/zzjzRepeat#>)<#/zzjzIf#>\r\n<#zzjzIf=\"tb.rows.length>0\"#>val selectedDF<#$index#> = DataSelectUtil.dataSelected(srcRdd<#$index#>,Some(Array(<#zzjzRepeat=\"row in tb.rows\"#><#row.row#><#zzjzIf=\"!$last\"#>,<#/zzjzIf#><#/zzjzRepeat#>))<#zzjzRepeat=\"col in tb.cols\"#>,\"<#col.col#>\"<#/zzjzRepeat#>)<#/zzjzIf#>\r\noutputRDD(\"视图筛选数据源_1_TJoHSwkl_<#$index#>\",selectedDF<#$index#>)\r\nselectedDF<#$index#>.registerTempTable(\"视图筛选数据源_1_TJoHSwkl_<#$index#>\")\r\nprintln(\"输出：<#tb.inputTableName#>\")\r\n<#/zzjzRepeat#>';
const testZZJZParam ={"tables":[{"inputTableName":"关系型数据库_1_LvU7bRaf","rows":[{"row":3374,"$$hashKey":"object:9466"},{"row":3375,"$$hashKey":"object:9467"}],"cols":[{"col":"id","$$hashKey":"object:9472"},{"col":"age","$$hashKey":"object:9473"},{"col":"job","$$hashKey":"object:9474"},{"col":"marital","$$hashKey":"object:9475"},{"col":"education","$$hashKey":"object:9476"},{"col":"balance","$$hashKey":"object:9477"}],"$$hashKey":"object:9460"}],"RERUNNING":{"rerun":"true","preNodes":[{"checked":true,"id":"关系型数据库_1_LvU7bRaf"}],"nodeName":"视图筛选数据源_1"}};
const testScript2=`<#zzjzIf="tb.rows.length==0"#>val selectedDF<#$index#> = DataSelectUtil.dataSelected(srcRdd<#$index#>,None<#zzjzRepeat="col in tb.cols"#>,"<#col.col#>"<#/zzjzRepeat#>)<#/zzjzIf#>
<#zzjzIf="tb.rows.length>0"#>val selectedDF<#$index#> = DataSelectUtil.dataSelected(srcRdd<#$index#>,Some(Array(<#zzjzRepeat="row in tb.rows"#><#row.row#><#zzjzIf="!$last"#>,<#/zzjzIf#>`;
const ZZJZ_IfREG = /(<#)\/?zzjzIf(=)?([^#]*)(#>)/g;
const ZZJZ_RepeatREG = /(<#)\/?zzjzRepeat(=)?[^#]*(#>)/g;
const WORD_PRE = "@ss@";
const WORD_NXT = "@ee@";
const WORD_REG=/@ss@(((?!@ee@).)*)@ee@/g;
const DIRECTIVE_REPEAT=/_@_zzjzRepeat_@_/g;
const DIRECTIVE_IF=/_@_zzjzIf_@_/g;

function createChildScopeClass(parent){
    function ChildScope(object) {
        Object.assign(this,object);
    }
    ChildScope.prototype = parent;
    return ChildScope;
}
function evalScope(val,scope) {
    //添加全局变量
    for(let tempName in scope){
         global[tempName] = scope[tempName];
    }
    if(val.indexOf("_Gt_")>-1){
        val = val.replace(/_Gt_/g,">");
    }
    if(val.indexOf("_Lt_")>-1){
        val = val.replace(/_Lt_/g,"<");
    }
    let result =eval(val);
    //删除全局变量
    for(let tempName in scope){
        delete global[tempName];
    }
    return result||"";
}
function parseIf(directive,scope) {
    let code = directive.attrsMap["@_code"],result;
    if(!code){
        console.warn("parseIf args is null!");
        return "";
    }
    try {
        code = recoveryCode(code);
        result=evalScope(code,scope);
    }catch (e){
        console.warn("parseIf error!");
        console.warn(e);
        return "";
    }
    if(result){
        result="";
        directive.val+="";
        if(directive.val){
            try {
                let words,if_i=0,repeat_i=0,childRepeats=directive.child["zzjzRepeat"],childIfs=directive.child["zzjzIf"];
                words=directive.val.replace(WORD_REG, function (str, word) {
                    return evalScope(word, scope);
                });
                if(childIfs&&childIfs.length) {
                    words = words.replace(DIRECTIVE_IF, function () {
                        if (childIfs && childIfs[if_i]) {
                            let _words = parseIf(childIfs[if_i], scope);
                            if_i++;
                            return _words;
                        }
                    });
                }
                if(childRepeats&&childRepeats.length) {
                    words = words.replace(DIRECTIVE_REPEAT, function () {
                        if (childRepeats && childRepeats[repeat_i]) {
                            let _words = parseRepeat(childRepeats[repeat_i], scope);
                            repeat_i++;
                            return _words;
                        }
                    });
                }
                result +=words;

            }catch (e){
                console.warn("parseIf word error!");
                console.warn(e);
                return "";
            }
        }
        return result;
    }else {
        return "";
    }
}

function parseRepeat(directive,scope) {
    let code = directive.attrsMap["@_code"],item,items;
    if(!code){
        console.warn("parseRepeat args is null!");
        return "";
    }
    try {
        code.replace(/([^\s]*) in ([^\s]*)/, function (word, pre, next) {
            items = evalScope(next,scope);
            item = pre;
        });
    }catch (e){
        console.warn("parseRepeat args error!");
        console.warn(e);
        return "";
    }
    let parentScope = scope,result="";
    items.forEach(function (e,index) { //ngrepeat 内部scope变量初始化
        let childScope =  createChildScopeClass(parentScope);
        let scope = new childScope(parentScope);
        scope.$index = index;
        scope.$first = (index === 0);
        scope.$last = (index === (items.length - 1));
        scope.$middle = !(scope.$first || scope.$last);
        scope.$odd = !(scope.$even = (index&1) === 0);
        scope[item] = e;
        directive.val+="";
        if(directive.val){
            try {
                let words,if_i=0,repeat_i=0,childRepeats=directive.child["zzjzRepeat"],childIfs=directive.child["zzjzIf"];
                words=directive.val.replace(WORD_REG, function (str, word) {
                    return evalScope(word, scope);
                });
                if(childIfs && childIfs.length) {
                    words = words.replace(DIRECTIVE_IF, function () {
                        if (childIfs && childIfs[if_i]) {
                            let _words = parseIf(childIfs[if_i], scope);
                            if_i++;
                            return _words;
                        }
                    });
                }
                if(childRepeats && childRepeats.length) {
                    words = words.replace(DIRECTIVE_REPEAT, function () {
                        if (childRepeats && childRepeats[repeat_i]) {
                            let _words = parseRepeat(childRepeats[repeat_i], scope);
                            repeat_i++;
                            return _words;
                        }
                    });
                }
                result +=words;

            }catch (e){
                console.warn("parseRepeat word error!");
                console.warn(e);
                delete scope;
                return "";
            }
        }
        delete scope;
    });
    return result;
}

function parseZZJZ(zzjzXML,scope) {
    let content="",directive;
    if(!zzjzXML.child||!zzjzXML.child.content.length){
        return "";
    }
    directive = zzjzXML.child.content[0];
    if(directive.val){
        try {
            let words=directive.val,if_i=0,repeat_i=0,childRepeats=directive.child["zzjzRepeat"],childIfs=directive.child["zzjzIf"];
            /*words=directive.val.replace(WORD_REG, function (str, word) {
                return evalScope(word, scope);
            });*/
            if(childIfs && childIfs.length) {
                words = words.replace(DIRECTIVE_IF, function () {
                    if (childIfs && childIfs[if_i]) {
                        let _words = parseIf(childIfs[if_i], scope);
                        if_i++;
                        return _words;
                    }
                });
            }
            if(childRepeats && childRepeats.length) {
                words = words.replace(DIRECTIVE_REPEAT, function () {
                    if (childRepeats && childRepeats[repeat_i]) {
                        let _words = parseRepeat(childRepeats[repeat_i], scope);
                        repeat_i++;
                        return _words;
                    }
                });
            }
            content +=words;

        }catch (e){
            console.warn("parse content error!");
            console.warn(e);
            return "";
        }
    }
    return content;
}
function changeCode(code) {
    let str = code;
    str = str.replace(">","^^");
    str = str.replace("<","$$");
    return str;
}

function recoveryCode(code) {
    let str = code;
    str = str.replace("^^",">");
    str = str.replace("$$","<");
    return str;
}

/**
 * @description 把输入content解析成xml使用作用域变量转换成文本
 * @param {string} content Input to be serialized into xml.
 * @param {object} scope Input what to be serialized scope.
 * @returns {string} string serialized content.
 * */
function $zzjzCompile(content,scope={}) {
    if(!content){
        console.log("$zzjzComplie content is empty!");
        return "";
    }

    if(content.indexOf("<#zzjzIf")<0&&content.indexOf("<#zzjzRepeat")<0){
        return content;
    }
    content=content.replace(ZZJZ_IfREG,function (word,pre,mid,code,next) {
        word=word.replace(pre,"_Lt2_");
        word=word.replace(mid," code=");
        if(code) {
            word=word.replace(code,changeCode(code));
        }
        word=word.replace(next,"_Gt2_");
        return word;
    });
    content=content.replace(ZZJZ_RepeatREG,function (word,pre,mid,next) {
        word=word.replace(pre,"_Lt2_");
        word=word.replace(mid," code=");
        word=word.replace(next,"_Gt2_");
        return word;
    });
    content=content.replace(/(<#)/g,WORD_PRE);
    content=content.replace(/(#>)/g,WORD_NXT);
    content=content.replace(/>/g,"_Gt_");
    content=content.replace(/</g,"_Lt_");
    content = content.replace(/_Gt2_/g,">");
    content = content.replace(/_Lt2_/g,"<");

    content = "<content>"+content+"</content>";
    let ObjTree = fastXmlParser.getTraversalObj(content,{
        ignoreAttributes:false,
        trimValues:false
    }),result;
    result =parseZZJZ(ObjTree,scope);
    result = result.replace(/@ss@/g,"<#");
    result = result.replace(/@ee@/g,"#>");
    result = result.replace(/_Gt_/g,">");
    result = result.replace(/_Lt_/g,"<");
    return result;
}

/*$zzjzCompile(testScript,{
    zzjzParam:testZZJZParam
});*/

module.exports =$zzjzCompile;