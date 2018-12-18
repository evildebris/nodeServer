const $q = require('../common/$q');
const Utility = require('../common/Utility');
const JitCoder = require('./JitCoder');
const ConfigConst =require('../common/ConfigConst');
const Dag =require('../common/Dag');
const $zzjzCompile =require('../common/$zzjzCompile');

"use strict";

//编译常量定义
// WEBPACK_SPARK15：定义Spark1.5环境，默认true
var WEBPACK_SPARK15=true;
// WEBPACK_SPARK20：定义Spark2.05环境，默认false
var WEBPACK_SPARK20=false;

//常量定义

var FlowTemplate,NodeTemplate;
if(WEBPACK_SPARK15) {
    FlowTemplate = '\
<#GlobalLevel#>\n\
object ZZJZF_<#FlowId#> extends Flow(z,outputrdd,rddDisplay) {\n\
    //syslog.write("ZZJZF <#FlowId#> is running")\n\
    @transient val zzjz$outerFlow = this;\n\
    @transient val zzjz$globalZ = z;\n\
    <#NodeBodyScript#>\n\
    def apply(inputRDDs: mutable.HashMap[String, Any], fparams: java.util.HashMap[String, Any]): mutable.HashMap[String, Any] = {\n\
        <#ImportRDD#>\n\
        <#NodeCallScript#>\n\
    }\n\
}';
    NodeTemplate = '\
object ZZJZ_<#NodeId#> extends {\n\
    @transient val z = zzjz$globalZ; @transient val zzjz$flow = zzjz$outerFlow; @transient val zzjz$myzkey = ZZJZF$flowId + "<#FlowId#><#NodePath#>_zzjz$zkey";\n\
    //start param of running////////////\n\
    val zzjz$curZzjzParam = "<#zzjzParam#>";\n\
    //end param of running//////////////\n\
    val zzjz$jsonPreRerunList = """<#zzjzIf="zzjzParam.RERUNNING.preNodes"#><#zzjzParam.RERUNNING.preNodes#><#/zzjzIf#><#zzjzIf="!zzjzParam.RERUNNING.preNodes"#>[]<#/zzjzIf#>""";\n\
    val zzjz$preRunKey = "id"; val zzjz$reRun = "<#zzjzIf="zzjzParam.RERUNNING.rerun"#><#zzjzParam.RERUNNING.rerun#><#/zzjzIf#><#zzjzIf="!zzjzParam.RERUNNING.rerun"#>false<#/zzjzIf#>".trim;\n\
    @transient val zzjz$myinputRDDs = zzjz$flow.rddMap;  val zzjz$rddTableName = "<#zzjzRddName#>";\n\
} with OprIntr with Serializable {\n\
    override def zzjz$preRerun() = {this.zzjz$preRerunFlag;}\n\
    var zzjz$preRerunFlag = false;\n\
    override  def zzjz$doWork(obj: => zzjz$myType) = {\n\
        if (zzjz$reRunSeq()) {\n\
            z.uput(zzjz$myzkey, 0)\n\
            logDebug("Opr rerun!")\n\
        }\n\
        val reRunFlag = if (!zzjz$isZdefine) {\n\
            z.uput(zzjz$myzkey, (obj));\n\
            val runtime = Calendar.getInstance(TimeZone.getTimeZone("GMT")).getTimeInMillis();\n\
            zzjz$flow.outputRDD(zzjz$rddTableName + "_zzjz$reRun", runtime)\n\
        //syslog.write("节点<#zzjzRddName#>  _zzjz$reRun：runtime:" + runtime +", replaceMode:" + zzjz$flow.replaceMode);\n\
            true\n\
        } else false;\n\
        if (!reRunFlag) {\n\
            //syslog.write("节点<#zzjzRddName#>  _zzjz$reRun：replaceMode:" + false );\n\
            zzjz$flow.replaceMode(false)\n\
        }\n\
    }\n\
    <#ObjectLevel#>\n\
	def apply(inputRDDs: mutable.HashMap[String, Any], params: java.util.HashMap[String, Any]): mutable.HashMap[String, Any] = {\n\
        zzjz$flow.replaceMode(true)\n\
        //if(inputRDDs==null||inputRDDs.size==0) {syslog.write("节点<#zzjzRddName#>无输入数据");\n\
        //}else{syslog.write("节点<#zzjzRddName#>输入数据：");inputRDDs.foreach((A)=>{syslog.write("==>"+A._1+"："+A._2+"，"+A._2.getClass)});}\n\
        //syslog.write("节点<#zzjzRddName#>  _zzjz$reRun：zzjz$myzkey:" + zzjz$myzkey );\n\
        logger.info("节点<#zzjzRddName#>输入数据：" + inputRDDs.keys.toArray.mkString("、"))\n\
        this.zzjz$preRerunFlag = try {\n\
            zzjz$getPreRunFromJson(zzjz$jsonPreRerunList).exists { it =>\n\
                val preTime = try {\n\
                      inputRDDs(it + "_zzjz$reRun").asInstanceOf[Long];\n\
                }catch {\n\
                    case ex: Throwable => {//syslog.write("节点<#zzjzRddName#> inputRDDs：" + ex);\n\
                    }\n\
                    //syslog.write("节点<#zzjzRddName#>  _zzjz$reRun：" + zzjz$flow.getRdd(it + "_zzjz$reRun").asInstanceOf[Long]);\n\
                    zzjz$flow.getRdd(it + "_zzjz$reRun").asInstanceOf[Long];\n\
                }\n\
                //syslog.write("节点<#zzjzRddName#>  _zzjz$reRun：" + (preTime, zzjz$getObj().zzjz$runTime));\n\
                if(zzjz$isZdefine()){\n\
                     preTime > zzjz$getObj().zzjz$runTime;\n\
                }else{\n\
                     true;\n\
                }\n\
            }\n\
        }catch {\n\
            case ex: Throwable => logError("",ex);\n\
            //syslog.write("节点<#zzjzRddName#>：" + ex);\n\
            false\n\
        }\n\
        //////////////////////////////////////\n\
        this.zzjz$doWork {\n\
            println("Start define:" + "<#zzjzRddName#>");\n\
            zutil.initSC(sc).initZ(z);\n\
            new {\n\
                //start param of define\n\
                //end param of define\n\
            } with OprObjectIntr with Serializable {\n\
                @transient val zzjz$myZzjzParam = zzjz$curZzjzParam;\n\
                @transient val zzjz$runTime = Calendar.getInstance(TimeZone.getTimeZone("GMT")).getTimeInMillis()\n\
                @transient val zzjz$flowId = "<#zzjzRunningFlowId#>";\n\
                @transient val zzjz$nodeId = "<#zzjzRunningNodeId#>";\n\
                @transient val zzjz$paramUtil = new zParamUtil(if(zzjz$myZzjzParam == "") {"{}"} else {zzjz$myZzjzParam});\n\
				{//start node code:<#zzjzRddName#>/////////////\n\
                    //syslog.write("节点<#zzjzRddName#>执行")\n\
                    //if(inputRDDs==null||inputRDDs.size==0) {syslog.write("节点<#zzjzRddName#>无输入数据");\n\
                    //}else{syslog.write("节点<#zzjzRddName#>输入数据：");inputRDDs.foreach((A)=>{syslog.write("==>"+A._1+"："+A._2+"，"+A._2.getClass)});}\n\
                    //try{\n\
                        <#NodeScript#>\n\
                        //输出当前节点参数设置的RDD\n\
                        <#zzjzIf="!zzjzOperator.template.interpreterGroup || zzjzOperator.template.interpreterGroup==\'spark\'"#>if(sc!=null) outputRDD("<#zzjzRddName#>_zzjz$paramSetting",sc.makeRDD[org.apache.spark.sql.Row](Seq(org.apache.spark.sql.Row("<#NodeId#>","<#zzjzRddName#>",zzjz$curZzjzParam))))<#/zzjzIf#>\n\
                    //}catch{\n\
                    //    case ex:Throwable =>  {System.out.println(ex);\n\
                    //    Flow.logger.error("节点<#zzjzRddName#>异常,",ex);\n\
                    //    syslog.write("节点<#zzjzRddName#>异常:"+ex.toString());}\n\
                    //}\n\
                }//end node code:<#zzjzRddName#>///////////////\n\
			}\n\
		}\n\
        zzjz$preRerunFlag = false;\n\
		rddMap\n\
	}\n\
}';
}
if(WEBPACK_SPARK20) {
    FlowTemplate = '\
<#GlobalLevel#>\n\
object ZZJZF_<#FlowId#> extends Flow(z,outputrdd,rddDisplay) {\n\
    //syslog.write("ZZJZF <#FlowId#> is running")\n\
    @transient val zzjz$outerFlow = this;\n\
    @transient val zzjz$globalZ = zc;\n\
    <#NodeBodyScript#>\n\
    def apply(inputRDDs: mutable.HashMap[String, Any], fparams: java.util.HashMap[String, Any]): mutable.HashMap[String, Any] = {\n\
        <#ImportRDD#>\n\
        <#NodeCallScript#>\n\
    }\n\
}';
    NodeTemplate = '\
object ZZJZ_<#NodeId#> extends {\n\
    @transient val z$z = zzjz$globalZ; @transient val zzjz$flow = zzjz$outerFlow; @transient val zzjz$myzkey = ZZJZF$flowId + "<#FlowId#><#NodePath#>_zzjz$zkey";\n\
    //start param of running////////////\n\
    val zzjz$curZzjzParam = "<#zzjzParam#>";\n\
    //end param of running//////////////\n\
    val zzjz$jsonPreRerunList = """<#zzjzIf="zzjzParam.RERUNNING.preNodes"#><#zzjzParam.RERUNNING.preNodes#><#/zzjzIf#><#zzjzIf="!zzjzParam.RERUNNING.preNodes"#>[]<#/zzjzIf#>""";\n\
    val zzjz$preRunKey = "id"; val zzjz$reRun = "<#zzjzIf="zzjzParam.RERUNNING.rerun"#><#zzjzParam.RERUNNING.rerun#><#/zzjzIf#><#zzjzIf="!zzjzParam.RERUNNING.rerun"#>false<#/zzjzIf#>".trim;\n\
    @transient val zzjz$myinputRDDs = zzjz$flow.rddMap;  val zzjz$rddTableName = "<#zzjzRddName#>";\n\
} with OprIntr with Serializable {\n\
    override def zzjz$preRerun() = {this.zzjz$preRerunFlag;}\n\
    var zzjz$preRerunFlag = false;\n\
    override  def zzjz$doWork(obj: => zzjz$myType) = {\n\
        if (zzjz$reRunSeq()) {\n\
            z.uput(zzjz$myzkey, 0)\n\
            logDebug("Opr rerun!")\n\
        }\n\
        val reRunFlag = if (!zzjz$isZdefine) {\n\
            z.uput(zzjz$myzkey, (obj));\n\
            val runtime = Calendar.getInstance(TimeZone.getTimeZone("GMT")).getTimeInMillis();\n\
            zzjz$flow.outputRDD(zzjz$rddTableName + "_zzjz$reRun", runtime)\n\
        //syslog.write("节点<#zzjzRddName#>  _zzjz$reRun：runtime:" + runtime +", replaceMode:" + zzjz$flow.replaceMode);\n\
            true\n\
        } else false;\n\
        if (!reRunFlag) {\n\
            //syslog.write("节点<#zzjzRddName#>  _zzjz$reRun：replaceMode:" + false );\n\
            zzjz$flow.replaceMode(false)\n\
        }\n\
    }\n\
    <#ObjectLevel#>\n\
	def apply(inputRDDs: mutable.HashMap[String, Any], params: java.util.HashMap[String, Any]): mutable.HashMap[String, Any] = {\n\
        zzjz$flow.replaceMode(true)\n\
        //if(inputRDDs==null||inputRDDs.size==0) {syslog.write("节点<#zzjzRddName#>无输入数据");\n\
        //}else{syslog.write("节点<#zzjzRddName#>输入数据：");inputRDDs.foreach((A)=>{syslog.write("==>"+A._1+"："+A._2+"，"+A._2.getClass)});}\n\
        //syslog.write("节点<#zzjzRddName#>  _zzjz$reRun：zzjz$myzkey:" + zzjz$myzkey );\n\
        logger.info("节点<#zzjzRddName#>输入数据：" + inputRDDs.keys.toArray.mkString("、"))\n\
        this.zzjz$preRerunFlag = try {\n\
            zzjz$getPreRunFromJson(zzjz$jsonPreRerunList).exists { it =>\n\
                val preTime = try {\n\
                      inputRDDs(it + "_zzjz$reRun").asInstanceOf[Long];\n\
                }catch {\n\
                    case ex: Throwable => {//syslog.write("节点<#zzjzRddName#> inputRDDs：" + ex);\n\
                    }\n\
                    //syslog.write("节点<#zzjzRddName#>  _zzjz$reRun：" + zzjz$flow.getRdd(it + "_zzjz$reRun").asInstanceOf[Long]);\n\
                    zzjz$flow.getRdd(it + "_zzjz$reRun").asInstanceOf[Long];\n\
                }\n\
                //syslog.write("节点<#zzjzRddName#>  _zzjz$reRun：" + (preTime, zzjz$getObj().zzjz$runTime));\n\
                if(zzjz$isZdefine()){\n\
                     preTime > zzjz$getObj().zzjz$runTime;\n\
                }else{\n\
                     true;\n\
                }\n\
            }\n\
        }catch {\n\
            case ex: Throwable => logError("",ex);\n\
            //syslog.write("节点<#zzjzRddName#>：" + ex);\n\
            false\n\
        }\n\
        //////////////////////////////////////\n\
        this.zzjz$doWork {\n\
            println("Start define:" + "<#zzjzRddName#>");\n\
            zutil.initSC(sc).initZ(z);\n\
            new {\n\
                //start param of define\n\
                //end param of define\n\
            } with OprObjectIntr with Serializable {\n\
                @transient val zzjz$myZzjzParam = zzjz$curZzjzParam;\n\
                @transient val zzjz$runTime = Calendar.getInstance(TimeZone.getTimeZone("GMT")).getTimeInMillis()\n\
                @transient val zzjz$flowId = "<#zzjzRunningFlowId#>";\n\
                @transient val zzjz$nodeId = "<#zzjzRunningNodeId#>";\n\
                @transient val zzjz$paramUtil = new zParamUtil(if(zzjz$myZzjzParam == "") {"{}"} else {zzjz$myZzjzParam});\n\
				{//start node code:<#zzjzRddName#>/////////////\n\
                    //syslog.write("节点<#zzjzRddName#>执行")\n\
                    //if(inputRDDs==null||inputRDDs.size==0) {syslog.write("节点<#zzjzRddName#>无输入数据");\n\
                    //}else{syslog.write("节点<#zzjzRddName#>输入数据：");inputRDDs.foreach((A)=>{syslog.write("==>"+A._1+"："+A._2+"，"+A._2.getClass)});}\n\
                    //try{\n\
                        <#NodeScript#>\n\
                        //输出当前节点参数设置的RDD\n\
                        <#zzjzIf="!zzjzOperator.template.interpreterGroup || zzjzOperator.template.interpreterGroup==\'spark\'"#>if(sc!=null) outputRDD("<#zzjzRddName#>_zzjz$paramSetting",sc.makeRDD[org.apache.spark.sql.Row](Seq(org.apache.spark.sql.Row("<#NodeId#>","<#zzjzRddName#>",zzjz$curZzjzParam))))<#/zzjzIf#>\n\
                    //}catch{\n\
                    //    case ex:Throwable =>  {System.out.println(ex);\n\
                    //    Flow.logger.error("节点<#zzjzRddName#>异常,",ex);\n\
                    //    syslog.write("节点<#zzjzRddName#>异常:"+ex.toString());}\n\
                    //}\n\
                }//end node code:<#zzjzRddName#>///////////////\n\
			}\n\
		}\n\
        zzjz$preRerunFlag = false;\n\
		rddMap\n\
	}\n\
}';
}

var FlowTemplate_Top='val ZZJZF$flowId="<#FlowId#>"\n'+FlowTemplate;
var CallFlowTemplate_Top = 'ZZJZF_<#FlowId#>(null,null); \n\
println("EndOpr:" + (compat.Platform.currentTime - StartOpr) + "(ms)") \n\
}//end flow';
var CallFlowTemplate_Sub = '      importAllRDDs(ZZJZF_<#FlowId#>(inputRDDs,null))\n';
var ImportRddTemplate_Top='scala.collection.JavaConversions.mapAsScalaMap(zc.rddInternal(zc.getInterpreterContext.getNoteId,"<#PreNodeIdList#>")).foreach(rschema=>{\n\
          scala.collection.JavaConversions.mapAsScalaMap(rschema._2).foreach(r=>rddMap.put(r._1,r._2))\n\
          print("导入节点"+rschema._1+"：")\n\
          scala.collection.JavaConversions.mapAsScalaMap(rschema._2).foreach(r=>print(r._1+"、"))\n\
          println()\n\
        })\n';
var PythonFlowTemplate='<#NodeBodyScript#>';
var CallPythonFlowTemplate="# It's the end of node in <#FlowId#>";
/*
     * date: 20180102
     */

//变量定义
var _self = this;
var _initiated = false;
var _scope = {};

//类定义
/**
 * 算子参数模型类。该类只能通过new方法实例化：new ComParam(jsonObj)
 * @returns {ComParam}
 * @constructor 通过加载算子参数的JSON对象，实例化算子参数对象
 */
function ComParam() {
    var paramSelf = this;

    //定义访问器
    /**
     * 为优化算子参数的序列化而定义成员和访问器，仅部分访问器会被序列化
     */
    Object.defineProperties(this, {
        "_key": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "_title": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "_tips": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "_default": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "_element": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "_enum": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "_validate": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "_type": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "_require": {
            value: true,
            writable: true,
            enumerable: false
        },
        "_visible": {
            value: true,
            writable: true,
            enumerable: false
        },
        "_map": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "_mapExpression": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "_changed": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "__initComParam__": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "changed": {
            enumerable: false,
            get: function () {
                if (paramSelf._changed) {
                    return true;
                }
                if (paramSelf.paramList && paramSelf.paramList.length > 0) {
                    for (var i = 0; i < paramSelf.paramList.length; i++) {
                        if (paramSelf.paramList[i].changed) {
                            return true;
                        }
                    }
                }
                return false;
            }
        },
        "key": {
            enumerable: true,
            get: function () {
                return paramSelf._key;
            },
            set: function (val) {
                if (paramSelf._key != val) {
                    paramSelf._key = val;
                    paramSelf._changed = true;
                }
            }
        },
        "title": {
            enumerable: true,
            get: function () {
                return paramSelf._title;
            },
            set: function (val) {
                if (paramSelf._title != val) {
                    paramSelf._title = val;
                    paramSelf._changed = true;
                }
            }
        },
        "tips": {
            enumerable: true,
            get: function () {
                return paramSelf._tips;
            },
            set: function (val) {
                if (paramSelf._tips != val) {
                    paramSelf._tips = val;
                    paramSelf._changed = true;
                }
            }
        },
        "default": {
            enumerable: true,
            get: function () {
                return paramSelf._default;
            },
            set: function (val) {
                if (paramSelf._default != val) {
                    paramSelf._default = val;
                    paramSelf._changed = true;
                }
            }
        },
        "element": {
            enumerable: true,
            get: function () {
                return paramSelf._element;
            },
            set: function (val) {
                if (paramSelf._element != val) {
                    paramSelf._element = val;
                    paramSelf._changed = true;
                }
            }
        },
        "enum": {
            enumerable: true,
            get: function () {
                return paramSelf._enum;
            },
            set: function (val) {
                if (paramSelf._enum != val) {
                    paramSelf._enum = val;
                    paramSelf._changed = true;
                }
            }
        },
        "validate": {
            enumerable: true,
            get: function () {
                return paramSelf._validate;
            },
            set: function (val) {
                if (paramSelf._validate != val) {
                    paramSelf._validate = val;
                    paramSelf._changed = true;
                }
            }
        },
        "type": {
            enumerable: true,
            get: function () {
                return paramSelf._type;
            },
            set: function (val) {
                if (paramSelf._type != val) {
                    paramSelf._type = val;
                    paramSelf._changed = true;
                }
            }
        },
        "require": {
            enumerable: true,
            get: function () {
                return paramSelf._require;
            },
            set: function (val) {
                if (paramSelf._require != val) {
                    paramSelf._require = val;
                    paramSelf._changed = true;
                }
            }
        },
        "visible": {
            enumerable: true,
            get: function () {
                return paramSelf._visible;
            },
            set: function (val) {
                if (paramSelf._visible != val) {
                    paramSelf._visible = val;
                    paramSelf._changed = true;
                }
            }
        },
        "map": {
            enumerable: true,
            get: function () {
                return paramSelf._map;
            },
            set: function (val) {
                if (paramSelf._map != val) {
                    paramSelf._map = val;
                    paramSelf._changed = true;
                }
            }
        },
        "mapExpression": {
            enumerable: true,
            get: function () {
                return paramSelf._mapExpression;
            },
            set: function (val) {
                if (paramSelf._mapExpression != val) {
                    paramSelf._mapExpression = val;
                    paramSelf._changed = true;
                }
            }
        }
    });

    //成员定义
    this.paramList = undefined;

    //函数定义
    /**
     * 加载算子参数的JSON对象。该方法是静态调用。
     * @param instance 参数对象实例
     * @param data 参数的JSON对象
     * @returns {load} 返回算子参数自身
     */
    function load(instance, data) {
        // console.debug("ComParam.load %o", data);
        if (Array.isArray(data)) {
            return;
        } else {
            //嵌套的参数模型
            for (var key in data) {
                var value = data[key];
                if (typeof(value) != "function") {
                    if (key != "paramList") {
                        instance[key] = value;
                    } else {
                        if (Array.isArray(value) && value.length > 0) {
                            instance.paramList = [];
                            for (var i = 0; i < value.length; i++) {
                                instance.paramList.push(new ComParam(value[i]));
                            }
                        }
                    }
                }
            }
            instance._changed = false;
        }
        return instance;
    }

    /**
     * 在paramList的index位置处插入一个参数，并设定一个默认的key值。如果没有没有提供index或index为负，则在paramList末尾追加一个参数。
     * @param index 要插入的位置
     * @returns * 插入的子级参数
     */
    function addParam(index) {
        var instance = this;
        var par = new ComParam();
        if (!instance.paramList) {
            instance.paramList = [];
        }
        //修改参数的默认键值
        var i = 1;
        while (true) {
            par.key = "param" + i;
            var found = false;
            for (var j = 0; j < instance.paramList.length; j++) {
                if (instance.paramList[j] && instance.paramList[j]._key == par.key) {
                    found = true;
                    break;
                }
            }
            if (found) {
                i++;
            } else {
                break;
            }
        }
        //加入参数列表
        if (index == null || index == undefined || index < 0 || index >= instance.paramList.length) {
            instance.paramList.push(par);
        } else {
            instance.paramList.splice(index, 0, par);
        }
        return par;
    }

    /**
     * 从paramList中删除指定key值的参数。该方法仅删除匹配的第一个参数。
     * @param key 要删除参数的key值
     */
    function removeParam(key) {
        var instance = this;
        if (!instance.paramList) {
            return;
        }
        for (var i = 0; i < instance.paramList.length; i++) {
            if (instance.paramList[i].key == key) {
                instance.paramList.splice(i, 1);
                instance._changed = true;
                break;
            }
        }
    }

    /**
     * 创建参数的副本，该副本增加value属性，是具体的赋值。
     * @param setting
     * @returns {*}
     */
    function makeValuedParam(setting) {
        var valued = angular.copy(paramSelf);
        //to do
        return valued;
    }

    /**
     * 获取节点参数中，指定类型的参数值列表。静态方法调用，支持递归。
     * @param param 算子参数对象
     * @param paramSetting 节点参数对象
     * @param type 指定的参数类型
     * @param values 返回的参数值列表
     * @returns {Array} 参数值列表
     */
    function getParamValuesByType(param, paramSetting, type, values) {
        if (!param || !paramSetting || !type) {
            return [];
        }
        if (!values) {
            values = [];
        }
        //检查本级参数
        var pvalue;
        if (param.type !== ConfigConst.ComModel.Type_Component) {
            if (param.type === type) {
                pvalue = paramSetting[param.key];
                if (typeof(pvalue) == "object" && param.paramList && param.paramList.length > 0) {
                    //含有子级参数
                    pvalue = paramSetting[param.key][param.key];
                    if (pvalue && !Utility.contains(values, pvalue)) {
                        values.push(pvalue);
                    }
                } else if (Array.isArray(pvalue)) {
                    // 复选框、列表
                    if (param.element == ConfigConst.ComModel.Element_Checkbox) {
                        angular.forEach(pvalue, function (x) {
                            if (pvalue && !Utility.contains(values, x)) {
                                values.push(x);
                            }
                        });
                    } else if (param.element == ConfigConst.ComModel.Element_MulList) {
                        //什么也不做，递归检查子级参数
                    }
                } else if (pvalue && !Utility.contains(values, pvalue)) {
                    //普通参数
                    values.push(pvalue);
                }
            }
        } else {
            //paramSetting的值必须含有value属性
            if (paramSetting[param.key]) {
                var comId = paramSetting[param.key].value;
                if (comId) {
                    var com2 = _self.ComLibSrv.getComponent(comId);
                    if (com2) {
                        com2.template.getParamValuesByType(com2.template, paramSetting[param.key], type, values);
                    }
                }
            }
        }
        //检查子级参数
        if (param.paramList && param.paramList.length > 0) {
            if (param.element === ConfigConst.ComModel.Element_MulSelect || param.element === ConfigConst.ComModel.Element_Checkbox) {
                //如果本级参数是mulselect，则需要根据paramSetting的值查找对应的muloption的子级
                pvalue = paramSetting[param.key];
                if (pvalue && pvalue.value != undefined) {
                    pvalue = pvalue.value;
                    //查找pvalue对应的muloption
                    var subparam = null;
                    for (var i = 0; i < param.paramList.length; i++) {
                        var sub = param.paramList[i];
                        if (sub.element === ConfigConst.ComModel.Element_MulOption && sub === pvalue) {
                            subparam = sub;
                            break;
                        }
                    }
                    if (subparam) {
                        getParamValuesByType(subparam, pvalue, type, values);
                    }
                }
            } else if (param.element === ConfigConst.ComModel.Element_MulList) {
                //如果本级参数是mullist，则paramSetting的值应该是数组，需要将数组内各项进行查找
                var thisSetting = paramSetting[param.key];
                if (Array.isArray(thisSetting)) {
                    for (var j = 0; j < thisSetting.length; j++) {
                        for (var i = 0; i < param.paramList.length; i++) {
                            getParamValuesByType(param.paramList[i], thisSetting[j], type, values);
                        }
                    }
                }
            } else {
                for (var i = 0; i < param.paramList.length; i++) {
                    getParamValuesByType(param.paramList[i], paramSetting[param.key], type, values);
                }
            }
        }
        return values;
    }

    function getParamValuesByType2(param, setting, type, values) {
        if (!param || !setting || !type) {
            return [];
        }
        if (!values) {
            values = [];
        }
        //检查本级参数
        if (param.type === ConfigConst.ComModel.Type_Component) {
            //当前参数指向另一个算子
            //paramSetting必须含有componentId属性
            if (param.type === type) {
                values.push(setting[param.key]);
            } else {
                //查找指向的另一个算子，并将控制权交给另一个算子，不再迭代子参数
                var comId = setting.componentId;
                if (comId) {
                    var refcom = _self.ComLibSrv.getComponent(comId);
                    if (refcom instanceof Com) {
                        return refcom.getParamValuesByType(refcom, setting[param.key], type, values);
                    }
                    // else if(typeof(refcom.then)=="function"){
                    //     //异步查找算子
                    //     return refcom.then(function (com2) {
                    //         if(com2 instanceof Com){
                    //             return com2.getParamValuesByType(setting[param.key],type,values,defer);
                    //         }
                    //         return null;
                    //     });
                    // }
                }
            }
        } else {
            //根据参数类型和参数
            var pvalue = setting[param.key];
            if (param.type === type && pvalue) {
                if (param.type === ConfigConst.ComModel.Type_Dag) {
                    //param不应有paramList，且忽略处理
                    if (!Utility.containse(values, pvalue)) {
                        values.push(pvalue);
                    }
                } else if (typeof(pvalue) == "object" && param.paramList && param.paramList.length > 0) {
                    //含有子级参数
                    pvalue = setting[param.key][param.key];
                    if (pvalue && !Utility.contains(values, pvalue)) {
                        values.push(pvalue);
                    }
                } else if (Array.isArray(pvalue)) {
                    // 复选框、列表
                    if (param.element == ConfigConst.ComModel.Element_Checkbox) {
                        angular.forEach(pvalue, function (x) {
                            if (pvalue && !Utility.contains(values, x)) {
                                values.push(x);
                            }
                        });
                    } else if (param.element == ConfigConst.ComModel.Element_MulList) {
                        //什么也不做，递归检查子级参数
                    }
                } else if (pvalue && !Utility.contains(values, pvalue)) {
                    //普通参数
                    values.push(pvalue);
                }
            }

            //检查子级参数
            if (param.type !== ConfigConst.ComModel.Type_Dag && param.paramList && param.paramList.length > 0) {
                if (param.element === ConfigConst.ComModel.Element_MulSelect || param.element === ConfigConst.ComModel.Element_Checkbox) {
                    //如果本级参数是mulselect，则需要根据paramSetting的值查找对应的muloption的子级
                    pvalue = setting[param.key];
                    if (pvalue && pvalue.value != undefined) {
                        pvalue = pvalue.value;
                        //查找pvalue对应的muloption
                        var subparam = null;
                        for (var i = 0; i < param.paramList.length; i++) {
                            var sub = param.paramList[i];
                            if (sub.element === ConfigConst.ComModel.Element_MulOption && sub === pvalue) {
                                subparam = sub;
                                break;
                            }
                        }
                        if (subparam) {
                            getParamValuesByType2(subparam, pvalue, type, values);
                        }
                    }
                } else {
                    for (var i = 0; i < param.paramList.length; i++) {
                        getParamValuesByType2(param.paramList[i], setting[param.key], type, values);
                    }
                }
            }
        }

        return values;
    }

    //原型方法
    if (ComParam.prototype.__initComParam__ !== true) {
        ComParam.prototype.addParam = addParam;
        ComParam.prototype.removeParam = removeParam;
        ComParam.prototype.getParamValuesByType = getParamValuesByType;
        ComParam.prototype.__initComParam__ = true;
    }

    //初始化或构造函数
    var argn = arguments.length;
    if (argn == 1) {
        load(this, arguments[0]);
    }
}

/**
 * 通用算子模板类。该类只能通过new方法实例化：new ComTemplate(jsonObj)
 * @constructor
 */
function ComTemplate() {
    var templateSelf = this;

    //定义访问器
    /**
     * 为优化算子模板的序列化而定义成员和访问器，仅部分访问器会被序列化
     */
    Object.defineProperties(this, {
        //不需要序列化的成员
        "_script": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "_compileFunc": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "_renderFunc": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "_defineTemplate": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "_defineTemplateUrl": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "_applyTemplate": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "_applyTemplateUrl": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "_interpreter": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "_interpreterGroup": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "_language": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "compileFuncObj": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "renderFuncObj": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        //记录变更状态的成员及访问器
        "_changed": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "changed": {
            enumerable: false,
            get: function () {
                if (templateSelf._changed) {
                    return true;
                }
                if (templateSelf.paramList && templateSelf.paramList.length > 0) {
                    for (var i = 0; i < templateSelf.paramList.length; i++) {
                        if (templateSelf.paramList[i].changed) {
                            return true;
                        }
                    }
                }
                return false;
            }
        },
        //需要序列化的访问器
        "script": {
            enumerable: true,
            get: function () {
                return templateSelf._script;
            },
            set: function (val) {
                if (templateSelf._script != val) {
                    templateSelf._script = val;
                    templateSelf._changed = true;
                }
            }
        },
        "compileFunc": {
            enumerable: true,
            get: function () {
                return templateSelf._compileFunc;
            },
            set: function (val) {
                if (templateSelf._compileFunc != val) {
                    templateSelf._compileFunc = val;
                    templateSelf._changed = true;
                }
            }
        },
        "renderFunc": {
            enumerable: true,
            get: function () {
                return templateSelf._renderFunc;
            },
            set: function (val) {
                if (templateSelf._renderFunc != val) {
                    templateSelf._renderFunc = val;
                    templateSelf._changed = true;
                }
            }
        },
        "defineTemplate": {
            enumerable: true,
            get: function () {
                return templateSelf._defineTemplate;
            },
            set: function (val) {
                if (templateSelf._defineTemplate != val) {
                    templateSelf._defineTemplate = val;
                    templateSelf._changed = true;
                }
            }
        },
        "defineTemplateUrl": {
            enumerable: true,
            get: function () {
                return templateSelf._defineTemplateUrl;
            },
            set: function (val) {
                if (templateSelf._defineTemplateUrl != val) {
                    templateSelf._defineTemplateUrl = val;
                    templateSelf._changed = true;
                }
            }
        },
        "applyTemplate": {
            enumerable: true,
            get: function () {
                return templateSelf._applyTemplate;
            },
            set: function (val) {
                if (templateSelf._applyTemplate != val) {
                    templateSelf._applyTemplate = val;
                    templateSelf._changed = true;
                }
            }
        },
        "applyTemplateUrl": {
            enumerable: true,
            get: function () {
                return templateSelf._applyTemplateUrl;
            },
            set: function (val) {
                if (templateSelf._applyTemplateUrl != val) {
                    templateSelf._applyTemplateUrl = val;
                    templateSelf._changed = true;
                }
            }
        },
        "interpreter": {
            enumerable: true,
            get: function () {
                return templateSelf._interpreter;
            },
            set: function (val) {
                if (templateSelf._interpreter != val) {
                    templateSelf._interpreter = val;
                    templateSelf._changed = true;
                }
            }
        },
        "interpreterGroup": {
            enumerable: true,
            get: function () {
                return templateSelf._interpreterGroup;
            },
            set: function (val) {
                if (templateSelf._interpreterGroup != val) {
                    templateSelf._interpreterGroup = val;
                    templateSelf._changed = true;
                }
            }
        },
        "language": {
            enumerable: true,
            get: function () {
                return templateSelf._language;
            },
            set: function (val) {
                if (templateSelf._language != val) {
                    templateSelf._language = val;
                    templateSelf._changed = true;
                }
            }
        }
    });

    //成员定义
    this.paramList = undefined;

    //函数定义
    /**
     * 加载算子模板的JSON对象。该方法是静态调用。
     * @param instance 模板对象实例
     * @param data 模板的JSON对象
     * @returns {load} 返回算子模板自身
     */
    function load(instance, data) {
        // console.debug("ComTemplate.load %o", data);
        if (!data || typeof(data) != "object") {
            return instance;
        } else {
            //嵌套的参数模型
            for (var key in data) {
                var value = data[key];
                if (typeof(value) != "function") {
                    if (key != "paramList") {
                        instance[key] = value;
                    } else {
                        if (Array.isArray(value) && value.length > 0) {
                            instance.paramList = [];
                            for (var i = 0; i < value.length; i++) {
                                instance.paramList.push(new ComParam(value[i]));
                            }
                        }
                    }
                }
            }
            instance._changed = false;
        }
        //构造函数对象
        buildFuncObject(instance);
    }

    /**
     * 在paramList的index位置处插入一个参数，并设定一个默认的key值。如果没有提供index或index为负，则在paramList末尾追加一个参数。
     * @param index 要插入的位置
     */
    function addParam(index) {
        var instance = this;
        return ComParam.prototype.addParam.call(instance, index);
    }

    /**
     * 从paramList中删除指定key值的参数。该方法仅删除匹配的第一个参数。
     * @param key 要删除参数的key值
     */
    function removeParam(key) {
        var instance = this;
        ComParam.prototype.removeParam.call(instance, key);
    }

    /**
     * 将Javascript代码文本转化为可调用的函数对象
     * @param funcStr Javascript代码文本
     * @returns {*} 可调用的函数对象
     */
    function buildJsFuncObject(funcStr) {
        if (!funcStr || funcStr.length == 0) {
            return undefined;
        }
        var fproto = "try{__FUNC__.<#FuncName#>=<#FuncName#>;}catch(ex){/*console.warn('ComTemplate.buildJsFuncObject异常：%s',ex);*/}\n";
        var fstr = "";
        //查找“function XXX (”字符串，提取函数名
        var match = /function\s+([a-zA-Z_$][0-9a-zA-Z_$]+)\s*\(/g;
        var funcNames = [];
        var func = match.exec(funcStr);
        while (match.lastIndex > 0) {
            funcNames.push(func[1]);
            func = match.exec(funcStr);
        }
        //查找到“function XXX (”字符串，提取函数名
        funcNames.forEach(function (x) {
            fstr += fproto.replace(/<#FuncName#>/g, x);
        });
        var funcObj = undefined;
        if (fstr.length > 0) {
            fstr = funcStr + "\nvar __FUNC__={};\n" + fstr + "\nreturn __FUNC__;";
            var fobj = null;
            try {
                fobj = new Function(fstr);
            } catch (ex) {
                console.warn("ComTemplate.buildJsFuncObject异常：%s", ex);
                return undefined;
            }
            try {
                funcObj = fobj();
            } catch (ex) {
                console.warn("ComTemplate.buildJsFuncObject异常：%s", ex);
            }
        }
        return funcObj;
    }

    function buildFuncObject(instance) {
        //构造函数对象
        instance.compileFuncObj = buildJsFuncObject(instance.compileFunc);
        instance.renderFuncObj = buildJsFuncObject(instance.renderFunc);
        return instance;
    }

    /**
     * ComTemplate的序列化方法
     * @param instance 模板对象实例
     */
    function write(instance) {
        //此时templateSelf为初始对象，this为当前对象
        // templateSelf=this;
        //构造函数对象
        buildFuncObject(instance);
        return angular.toJson(instance);
    }

    /**
     * ComTemplate的反序列化方法
     * @param instance 模板对象实例
     * @param str 模板字符串
     */
    function read(instance, str) {
        // templateSelf=this;
        var obj = undefined;
        try {
            obj = JSON.parse(str);
        } catch (ex) {
            console.warn("ComTemplate.read异常：%s", ex);
            return;
        }
        if (obj) {
            load(instance, obj);
        }
        return instance;
    }

    /**
     * 获取节点参数中，指定类型的参数值列表。
     * @param template 算子模板对象
     * @param paramSetting 节点参数对象
     * @param type 指定的参数类型
     * @returns {Array} 参数值列表
     */
    function getParamValuesByType(template, paramSetting, type, values) {
        if (!values) {
            values = [];
        }
        if (template.paramList && template.paramList.length > 0) {
            for (var i = 0; i < template.paramList.length; i++) {
                ComParam.prototype.getParamValuesByType(template.paramList[i], paramSetting, type, values);
            }
        }
        return values;
    }

    function getParamValuesByType_New(paramSetting, type, noCheckRef, defer) {
        var values = [];
        //检查并异步加载所引用的其他算子
        if (noCheckRef) {
            var defer = _self.ComLibSrv.loadRefComponents(templateSelf, paramSetting);
        }

        //查找指定类型的参数值列表
        if (templateSelf.paramList && templateSelf.paramList.length > 0) {
            for (var i = 0; i < templateSelf.paramList.length; i++) {
                ComParam.prototype.getParamValuesByType(templateSelf.paramList[i], paramSetting, type, values);
            }
        }
        return values;
    }

    function getParamValuesByType_New2(paramSetting, type) {
        return getParamValuesByType_New(paramSetting, type, true);
    }

    //原型方法
    if (ComTemplate.prototype.__initComTemplate__ !== true) {
        ComTemplate.prototype.load = load;
        ComTemplate.prototype.addParam = addParam;
        ComTemplate.prototype.removeParam = removeParam;
        ComTemplate.prototype.buildJsFuncObject = buildJsFuncObject;
        ComTemplate.prototype.write = write;
        ComTemplate.prototype.read = read;
        ComTemplate.prototype.getParamValuesByType = getParamValuesByType;
        ComTemplate.prototype.getParamValuesByType_New = getParamValuesByType_New;
        ComTemplate.prototype.getParamValuesByType_New2 = getParamValuesByType_New2;
        ComTemplate.prototype.__initComTemplate__ = true;
    }

    //因为要用到ComParam的原型，所以需要加载ComParam
    if (ComParam.prototype.__initComParam__ !== true) {
        new ComParam();
    }

    //初始化或构造函数
    var argn = arguments.length;
    if (argn == 1) {
        load(this, arguments[0]);
    }
}

/**
 * 通用算子类。该类只能通过new方法实例化：new Com(jsonObj)
 * @returns {Com}
 * @constructor 通过加载算子的JSON对象，实例化算子对象
 */
function Com() {
    var comSelf = this;
    var argn = arguments.length;
    var DEFAULT_INTERPRETER_GROUP="spark";

    //成员定义
    //管理类字段
    this.id = undefined;
    this.name = undefined;
    this.sn = undefined;
    this.type = undefined;
    this.comment = undefined;
    this.version = undefined;
    this.createUser = undefined;
    this.createTime = undefined;
    this.updateUser = undefined;
    this.updateTime = undefined;
    this.authority = undefined;
    this.smallIcon = undefined;
    this.bigIcon = undefined;
    this.tip = undefined;
    this.tipIcon = undefined;
    this.categoryId = undefined;  //临时使用，未来将取消
    this.currentSvnVersion = undefined;
    //模板类字段
    this.template = (argn == 1) ? undefined : (new ComTemplate());

    //内部常量定义
    var CallNodeTemplate = '    ZZJZ_<#NodeId#>(<#InputRddMap#>, if(fparams!=null && fparams.containsKey("<#NodeId#>")) fparams.get("<#NodeId#>").asInstanceOf[java.util.HashMap[String, Any]] else null)\n';
    /*var NodeTemplate = '\
         object ZZJZ_<#NodeId#> extends Serializable {//<#zzjzRddName#>\n\
         <#ObjectLevel#>\n\
         def apply(inputRDDs: mutable.HashMap[String, Any], params: java.util.HashMap[String, Any]): mutable.HashMap[String, Any] = {\n\
         if(inputRDDs==null||inputRDDs.size==0) {println("节点<#zzjzRddName#>无输入数据")\n\
         ;\n\
         }else{\n\
         println("节点<#zzjzRddName#>输入数据：")\n\
         inputRDDs.foreach((A)=>{println("==>"+A._1+"："+A._2+"，"+A._2.getClass)})\n\
         ;\n\
         }\n\
         <#NodeScript#>\n\
         rddMap\n\
         }\n\
         }\n';
         var CallNodeTemplate = '    ZZJZ_<#NodeId#>(<#InputRddMap#>, null)\n';*/
    var ReservedKeywords4ScriptDom=["<#FlowId#>","<#NodeId#>","<#zzjzRunningFlowId#>","<#zzjzRunningNodeId#>","<#zzjzRddName#>"];

    //函数定义
    /**
     * 加载算子对象
     * @param data
     */
    function load(data) {
        // console.debug("Com.load %o", data);
        if (typeof(data) == "object") {
            //单个算子
            angular.forEach(data, function (value, key) {
                if (key == "paramList") {
                    //算子参数，其实不会用到
                    angular.forEach(value, function (v) {
                        comSelf.paramList.push(new ComParam(v));
                    });
                } else if (key == "template") {
                    switch (typeof(value)) {
                        case "object":
                            comSelf.template = new ComTemplate(value);
                            break;
                        case "string":
                            comSelf.template = ComTemplate.prototype.read(new ComTemplate(), value);
                            break;
                    }
                } else {
                    //非参数属性
                    comSelf[key] = value;
                }
            });
        } else {
            //包含多个算子或算子的多个版本。
            return null;
        }
        return comSelf;
    }

    /**
     * 工厂模式创建算子对象。推荐采用Com.create()静态方法调用。会根据算子类型自动实例化相应的类。
     * @param data 算子的JSON对象
     * @returns {*} 实例化的算子对象
     */
    function create(data) {
        if (!data || !data.type) return new Com();
        if (data.type === ConfigConst.ComLib.ComType_Do) {
            if(data.template&&(data.template.language==ConfigConst.ComLib.ComLanguage_Python ||
                    data.template.language==ConfigConst.ComLib.ComLanguage_R)){
                return new PythonCom(data);
            }else {
                return new Com(data);
            }
        } else if (data.type === ConfigConst.ComLib.ComType_View) {
            return new ViewCom(data);
        } else if (data.type === ConfigConst.ComLib.ComType_ViewAtom) {
            return new ChartCom(data);
        } else if (data.type === ConfigConst.ComLib.ComType_Composite) {
            return new CompositeCom(data);
        } else if (data.type === ConfigConst.ComLib.ComType_Linkage) {
            return new ViewCom(data);
        } else {
            return new Com();
        }
    }

    //save和pack暂时不用
    function save() {
        //调用ComPack的save方法
        var pack = _comMap[comSelf.id];
        if (pack) {
            pack.save();
        }
    }

    function pack() {
        var obj = angular.copy(comSelf);
        delete obj.paramList;
        //准备重写paramList
        obj.paramList = [];
        angular.forEach(this.paramList, function (param) {
            obj.paramList.push(param.pack());
        });
        return obj;
    }

    function addParam(index) {
        ComParam.prototype.addParam.call(comSelf, index);
    }

    function removeParam(key) {
        ComParam.prototype.removeParam.call(comSelf, key);
    }

    /**
     * 算子节点的执行生命周期
     * @param node
     */
    function lifeCycle(node) {
        //编译、执行、规格化、呈现、交互、销毁
        var script = "";
        //编译
        if (comSelf.template) {
            script = compile(node);
        }
        //封装
        if (script.length > 0) {
            script = JitCoder.code(node, script);
        }
        //执行
        if (script.length > 0) {

        }
    }

    function compile(node, recursion) {
        //算子的编译方法先生成该算子节点的执行脚本，然后在进行统一命名空间的封装
        var thisCom = this;
        if (!node || !node.id || node.componentId != thisCom.id) {
            return new CompileContext();
        }
        var oldScriptTmpl = thisCom.template.script;
        thisCom.template.script = thisCom.preCompileExtend(thisCom, node, recursion);
        var script = compileNode(thisCom, node, recursion);
        var compiledScript = thisCom.postCompileExtend(thisCom, node, recursion, script);
        thisCom.template.script = oldScriptTmpl;
        return compiledScript;
    }

    function compileNode(com, node, recursion) {
        var context = new CompileContext();
        context.comType = ConfigConst.ComLib.ComType_Do;
        context.interpreter = com.interpreter;
        context.language = com.template.language;
        // 允许节点没有参数
        var script = com.template.script;
        //基本输入输出函数，并向下兼容
        // z.rdd("XX") => inputRDD("XX") => inputRDDs("XX")
        script = script.replace(/z\.rdd\((.*)\)/g, 'inputRDDs($1)');
        script = script.replace(/inputRDD\((.*)\)/g, 'inputRDDs($1)');
        // 顶层：outputrdd.put("b",XX) => outputRDD("b",XX)
        // 子图层：outputrdd.put("b",XX) => outputRDD("b",XX) => rddMap.put("b",XX)
        script = script.replace(/outputrdd\.put\((.*)\)/g, 'outputRDD($1)');
        if(recursion){
            script = script.replace(/outputRDD\((.*)\)/g, 'rddMap.put($1)');
        }

        //绑定，替换常规参数变量。
        script=compileBinding(script,node,com);
        //扩展函数处理
        script=compileExtendFunc(script,node,com);

        // 替换NodePath
        script = script.replace(/<#NodePath#>/g, recursion ? (recursion + "/" + node.id) : ("/" + node.id));

        //对象级、全局级代码
        //<#globalLevel#> -> <#zzjzGlobalLevel#> -> <%#zzjzGlobalLevel#%>
        //<#objectLevel#> -> <#zzjzObjectLevel#> -> <%#zzjzObjectLevel#%>
        script = script.replace(/<#globalLevel#>/g, "<%#zzjzGlobalLevel#%>");
        script = script.replace(/<#\/globalLevel#>/g, "<%#/zzjzGlobalLevel#%>");
        script = script.replace(/<#objectLevel#>/g, "<%#zzjzObjectLevel#%>");
        script = script.replace(/<#\/objectLevel#>/g, "<%#/zzjzObjectLevel#%>");
        script = script.replace(/<#zzjzGlobalLevel#>/g, "<%#zzjzGlobalLevel#%>");
        script = script.replace(/<#\/zzjzGlobalLevel#>/g, "<%#/zzjzGlobalLevel#%>");
        script = script.replace(/<#zzjzOjectLevel#>/g, "<%#zzjzObjectLevel#%>");
        script = script.replace(/<#\/zzjzObjectLevel#>/g, "<%#/zzjzObjectLevel#%>");

        //分支。需要匹配的模式有：<#zzjzIf="分支判断表达式"#>...<#/zzjzIf#>。该模式需要支持嵌套。
        //循环。需要匹配的模式有：<#zzjzRepeat="data in XX"#>...<#/zzjzRepeat#>。该模式需要支持嵌套。
        script=compileBranch(script,node,com);
        for (var fname in com.template.compileFuncObj) {
            if (fname && com.template.compileFuncObj[fname] && typeof(com.template.compileFuncObj[fname]) == "function") {
                _scope[fname] = undefined;
            }
        }
        // 子图。需要匹配的模式有：<#zzjzDag="zzjzParam.子图参数"#>和<#zzjzCallDag="zzjzParam.子图参数"#>。
        script=compileSubDag(script,node,com);

        //查找对象级代码
        //提取<%#zzjzObjectLevel#%>标签
        var objLevels = [], idxS = 0, idxE = 0;
        while ((idxS = script.indexOf("<%#zzjzObjectLevel#%>", idxE)) != -1) {
            if ((idxE = script.indexOf("<%#/zzjzObjectLevel#%>", idxS)) > idxS) {
                var s = script.substring(idxS + 21, idxE);
                objLevels.push(s);
            } else {
                //<%#zzjzObjectLevel#%>和<%#/zzjzObjectLevel#%>不匹配，中断编译直接返回空结果
                return new CompileContext();
            }
        }
        idxS = 0, idxE = 0;
        while ((idxS = script.indexOf("<%#zzjzObjectLevel#%>")) != -1) {
            if ((idxE = script.indexOf("<%#/zzjzObjectLevel#%>", idxS)) > idxS) {
                script = script.substr(0, idxS) + script.substr(idxE + 22);
            } else {
                break;
            }
        }

        //修改节点ID，统一命名空间，并输出
        context.script = NodeTemplate.replace(/<#NodeScript#>/g, script.replace(/\$/g,"$$$$")).replace(/<#NodeId#>/g, node.id)
            .replace(/<#ObjectLevel#>/g, objLevels.join("\n").replace(/\$/g,"$$$$")).replace(/<#NodePath#>/g, recursion ? (recursion + "/" + node.id) : ("/" + node.id));
        context.script=compileReserved(context.script,node,recursion);
        context.script = compileBinding(context.script, node,com);
        context.script=compileBranch(context.script,node,com);
        context.callScript = CallNodeTemplate.replace(/<#NodeId#>/g, node.id);
        if (recursion && com.sn === ConfigConst.ComLib.PresetComSN.SN_VirtualSourceCom) {
            //子图嵌套中的虚拟源算子节点
            context.callScript = context.callScript.replace(/<#InputRddMap#>/g, "inputRDDs");
        } else {
            context.callScript = context.callScript.replace(/<#InputRddMap#>/g, "rddMap");
        }
        context.inputRddNames = com.template.getParamValuesByType(com.template, node.paramSetting, ConfigConst.ComModel.Type_Rdd);
        context.interpreterGroup=com.template.interpreterGroup?com.template.interpreterGroup:DEFAULT_INTERPRETER_GROUP;
        return context;
    }

    function preCompileExtend(comObject, node, recursion) {
        return comObject.template.script;
    }

    function postCompileExtend(comObject, node, recursion, script) {
        return script;
    }

    function compileBinding(script, node,com){
        var result="";
        //替换，替换常规参数变量。
        // 需要匹配的模式有：<#zzjzParma[.参数名[参数项索引]]#>
        // 首先查找<#zzjzParam#>并替换
        // 向下兼容：将<#jsonparam#>替换成<#zzjzParam#>，然后再完成替换
        result = script.replace(/<#jsonparam#>/g, "<#zzjzParam#>");
        var zzjzParam = abandonSubDagSetting(node.paramSetting,com.template.paramList);
        //再进行替换
        if (result.indexOf("<#zzjzParam#>") >= 0) {
            var zpsetting=Utility.stringifySortly(zzjzParam).replace(/\$/g,"$$$$");
            result = result.replace(/"""<#zzjzParam#>"""/g, '"""' + zpsetting + '"""');
            result = result.replace(/""<#zzjzParam#>""/g, '"""' + zpsetting + '"""');
            result = result.replace(/"<#zzjzParam#>"/g, '"""' + zpsetting + '"""');
        }
        //其次查找<#zzjzParam.。记录数据结构：[参数变量名]
        var pList = [], pIdx = 0;
        while (pIdx >= 0 && pIdx < result.length) {
            pIdx = result.indexOf("<#zzjzParam.", pIdx);
            if (pIdx >= 0) {
                //查找结尾符#>
                var eIdx = result.indexOf("#>", pIdx);
                if (eIdx > pIdx) {
                    var p = result.substring(pIdx + 2, eIdx);
                    if (!Utility.contains(pList, p)) {
                        pList.push(p);
                    }
                    pIdx = eIdx + 2;
                } else {
                    console.warn("ComLib执行%s时，分析节点脚本异常，有不完整的节点参数表达式：%s"
                        , "compileNode", com.result.substr(pIdx, 30));
                    pIdx = -1;
                }
            }
        }
        //逐个替换
        angular.forEach(pList, function (pkey) {
            //计算参数表达式
            var pvalue = "";
            try {
                pvalue = eval(pkey);zzjzParam.dbtype
            } catch (e) {
                console.warn("ComLib执行%s时，替换节点参数%s异常，%s", "compileNode", pkey, e);
            }
            var pvaltype = typeof(pvalue);
            if (pvaltype === "number" || pvaltype === "boolean") {
                result = result.replace(new RegExp("<#" + pkey + "#>", "g"), pvalue);
            } else if (pvaltype === "string") {
                pvalue=pvalue.replace(/\$/g,"$$$$");
                result = result.replace(new RegExp('"""<#' + pkey + '#>"""', "g"), '"""' + pvalue + '"""');
                result = result.replace(new RegExp('""<#' + pkey + '#>""', "g"), '"""' + pvalue + '"""');
                result = result.replace(new RegExp('"<#' + pkey + '#>"', "g"), '"""' + pvalue + '"""');
                result = result.replace(new RegExp('<#' + pkey + '#>', "g"), pvalue);
            } else if (pvaltype === "object") {
                var pvaltext = Utility.stringifySortly(pvalue).replace(/\$/g,"$$$$");
                result = result.replace(new RegExp('"""<#' + pkey + '#>"""', "g"), '"""' + pvaltext + '"""');
                result = result.replace(new RegExp('""<#' + pkey + '#>""', "g"), '"""' + pvaltext + '"""');
                result = result.replace(new RegExp('"<#' + pkey + '#>"', "g"), '"""' + pvaltext + '"""');
            } else if (pvaltype === "undefined") {
                result = result.replace(new RegExp('"""<#' + pkey + '#>"""', "g"), '"""' + '"""');
                result = result.replace(new RegExp('""<#' + pkey + '#>""', "g"), '"""' + '"""');
                result = result.replace(new RegExp('"<#' + pkey + '#>"', "g"), '"""' + '"""');
            }
        });
        //替换，替换特定参数变量。
        // 需要匹配的模式有：<#zzjzRddName#>
        // 首先查找<#zzjzRddName#>并替换成算子名称
        // 向下兼容：将<#rddtablename#>替换成<#zzjzRddName#>，然后再完成替换
        // Rdd名称格式：节点名称+下划线+节点的原始ID或节点ID。节点原始ID用于复合算子的情况。
        result = result.replace(/<#rddtablename#>/g, "<#zzjzRddName#>");
        result = result.replace(/<#zzjzRddName#>/g, node.displayName + "_" + (node.originalId?node.originalId:node.id));
        result = result.replace(/<#NodeId#>/g, node.id);

        return result;
    }

    function abandonSubDagSetting(paramSetting,paramList,result){
        if(!paramSetting) return {};
        if(!paramList) return paramSetting;
        if(!result) result=angular.copy(paramSetting);
        for(var i=0;i<paramList.length;i++){
            var param=paramList[i];
            if(param.type==ConfigConst.ComModel.Type_Dag){
                //删除子图
                result[param.key]=null;
                delete result[param.key];
            }else if(param.element==ConfigConst.ComModel.Element_MulSelect&&param.paramList){
                var val;
                if(result[param.key]&& (val=result[param.key].value)){
                    //查找对应的MulOption
                    for(var j=0;j<param.paramList.length;j++){
                        if(param.paramList[j].default==val){
                            abandonSubDagSetting(result[param.key],param.paramList[j].paramList,result[param.key]);
                        }
                    }
                }
            }else if(param.element==ConfigConst.ComModel.Element_MulList&&param.paramList){
                if(result[param.key]){
                    //分行查找对应的子项
                    var val=result[param.key];
                    if(val){
                        for(var j=0;j<val.length;j++){
                            abandonSubDagSetting(val[j],param.paramList,val[j]);
                        }
                    }
                }
            }else if(param.paramList&&param.paramList.length>0){
                abandonSubDagSetting(result[param.key],param.paramList,result[param.key]);
            }
        }
        return result;
    }

    function compileBranch(script,node,com){
        var result="";
        //分支。需要匹配的模式有：<#zzjzIf="分支判断表达式"#>...<#/zzjzIf#>。该模式需要支持嵌套。
        //循环。需要匹配的模式有：<#zzjzRepeat="data in XX"#>...<#/zzjzRepeat#>。该模式需要支持嵌套。
        var dom = makeScriptDom(script);
        _scope.zzjzParam = node.paramSetting;
        _scope.zzjzOperator=com;
        //添加编译函数
        for (var fname in com.template.compileFuncObj) {
            if (fname && com.template.compileFuncObj[fname] && typeof(com.template.compileFuncObj[fname]) == "function") {
                _scope[fname] = com.template.compileFuncObj[fname];
            }
        }

        /*var domTpl = angular.element("<div>").html(dom.domStr).contents();
        var domScript = null;
        try {
            var domComTpl = $compile(domTpl)(_scope);
            try {
                _scope.$digestForce();
            } catch (ex) {
                console.warn("算子%s执行compileNode异常：%s", com.name, ex);
            }
            domScript = domComTpl.prevObject[0].innerHTML;
        } catch (ex) {
            console.warn("算子%s执行compileNode.$compile异常：%s", com.name, ex);
        }
        result = translateDomScript(dom, domScript);*/
        result = $zzjzCompile(script,_scope);
        _scope.zzjzParam = undefined;
        _scope.zzjzOperator=undefined;
        return result;
    }

    function compileReserved(script,node,recursion){
        //基本输入输出函数，并向下兼容
        // z.rdd("XX") => inputRDD("XX") => inputRDDs("XX")
        script = script.replace(/z\.rdd\((.*)\)/g, 'inputRDDs($1)');
        script = script.replace(/inputRDD\((.*)\)/g, 'inputRDDs($1)');
        // 顶层：outputrdd.put("b",XX) => outputRDD("b",XX)
        // 子图层：outputrdd.put("b",XX) => outputRDD("b",XX) => rddMap.put("b",XX)
        script = script.replace(/outputrdd\.put\((.*)\)/g, 'outputRDD($1)');
        if(recursion){
            script = script.replace(/outputRDD\((.*)\)/g, 'rddMap.put($1)');
        }

        //替换，替换常规参数变量。
        // 需要匹配的模式有：<#zzjzParma[.参数名[参数项索引]]#>
        // 首先查找<#zzjzParam#>并替换
        // 向下兼容：将<#jsonparam#>替换成<#zzjzParam#>，然后再完成替换
        script = script.replace(/<#jsonparam#>/g, "<#zzjzParam#>");
        return script;
    }

    function compileSubDag(script,node,com,recursion){
        var result=script;
        // 子图。需要匹配的模式有：<#zzjzDag="zzjzParam.子图参数"#>和<#zzjzCallDag="zzjzParam.子图参数"#>。
        var pList = matchExpression(script, "zzjzDag");
        //pList的数据结构：[{match:匹配模式,statement:子图参数表达式}]
        var zzjzParam = node.paramSetting;
        //逐个子图参数表达式，创建子图脚本
        angular.forEach(pList, function (pkey) {
            //计算子图表达式
            var pvalue = "", novalue = false;
            try {
                pvalue = eval(pkey.statement);
            } catch (e) {
                console.warn("ComLib执行%s时，子图参数%s异常，%s", "compileNode", pkey.statement, e);
                novalue = true;
            }
            if (typeof(pvalue) === "object" && pvalue.nodes && pvalue.edges) {
                //已提取子图
                var nodeList = preCompileDag(pvalue);
                var heads=Dag.findHeadNodes(pvalue);
                if (nodeList.length > 0) {
                    var subcontext = compileNodeList(node.id, pvalue, nodeList,heads, recursion ? (recursion + "/" + node.id) : ("/" + node.id));
                    if (subcontext) {
                        result = result.replace(new RegExp(pkey.match, "g"), subcontext.script);
                        result = result.replace(new RegExp(pkey.match.replace("zzjzDag", "zzjzCallDag"), "g"), subcontext.callScript);
                    } else {
                        novalue = true;
                    }
                }
            } else {
                novalue = true;
            }
            if (novalue) {
                result = result.replace(new RegExp(pkey.match, "g"), "");
                result = result.replace(new RegExp(pkey.match.replace("zzjzDag", "zzjzCallDag"), "g"), "");
            }
        });
        return result;
    }

    function compileExtendFunc(script,node,com,recursion){
        //逐项调用扩展函数，并替换
        var result=script;
        //扩展，根据脚本中扩展函数调用compileFunc相应JS完成自定义脚本扩展。函数会自动传入zzjzParam参数。
        // 需要匹配的模式有：<#zzjzFunc="函数名"#>。
        //pList的数据结构：[{match:匹配模式,statement:扩展函数名}]
        var pList = matchExpression(script, "zzjzFunc");
        //检查是否已生成扩展函数对象
        // if(!com.template.compileFuncObj){
        //     com.compileFuncObj=makeCompileFuncObj(com);
        // }
        angular.forEach(pList, function (pkey) {
            var str = "";
            try {
                str = com.template.compileFuncObj[pkey.statement](zzjzParam);
            } catch (e) {
                console.error("ComLib执行%s时，调用扩展函数%s异常：%s", "compileNode", pkey.statement, e);
            }
            result = result.replace(new RegExp(pkey.match, "g"), str);
        });
        return result;
    }

    function makeScriptDom(script) {
        // <#zzjzIf="XX"#> => <zzjz ng-if="XX">
        // <#zzjzRepeat="xx in XX"#> => <zzjz ng-repeat="xx in XX">
        // <#/zzjzIf#> => </zzjz> ,<#/zzjzRepeat#> => </zzjz>
        // <#xx.yy#> => {{::xx.yy}}
        // <#zzjzDag="XX"#>和<#zzjzCallDag="XX"#> => __ZZJZ_SCRIPTTEXT_XX__ （XX是顺序的数字，且不重复）
        // 其他内容 => __ZZJZ_SCRIPTTEXT_XX__ （XX是顺序的数字，且不重复）
        if (!script || script.length == 0) return {dom: [], domStr: ""};
        var dom = [], sIdx = 0, eIdx = 0, textNo = 1;
        while (sIdx >= 0 && sIdx < script.length) {
            eIdx = script.indexOf("<#", sIdx);
            if (eIdx > sIdx) {
                var text = {
                    start: sIdx,
                    end: eIdx,
                    original: script.substring(sIdx, eIdx),
                    replace: "__ZZJZ_SCRIPTTEXT_" + (textNo++) + "__",
                    textual: true
                };
                dom.push(text);
            } else if (eIdx < 0) {
                var text = {
                    start: sIdx,
                    end: script.length,
                    original: script.substring(sIdx),
                    replace: "__ZZJZ_SCRIPTTEXT_" + (textNo++) + "__",
                    textual: true
                };
                dom.push(text);
                break;
            }
            // 接下来字符是 <#
            if (script.indexOf("<#zzjzIf=", eIdx) == eIdx) {
                // 查找其后的 #>
                sIdx = script.indexOf("#>", eIdx);
                if (sIdx > 0) {
                    var text = {
                        start: eIdx,
                        end: sIdx + 2,
                        original: script.substring(eIdx, sIdx + 2),
                        replace: "<zzjz ng-if=" + script.substring(eIdx + 9, sIdx).trim() + ">",
                        textual: false
                    };
                    dom.push(text);
                } else {
                    console.warn("ComLib执行%s时，分析节点脚本异常，有不完整的节点参数表达式：%s"
                        , "makeScriptDom", script.substring(eIdx, 30));
                    break;
                }
                sIdx += 2;
            } else if (script.indexOf("<#zzjzRepeat=", eIdx) == eIdx) {
                // 查找其后的 #>
                sIdx = script.indexOf("#>", eIdx);
                if (sIdx > 0) {
                    var text = {
                        start: eIdx,
                        end: sIdx + 2,
                        original: script.substring(eIdx, sIdx + 2),
                        replace: "<zzjz ng-repeat=" + script.substring(eIdx + 13, sIdx).trim() + ">",
                        textual: false
                    };
                    dom.push(text);
                } else {
                    console.warn("ComLib执行%s时，分析节点脚本异常，有不完整的节点参数表达式：%s"
                        , "makeScriptDom", script.substring(eIdx, 30));
                    break;
                }
                sIdx += 2;
            } else if (script.indexOf("<#/zzjz", eIdx) == eIdx) {
                // 查找其后的 #>
                sIdx = script.indexOf("#>", eIdx);
                if (sIdx > 0) {
                    var text = {
                        start: eIdx,
                        end: sIdx + 2,
                        original: script.substring(eIdx, sIdx + 2),
                        replace: "</zzjz>",
                        textual: false
                    };
                    dom.push(text);
                } else {
                    console.warn("ComLib执行%s时，分析节点脚本异常，有不完整的节点参数表达式：%s"
                        , "makeScriptDom", script.substring(eIdx, 30));
                    break;
                }
                sIdx += 2;
            } else if (script.indexOf("<#zzjzDag=", eIdx) == eIdx) {
                // 查找其后的 #>
                sIdx = script.indexOf("#>", eIdx);
                if (sIdx > 0) {
                    var text = {
                        start: eIdx,
                        end: sIdx + 2,
                        original: script.substring(eIdx, sIdx + 2),
                        replace: "__ZZJZ_SCRIPTTEXT_" + (textNo++) + "__",
                        textual: true
                    };
                    dom.push(text);
                } else {
                    console.warn("ComLib执行%s时，分析节点脚本异常，有不完整的节点参数表达式：%s"
                        , "makeScriptDom", script.substring(eIdx, 30));
                    break;
                }
                sIdx += 2;
            } else if (script.indexOf("<#zzjzCallDag=", eIdx) == eIdx) {
                // 查找其后的 #>
                sIdx = script.indexOf("#>", eIdx);
                if (sIdx > 0) {
                    var text = {
                        start: eIdx,
                        end: sIdx + 2,
                        original: script.substring(eIdx, sIdx + 2),
                        replace: "__ZZJZ_SCRIPTTEXT_" + (textNo++) + "__",
                        textual: true
                    };
                    dom.push(text);
                } else {
                    console.warn("ComLib执行%s时，分析节点脚本异常，有不完整的节点参数表达式：%s"
                        , "makeScriptDom", script.substring(eIdx, 30));
                    break;
                }
                sIdx += 2;
            } else {
                // 查找其后的 #>
                sIdx = script.indexOf("#>", eIdx);
                if (sIdx > 0) {
                    var text = {
                        start: eIdx,
                        end: sIdx + 2,
                        original: script.substring(eIdx, sIdx + 2),
                        replace: "{{::" + script.substring(eIdx + 2, sIdx) + "}}",
                        textual: false
                    };
                    if(Utility.some(ReservedKeywords4ScriptDom,function(x){return x==text.original;})){
                        text.textual=true;
                        text.replace="__ZZJZ_SCRIPTTEXT_" + (textNo++) + "__";
                    }
                    dom.push(text);
                } else {
                    console.warn("ComLib执行%s时，分析节点脚本异常，有不完整的节点参数表达式：%s"
                        , "makeScriptDom", script.substring(eIdx, 30));
                    break;
                }
                sIdx += 2;
            }
        }
        // 根据dom生成最后的文本
        var str = "";
        angular.forEach(dom, function (x) {
            str += x.replace;
        });
        return {dom: dom, domStr: str};
    }

    function translateDomScript(dom, html) {
        if (!dom || !dom.dom || !html) return "";
        var sIdx = 0, eIdx = 0;
        //删除所有的注释内容
        while (sIdx >= 0 && sIdx < html.length) {
            sIdx = html.indexOf("<!--", sIdx);
            if (sIdx >= 0) {
                eIdx = html.indexOf("-->", sIdx);
                if (eIdx >= 0) {
                    html = html.substring(0, sIdx) + html.substring(eIdx + 3);
                } else {
                    html = html.substring(0, sIdx);
                }
            }
        }
        // 删除所有的<span class="ng-scope">和</span>
        html = html.replace(/<span class=\"ng\-scope\">/g, "");
        html = html.replace(/<span class=\"ng\-binding ng\-scope\">/g, "");
        html = html.replace(/<span class=\"ng\-scope ng\-binding\">/g, "");
        html = html.replace(/<\/span>/g, "");
        html = html.replace(/<\/zzjz>/g, "");
        angular.forEach(dom.dom, function (x) {
            if (x.textual) {
                html = html.replace(new RegExp(x.replace, "g"), x.original.replace(/\$/g,"$$$$"));
            } else {
                var exp = x.replace.substring(0, x.replace.length - 1) + ' class="ng-binding ng-scope">';
                html = clearStrInText(html, exp);
                exp = x.replace.substring(0, x.replace.length - 1) + ' class="ng-scope">';
                html = clearStrInText(html, exp);
            }
        });
        return html;
    }

    function clearStrInText(text, str) {
        if (!text || !str) return text;
        var len = -1;
        while (text.length != len) {
            len = text.length;
            text = text.replace(str, "");
        }
        return text;
    }

    /**
     * 在脚本文本中查找指定格式的内容，并返回找到的匹配内容
     * @param script 脚本文本
     * @param matchStr 匹配内容为<#matchStr="XXX"#>
     * @returns {Array} 返回引号括起来的内容
     */
    function matchExpression(script, matchStr) {
        var pList = [];//pList的数据结构：[{match:匹配模式,statement:扩展函数名}]
        var pIdx = 0;
        var zzjzExt = "<#" + matchStr + "=";
        var extLength = zzjzExt.length;
        while (pIdx >= 0 && pIdx < script.length) {
            pIdx = script.indexOf(zzjzExt, pIdx);
            if (pIdx >= 0) {
                var eIdx = script.indexOf("#>", pIdx);
                if (eIdx > pIdx) {
                    var statement = script.substring(pIdx + extLength, eIdx).trim();
                    //检查是否以成对的单引号或双引号括起来，并提取其中的内容
                    statement = getQuoteContent(statement);
                    //加入pList列表
                    if (statement && statement.length > 0) {
                        var match = {
                            match: script.substring(pIdx, eIdx + 2),
                            statement: statement
                        };
                        if (!Utility.contains(pList, match)) {
                            pList.push(match);
                        }
                    } else {
                        console.warn("ComLib执行%s时，分析节点脚本异常，有不完整的节点扩展表达式：%s"
                            , "compileNode", script.substr(pIdx, 30));
                    }
                } else {
                    console.warn("ComLib执行%s时，分析节点脚本异常，有不完整的节点扩展表达式：%s"
                        , "compileNode", script.substr(pIdx, 30));
                    pIdx = -1;
                }
                pIdx += extLength;
            }
        }
        return pList;
    }

    /**
     * 创建算子的编译函数对象。为避免命名空间冲突，创建以下格式的函数对象：
     * function (){  自定义扩展函数列表...
             *     this.XX=XX;}
     */
    function makeCompileFuncObj(com) {
        if (!com.compileFunc || com.compileFunc.length == 0) {
            return;
        }
        var match = /function\s+([a-zA-Z_$][0-9a-zA-Z_$]+)\s*\(/g;
        var funcNames = [];
        var func = match.exec(com.compileFunc);
        while (match.lastIndex > 0) {
            funcNames.push(func[1]);
            func = match.exec(com.compileFunc);
        }
        var funcStr = "new function(){\n" + com.compileFunc + "\n";
        angular.forEach(funcNames, function (func) {
            funcStr += "com." + func + "=" + func + ";\n";
        });
        funcStr += "}";
        var obj = null;
        try {
            obj = eval(funcStr);
        } catch (e) {
            console.error("ComLib执行%s时异常：%s", "makeCompileFuncObj", e);
        }
        return obj;
    }

    /**
     * 获取包含在成对单引号或双引号中的内容，如果原始文本不符合则返回null
     * @str str包含引号的原始文本
     * @returns {*}成对单引号或双引号中的内容
     */
    function getQuoteContent(str) {
        if (str.length <= 1) {
            return null;
        }
        var quote = str[0];
        if (quote == "\"" || quote == "'") {
            var eidx = str.indexOf(quote, 1);
            if (eidx > 1) {
                return str.substring(1, eidx);
            }
        }
        return null;
    }

    //原型方法
    if (Com.prototype.__initCom__ !== true) {
        Com.create = create;
        Com.DEFAULT_INTERPRETER_GROUP="spark";
        Com.prototype.load = load;
        Com.prototype.save = save;
        Com.prototype.pack = pack;
        Com.prototype.addParam = addParam;
        Com.prototype.removeParam = removeParam;
        Com.prototype.lifeCycle = lifeCycle;
        Com.prototype.compile = compile;
        Com.prototype.compileNode = compileNode;
        Com.prototype.preCompileExtend = preCompileExtend;
        Com.prototype.postCompileExtend = postCompileExtend;
        Com.prototype.matchExpression=matchExpression;
        Com.prototype.translateDomScript=translateDomScript;
        Com.prototype.makeScriptDom=makeScriptDom;
        Com.prototype.compileBinding=compileBinding;
        Com.prototype.__initCom__ = true;
    }
    //初始化或构造函数
    if (argn == 1) {
        load(arguments[0]);
    }
}

/**
 * 分析流节点类
 * @constructor
 */
function ComNode(data) {
    var nodeSelf = this;

    this.id = undefined;
    this.componentId = undefined;
    //this.component = undefined;
    this.paramSetting = undefined;

    function save() {
        var copy = angular.extend({}, nodeSelf);
        delete copy.component;
        return copy;
    }

    function load(jsonObj) {
        angular.extend(nodeSelf, jsonObj);
    }

    //原型方法
    if (ComNode.prototype.__initComNode__ !== true) {
        ComNode.prototype.save = save;
        ComNode.prototype.load = load;
        ComNode.prototype.__initComNode__ = true;
    }

    if (data) {
        load(data);
    } else {
        nodeSelf.id = Utility.newNodeId();
    }
}

/**
 * 节点执行脚本对象编译
 * @constructor
 */
function CompileContext() {
    this.script = "";
    this.callScript = "";
    this.inputRddNames = [];
    this.outputRddNames = [];
    this.interpreter = undefined;
    this.interpreterGroup=undefined;
    this.language = undefined;
    this.comType = undefined;
}

function ViewCom() {
    //类继承
    Com.apply(this, arguments);

    //成员定义
    var scriptTmpl="\
<#objectLevel#>val inputRDDList=new mutable.HashMap[String, Any]\n<#/objectLevel#>\
    inputRDDs.foreach((A)=>{inputRDDList.put(A._1,A._2)})\n\
    Seq(<#AllRdd#>).foreach(rddname=>if(!inputRDDs.contains(rddname)) throw new NoSuchElementException(\"未找到\"+rddname))\n\
    showRDDs(\"<#NodePath#>\",inputRDDs,Seq(<#AllRdd#>),<#Recursion#>)";
    var linkageTmpl='\
<#globalLevel#><#zzjzSubDag#><#/globalLevel#>\n\
z.angularUnwatch("<#NodePath#>")\n\
println("angularUnwatch <#NodePath#>")\n\
z.angularBind("<#NodePath#>", "")\n\
z.angularWatch("<#NodePath#>", (before:Any, after:Any)=>{\n\
  val gson=new com.google.gson.Gson()\n\
  try{\n\
    //syslog.write("angularWatch <#NodePath#> received: "+after.toString)\n\
    val aftObj=gson.fromJson(after.toString,classOf[java.util.HashMap[String,Any]])\n\
    val conjP=new java.util.HashMap[String,Any]()\n\
    conjP.put("<#LinkageNodeId#>",aftObj)\n\
    //syslog.write("angularWatch <#NodePath#> flowParams: "+gson.toJson(conjP))\n\
    //if(inputRDDList==null||inputRDDList.size==0) {syslog.write("angularWatch <#NodePath#> inputRDDList无输入数据");\n\
    //}else{inputRDDList.foreach((A)=>{syslog.write("angularWatch <#NodePath#> inputRDDList==>"+A._1+"："+A._2+"，"+A._2.getClass)});}\n\
    importAllRDDs(ZZJZF_<#FlowId#>(inputRDDList,conjP))\n\
    //syslog.write("angularWatch <#NodePath#> return: ")\n\
  }catch{\n\
    case ex:Throwable => {logger.error("angualarWatch <#FlowId#><#NodePath#> exception: "+ex.toString())\n\
      //syslog.write("angualarWatch <#NodePath#> exception: "+ex.toString())\n\
      val conjParam = new java.util.HashMap[String, Object]\n\
      conjParam.put("__PID__","<#NodeId#>")\n\
      conjParam.put("__ERR__",ex.toString)\n\
      z.angularBind("ZZJZRddResult", gson.toJson(conjParam))\n\
    }\n\
  }\n\
})\n\
println("angularWatch <#NodePath#>")\n';
    var selfViewCom=this;

    //函数定义
    //override父类方法，在compileNode之前执行
    function preCompileExtend(comObject, node, recursion){
        //获取所有RDD类型参数的值，包括所引用的算子参数
        var rddNameList=comObject.template.getParamValuesByType(comObject.template, node.paramSetting,ConfigConst.ComModel.Type_Rdd);
        if(rddNameList&&rddNameList.length>0) {
            var rddNames = '"' + rddNameList.join('","') + '"';
            var tmpl = Utility.stringEndWith(comObject.template.script, "\n") ? comObject.template.script : (comObject.template.script + "\n");
            var linkageScript=getLinkageScript(comObject,node,recursion);
            if(linkageScript){
                tmpl="<#objectLevel#>"+linkageScript+"<#/objectLevel#>\n"+tmpl;
            }
            return tmpl + scriptTmpl.replace(/<#AllRdd#>/g, rddNames).replace(/<#Recursion#>/g, recursion ? "true" : "false")
                .replace(/<#NodePath#>/g,recursion?(recursion+"/"+node.id):("/"+node.id));
        }else{
            return comObject.template.script;
        }
    }

    function getLinkageScript(comObject, node, recursion){
        if(!node|| !node.paramSetting || !node.paramSetting.chartList || !node.paramSetting.chartList.length)
            return "";
        var result="";
        for(var i=0;i<node.paramSetting.chartList.length;i++){
            var chart=node.paramSetting.chartList[i];
            if(!chart|| !chart.linkage || !chart.linkage.nodes || !chart.linkage.nodes.length) {
                continue;
            }
            //生成子图脚本
            var nodeList = preCompileDag(chart.linkage);
            var heads=Dag.findHeadNodes(chart.linkage);
            if (nodeList.length > 0) {
                var currentDagId=node.id+"_"+chart.layout;
                var subcontext = compileNodeList(currentDagId, chart.linkage, nodeList,heads, recursion?(recursion+"/"+currentDagId):("/"+currentDagId));
                if (subcontext) {
                    var linkageScript=linkageTmpl.replace("<#zzjzSubDag#>",subcontext.script);
                    linkageScript = linkageScript.replace(/<#NodePath#>/g,recursion?(recursion+"/"+currentDagId):("/"+currentDagId))
                        .replace(/<#Layout#>/g,chart.layout).replace(/<#FlowId#>/g,currentDagId);
                    //查找必要的联动筛选节点
                    var linkageCom=_self.ComLibSrv.getComponentBySn(ConfigConst.ComLib.PresetComSN.LinkageSelectedData);
                    if(linkageCom instanceof Com){
                        for(var j=0;j<nodeList.length;j++){
                            if(nodeList[j].componentId==linkageCom.id){
                                linkageScript=linkageScript.replace(/<#LinkageNodeId#>/g,nodeList[j].id);
                                break;
                            }
                        }
                    }
                    result+=linkageScript;
                } else {
                    console.warn("节点子图编译错误。%o，子图：%o",node,chart.linkage);
                    continue;
                }
            }
        }
        return result;
    }

    /**
     * override父类方法，在compileNode之后执行
     * @param comObject
     * @param node
     * @param recursion
     * @returns {string}
     */
    function postCompileExtend(comObject, node, recursion, context) {
        // 分析所有子图中的虚拟数据输入节点，将输入的rdd也作为当前节点的输入rdd
        // 查找虚拟数据输入算子
        var inputCom=_self.ComLibSrv.getComponentBySn(ConfigConst.ComLib.PresetComSN.SN_VirtualSourceCom);
        if(inputCom instanceof Com) {
            if (node && node.paramSetting && node.paramSetting.chartList && node.paramSetting.chartList.length > 0) {
                for (var i = 0, chartlen = node.paramSetting.chartList.length; i < chartlen; i++) {
                    var chart = node.paramSetting.chartList[i];
                    if (chart && chart.linkage && chart.linkage.nodes && chart.linkage.nodes.length > 0) {
                        for (var j = 0, nodelen = chart.linkage.nodes.length; j < nodelen; j++) {
                            var nd=chart.linkage.nodes[j];
                            if(nd&&nd.componentId==inputCom.id&&nd.paramSetting){
                                var rddList=inputCom.template.getParamValuesByType(inputCom.template, nd.paramSetting, ConfigConst.ComModel.Type_Rdd);
                                Utility.mergeArrays(context.inputRddNames,rddList);
                                break;
                            }
                        }
                    }
                }
            }
        }
        return context;
    }

    //原型方法
    if (ViewCom.prototype.__initViewCom__!==true) {
        ViewCom.prototype.preCompileExtend = preCompileExtend;
        ViewCom.prototype.postCompileExtend = postCompileExtend;
        ViewCom.prototype.__initViewCom__ = true;
    }

    //初始化或构造函数
    var argn = arguments.length;
    selfViewCom.type=ConfigConst.ComLib.ComType_View;
    if (argn == 1) {
        Com.prototype.load(selfViewCom,arguments[0]);
    }
}
ViewCom.prototype = new Com();    //类继承

/**
 * 图元算子模板类。该类只能通过new方法实例化：new ChartComTemplate(jsonObj)
 * @constructor
 */
function ChartComTemplate() {
    var templateSelf = this;

    //定义访问器
    /**
     * 为优化算子模板的序列化而定义成员和访问器，仅部分访问器会被序列化
     */
    Object.defineProperties(this, {
        //不需要序列化的成员
        "_script": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "_compileFunc": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "_renderFunc": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "_initFunc": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "_eventsFunc": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "_loadFunc": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "_closeFunc": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "_case": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "_caseMark": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "_defineTemplate": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "_defineTemplateUrl": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "_applyTemplate": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "_applyTemplateUrl": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "_interpreter": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "_language": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "compileFuncObj": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "renderFuncObj": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        //记录变更状态的成员及访问器
        "_changed": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "changed": {
            enumerable: false,
            get: function () {
                if (templateSelf._changed) {
                    return true;
                }
                if (templateSelf.paramList && templateSelf.paramList.length > 0) {
                    for (var i = 0; i < templateSelf.paramList.length; i++) {
                        if (templateSelf.paramList[i].changed) {
                            return true;
                        }
                    }
                }
                return false;
            }
        },
        //需要序列化的访问器
        "script": {
            enumerable: true,
            get: function () {
                return templateSelf._script;
            },
            set: function (val) {
                if (templateSelf._script != val) {
                    templateSelf._script = val;
                    templateSelf._changed = true;
                }
            }
        },
        "compileFunc": {
            enumerable: true,
            get: function () {
                return templateSelf._compileFunc;
            },
            set: function (val) {
                if (templateSelf._compileFunc != val) {
                    templateSelf._compileFunc = val;
                    templateSelf._changed = true;
                }
            }
        },
        "renderFunc": {
            enumerable: true,
            get: function () {
                return templateSelf._renderFunc;
            },
            set: function (val) {
                if (templateSelf._renderFunc != val) {
                    templateSelf._renderFunc = val;
                    templateSelf._changed = true;
                }
            }
        },
        "initFunc": {
            enumerable: true,
            get: function () {
                return templateSelf._initFunc;
            },
            set: function (val) {
                if (templateSelf._initFunc != val) {
                    templateSelf._initFunc = val;
                    templateSelf._changed = true;
                }
            }
        },
        "eventsFunc": {
            enumerable: true,
            get: function () {
                return templateSelf._eventsFunc;
            },
            set: function (val) {
                if (templateSelf._eventsFunc != val) {
                    templateSelf._eventsFunc = val;
                    templateSelf._changed = true;
                }
            }
        },
        "loadFunc": {
            enumerable: true,
            get: function () {
                return templateSelf._loadFunc;
            },
            set: function (val) {
                if (templateSelf._loadFunc != val) {
                    templateSelf._loadFunc = val;
                    templateSelf._changed = true;
                }
            }
        },
        "closeFunc": {
            enumerable: true,
            get: function () {
                return templateSelf._closeFunc;
            },
            set: function (val) {
                if (templateSelf._closeFunc != val) {
                    templateSelf._closeFunc = val;
                    templateSelf._changed = true;
                }
            }
        },
        "case": {
            enumerable: true,
            get: function () {
                return templateSelf._case;
            },
            set: function (val) {
                if (templateSelf._case != val) {
                    templateSelf._case = val;
                    templateSelf._changed = true;
                }
            }
        },
        "caseMark": {
            enumerable: true,
            get: function () {
                return templateSelf._caseMark;
            },
            set: function (val) {
                if (templateSelf._caseMark != val) {
                    templateSelf._caseMark = val;
                }
            }
        },
        "defineTemplate": {
            enumerable: true,
            get: function () {
                return templateSelf._defineTemplate;
            },
            set: function (val) {
                if (templateSelf._defineTemplate != val) {
                    templateSelf._defineTemplate = val;
                    templateSelf._changed = true;
                }
            }
        },
        "defineTemplateUrl": {
            enumerable: true,
            get: function () {
                return templateSelf._defineTemplateUrl;
            },
            set: function (val) {
                if (templateSelf._defineTemplateUrl != val) {
                    templateSelf._defineTemplateUrl = val;
                    templateSelf._changed = true;
                }
            }
        },
        "applyTemplate": {
            enumerable: true,
            get: function () {
                return templateSelf._applyTemplate;
            },
            set: function (val) {
                if (templateSelf._applyTemplate != val) {
                    templateSelf._applyTemplate = val;
                    templateSelf._changed = true;
                }
            }
        },
        "applyTemplateUrl": {
            enumerable: true,
            get: function () {
                return templateSelf._applyTemplateUrl;
            },
            set: function (val) {
                if (templateSelf._applyTemplateUrl != val) {
                    templateSelf._applyTemplateUrl = val;
                    templateSelf._changed = true;
                }
            }
        },
        "interpreter": {
            enumerable: true,
            get: function () {
                return templateSelf._interpreter;
            },
            set: function (val) {
                if (templateSelf._interpreter != val) {
                    templateSelf._interpreter = val;
                    templateSelf._changed = true;
                }
            }
        },
        "language": {
            enumerable: true,
            get: function () {
                return templateSelf._language;
            },
            set: function (val) {
                if (templateSelf._language != val) {
                    templateSelf._language = val;
                    templateSelf._changed = true;
                }
            }
        }
    });

    //成员定义
    this.paramList = undefined;

    //函数定义
    /**
     * 加载算子模板的JSON对象。该方法不是静态调用。
     * @param data 模板的JSON对象
     * @returns {load} 返回算子模板自身
     */
    function load(instance, data) {
        // var instance=this;
        //console.debug("ChartComTemplate.load %o", data);
        ComTemplate.prototype.load(instance, data);
        setDefaultFunc(instance);
        //构造函数对象
        buildFuncObject(instance, data);
        return instance;
    }

    /**
     * 在paramList的index位置处插入一个参数，并设定一个默认的key值。如果没有提供index或index为负，则在paramList末尾追加一个参数。
     * @param index 要插入的位置
     */
    function addParam(index) {
        return ComTemplate.prototype.addParam.call(this, index);
    }

    /**
     * 从paramList中删除指定key值的参数。该方法仅删除匹配的第一个参数。
     * @param key 要删除参数的key值
     */
    function removeParam(key) {
        ComTemplate.prototype.removeParam.call(this, key);
    }

    function buildFuncObject(instance, data) {
        //构造函数对象
        var renderStr = "function init(initArgs,theme){\n" + instance.initFunc + "\n}\n";
        renderStr += "function load(charts,initArgs,theme,dataset){\n" + instance.loadFunc + "\n}\n";
        renderStr += "function events(charts,initArgs,theme){\n" + instance.eventsFunc + "\n}\n";
        renderStr += "\
function close(charts){\n\
  try{\n"+
            instance.closeFunc + "\n\
  }catch(ex){\n\
    console.warn('回收图元对象异常：%o',ex);\n\
  }\n\
}\n";
        if (data.renderFunc) {
            renderStr += "function render(charts,initArgs,theme,dataset){\n" + data.renderFunc + "\n}\n";
        } else {
            renderStr += "\
function render(charts,initArgs,theme,dataset){\n\
  if(!charts){\n\
    try{\n\
      charts=init(initArgs,theme);\n\
    }catch(ex){\n\
      console.warn('初始化图元对象异常：%o',ex);\n\
      return;\n\
    }\n\
    try{\n\
      events(charts,initArgs,theme);\n\
    }catch(ex){\n\
      console.warn('设定图元事件异常：%o',ex);\n\
      return;\n\
    }\n\
  }\n\
  try{\n\
    load(charts,initArgs,theme,dataset);\n\
  }catch(ex){console.warn('加载图元数据渲染异常：%o',ex);}\n\
  return charts;\n\
}\n";
        }
        instance.renderFuncObj = ComTemplate.prototype.buildJsFuncObject(renderStr);
        return instance;
    }

    function setDefaultFunc(instance) {
        //设定init、events、load、close函数帮助
        if (!instance.initFunc) {
            instance.initFunc = "\
//输入变量：\n\
//initArgs：初始化参数，和需要用到全局服务或配置\n\
//theme：呈现主题（色系、皮肤等等）\n\
//返回值：图元对象。\n";
        }
        if (!instance.eventsFunc) {
            instance.eventsFunc = "\
//输入变量：\n\
//charts：init函数返回的图元对象\n\
//initArgs：初始化参数，和需要用到全局服务或配置\n\
//theme：呈现主题（色系、皮肤等等）\n\
//返回值：图元对象。\n";
        }
        if (!instance.loadFunc) {
            instance.loadFunc = "\
//输入变量：\n\
//charts：init函数返回的图元对象\n\
//initArgs：初始化参数，和需要用到全局服务或配置\n\
//theme：呈现主题（色系、皮肤等等）\n\
//dataset：需要加载的数据集\n\
//返回值：图元对象。\n";
        }
        if (!instance.closeFunc) {
            instance.closeFunc = "\
//输入变量：\n\
//charts：init函数返回的图元对象\n";
        }
    }

    /**
     * ComTemplate的序列化方法
     */
    function write(instance) {
        //此时templateSelf为初始对象，this为当前对象
        // templateSelf=this;
        var paramStr = angular.toJson(instance.paramList);
        instance.caseMark = md5.hex(paramStr);
        //构造函数对象
        buildFuncObject(instance, instance);
        return angular.toJson(instance);
    }

    /**
     * ComTemplate的反序列化方法
     * @param str
     */
    function read(instance, str) {
        var obj = undefined;
        try {
            obj = JSON.parse(str);
        } catch (ex) {
            console.warn("ChartComTemplate.read异常：%s", ex);
            return;
        }
        if (obj) {
            load(instance, obj);
        }
        return instance;
    }

    /**
     * 根据图元的参数模型，获取图元可适配的图例列表
     * @returns {*} 包含图例名称的数组
     */
    function getCaseNames(instance) {
        // templateSelf=this;
        var paramStr = angular.toJson(instance.paramList);
        instance.caseMark = md5.hex(paramStr);
        return ChartCase.getCaseNames(instance.caseMark);
    }

    /**
     * 获取节点参数中，指定类型的参数值列表。
     * @param template 算子模板对象
     * @param paramSetting 节点参数对象
     * @param type 指定的参数类型
     * @returns {Array} 参数值列表
     */
    function getParamValuesByType(template, paramSetting, type, values) {
        if (!values) {
            values = [];
        }
        if (template.paramList && template.paramList.length > 0) {
            for (var i = 0; i < template.paramList.length; i++) {
                ComParam.prototype.getParamValuesByType(template.paramList[i], paramSetting, type, values);
            }
        }
        return values;
    }

    function getParamValuesByType_New(paramSetting, type, noCheckRef, defer) {
        var values = [];
        //检查并异步加载所引用的其他算子
        if (noCheckRef) {
            var defer = _self.ComLibSrv.loadRefComponents(templateSelf, paramSetting);
        }

        //查找指定类型的参数值列表
        if (templateSelf.paramList && templateSelf.paramList.length > 0) {
            for (var i = 0; i < templateSelf.paramList.length; i++) {
                ComParam.prototype.getParamValuesByType(templateSelf.paramList[i], paramSetting, type, values);
            }
        }
        return values;
    }

    function getParamValuesByType_New2(paramSetting, type) {
        return getParamValuesByType_New(paramSetting, type, true);
    }

    //原型方法
    if (ChartComTemplate.prototype.__initChartComTemplate__ !== true) {
        ChartComTemplate.prototype.addParam = addParam;
        ChartComTemplate.prototype.removeParam = removeParam;
        ChartComTemplate.prototype.write = write;
        ChartComTemplate.prototype.read = read;
        ChartComTemplate.prototype.getCaseNames = getCaseNames;
        ChartComTemplate.prototype.getParamValuesByType = getParamValuesByType;
        ChartComTemplate.prototype.getParamValuesByType_New = getParamValuesByType_New;
        ChartComTemplate.prototype.getParamValuesByType_New2 = getParamValuesByType_New2;
        ChartComTemplate.prototype.__initChartComTemplate__ = true;
    }

    //因为要用到ComTemplate的原型，所以需要加载ComTemplate
    if (ComTemplate.prototype.__initComTemplate__ !== true) {
        new ComTemplate();
    }

    //初始化或构造函数
    var argn = arguments.length;
    if (argn == 1) {
        load(templateSelf, arguments[0]);
    } else {
        //设定init、events、load、close函数帮助
        setDefaultFunc(templateSelf);
    }

}

function ChartCom() {
    //类继承
    Com.apply(this, arguments);

    //成员定义
    var selfChartCom = this;

    //函数定义
    /**
     * 加载算子对象
     * @param data
     */
    function load(instance, data) {
        // var instance=this;
        //console.debug("ChartCom.load %o", data);
        Com.prototype.load(instance, data);
        if (data["template"]) {
            switch (typeof(data["template"])) {
                case "object":
                    instance.template = new ChartComTemplate(data["template"]);
                    break;
                case "string":
                    instance.template = ChartComTemplate.prototype.read(new ChartComTemplate(), data["template"]);
                    break;
            }
        }
        return instance;
    }

    //原型方法
    if (ChartCom.prototype.__initChartCom__ !== true) {
        ChartCom.prototype.load = load;
        ChartCom.prototype.__initChartCom__ = true;
    }

    if (ChartComTemplate.prototype.__initChartComTemplate__ !== true) {
        new ChartComTemplate();
    }

    //初始化或构造函数
    var argn = arguments.length;
    selfChartCom.type = ConfigConst.ComLib.ComType_ViewAtom;
    if (argn == 1) {
        load(selfChartCom, arguments[0]);
    } else {
        selfChartCom.template = new ChartComTemplate();
    }
}

ChartCom.prototype = new Com();    //类继承

/**
 * 复合算子模板类。该类只能通过new方法实例化：new CompositeComTemplate(jsonObj)
 * @constructor
 */
function CompositeComTemplate() {
    var templateSelf = this;

    //定义访问器
    /**
     * 为优化算子模板的序列化而定义成员和访问器，仅部分访问器会被序列化
     */
    Object.defineProperties(this, {
        //不需要序列化的成员
        "_script": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "_compileFunc": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "_renderFunc": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "_diagram": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "_defineTemplate": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "_defineTemplateUrl": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "_applyTemplate": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "_applyTemplateUrl": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "_interpreter": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "_language": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "compileFuncObj": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "renderFuncObj": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        //记录变更状态的成员及访问器
        "_changed": {
            value: undefined,
            writable: true,
            enumerable: false
        },
        "changed": {
            enumerable: false,
            get: function () {
                if (templateSelf._changed) {
                    return true;
                }
                if (templateSelf.paramList && templateSelf.paramList.length > 0) {
                    for (var i = 0; i < templateSelf.paramList.length; i++) {
                        if (templateSelf.paramList[i].changed) {
                            return true;
                        }
                    }
                }
                return false;
            }
        },
        //需要序列化的访问器
        "script": {
            enumerable: true,
            get: function () {
                return templateSelf._script;
            },
            set: function (val) {
                if (templateSelf._script != val) {
                    templateSelf._script = val;
                    templateSelf._changed = true;
                }
            }
        },
        "compileFunc": {
            enumerable: true,
            get: function () {
                return templateSelf._compileFunc;
            },
            set: function (val) {
                if (templateSelf._compileFunc != val) {
                    templateSelf._compileFunc = val;
                    templateSelf._changed = true;
                }
            }
        },
        "renderFunc": {
            enumerable: true,
            get: function () {
                return templateSelf._renderFunc;
            },
            set: function (val) {
                if (templateSelf._renderFunc != val) {
                    templateSelf._renderFunc = val;
                    templateSelf._changed = true;
                }
            }
        },
        "diagram": {
            enumerable: true,
            get: function () {
                return templateSelf._diagram;
            },
            set: function (val) {
                if (templateSelf._diagram != val) {
                    templateSelf._diagram = val;
                    templateSelf._changed = true;
                }
            }
        },
        "defineTemplate": {
            enumerable: true,
            get: function () {
                return templateSelf._defineTemplate;
            },
            set: function (val) {
                if (templateSelf._defineTemplate != val) {
                    templateSelf._defineTemplate = val;
                    templateSelf._changed = true;
                }
            }
        },
        "defineTemplateUrl": {
            enumerable: true,
            get: function () {
                return templateSelf._defineTemplateUrl;
            },
            set: function (val) {
                if (templateSelf._defineTemplateUrl != val) {
                    templateSelf._defineTemplateUrl = val;
                    templateSelf._changed = true;
                }
            }
        },
        "applyTemplate": {
            enumerable: true,
            get: function () {
                return templateSelf._applyTemplate;
            },
            set: function (val) {
                if (templateSelf._applyTemplate != val) {
                    templateSelf._applyTemplate = val;
                    templateSelf._changed = true;
                }
            }
        },
        "applyTemplateUrl": {
            enumerable: true,
            get: function () {
                return templateSelf._applyTemplateUrl;
            },
            set: function (val) {
                if (templateSelf._applyTemplateUrl != val) {
                    templateSelf._applyTemplateUrl = val;
                    templateSelf._changed = true;
                }
            }
        },
        "interpreter": {
            enumerable: true,
            get: function () {
                return templateSelf._interpreter;
            },
            set: function (val) {
                if (templateSelf._interpreter != val) {
                    templateSelf._interpreter = val;
                    templateSelf._changed = true;
                }
            }
        },
        "language": {
            enumerable: true,
            get: function () {
                return templateSelf._language;
            },
            set: function (val) {
                if (templateSelf._language != val) {
                    templateSelf._language = val;
                    templateSelf._changed = true;
                }
            }
        }
    });

    //成员定义
    this.paramList = undefined;

    //函数定义
    /**
     * 加载算子模板的JSON对象。该方法不是静态调用。
     * @param data 模板的JSON对象
     * @returns {load} 返回算子模板自身
     */
    function load(instance, data) {
        // var instance=this;
        //console.debug("CompositeComTemplate.load %o", data);
        ComTemplate.prototype.load(instance, data);
        return instance;
    }

    /**
     * 在paramList的index位置处插入一个参数，并设定一个默认的key值。如果没有提供index或index为负，则在paramList末尾追加一个参数。
     * @param index 要插入的位置
     */
    function addParam(index) {
        return ComTemplate.prototype.addParam.call(this, index);
    }

    /**
     * 从paramList中删除指定key值的参数。该方法仅删除匹配的第一个参数。
     * @param key 要删除参数的key值
     */
    function removeParam(key) {
        ComTemplate.prototype.removeParam.call(this, key);
    }

    /**
     * ComTemplate的序列化方法
     */
    function write(instance) {
        return angular.toJson(instance);
    }

    /**
     * ComTemplate的反序列化方法
     * @param instance 模板对象实例
     * @param str 模板字符串
     */
    function read(instance, str) {
        // templateSelf=this;
        var obj = undefined;
        try {
            obj = JSON.parse(str);
        } catch (ex) {
            console.warn("CompositeComTemplate.read异常：%s", ex);
            return;
        }
        if (obj) {
            load(instance, obj);
        }
        return instance;
    }

    /**
     * 获取节点参数中，指定类型的参数值列表。
     * @param template 算子模板对象
     * @param paramSetting 节点参数对象
     * @param type 指定的参数类型
     * @returns {Array} 参数值列表
     */
    function getParamValuesByType(template, paramSetting, type, values) {
        if (!values) {
            values = [];
        }
        if (template.paramList && template.paramList.length > 0) {
            for (var i = 0; i < template.paramList.length; i++) {
                ComParam.prototype.getParamValuesByType(template.paramList[i], paramSetting, type, values);
            }
        }
        return values;
    }

    //原型方法
    if (CompositeComTemplate.prototype.__initCompositeComTemplate__ !== true) {
        CompositeComTemplate.prototype.addParam = addParam;
        CompositeComTemplate.prototype.removeParam = removeParam;
        CompositeComTemplate.prototype.write = write;
        CompositeComTemplate.prototype.read = read;
        CompositeComTemplate.prototype.getParamValuesByType = getParamValuesByType;
        CompositeComTemplate.prototype.__initCompositeComTemplate__ = true;
    }

    //因为要用到ComTemplate的原型，所以需要加载ComTemplate
    if (ComTemplate.prototype.__initComTemplate__ !== true) {
        new ComTemplate();
    }

    //初始化或构造函数
    var argn = arguments.length;
    if (argn == 1) {
        load(templateSelf, arguments[0]);
    }

}

function CompositeCom() {
    //类继承
    Com.apply(this, arguments);

    //成员定义
    var selfCompositeCom = this;

    //函数定义
    /**
     * 加载算子对象
     * @param data
     */
    function load(instance, data) {
        // var instance=this;
        // console.debug("CompositeCom.load %o", data);
        Com.prototype.load(instance, data);
        if (data["template"]) {
            switch (typeof(data["template"])) {
                case "object":
                    instance.template = new CompositeComTemplate(data["template"]);
                    break;
                case "string":
                    instance.template = CompositeComTemplate.prototype.read(new CompositeComTemplate(), data["template"]);
                    break;
            }
            //判断并自动增加_diagram_参数
            if(!Utility.some(instance.template.paramList,function(param){return param.key==ConfigConst.ComModel.Key_ParamSetting_Diagram;})){
                var par=instance.template.addParam();
                par.key=ConfigConst.ComModel.Key_ParamSetting_Diagram;
                par.type=ConfigConst.ComModel.Type_Dag;
                par.element=ConfigConst.ComModel.Element_Default;
                par.title="临时子分析流";
                par.visible=false;
                par.require=false;
            }
        }
        return instance;
    }

    /**
     * override父类方法，在compileNode之前执行
     * @param comObject
     * @param node
     * @param recursion
     * @returns {string}
     */
    function preCompileExtend(comObject, node, recursion) {
        //重新构造算子和节点，将节点的参数merge进算子的diagram对象，将算子的diagram变成节点的子图。
        //完成节点的编译后，再还原现状。
        if (!comObject.template.diagram || !comObject.template.diagram.nodes || comObject.template.diagram.nodes.length < 1) {
            return "";
        }
        //备份节点的初始paramSetting
        var diagram = angular.copy(comObject.template.diagram);
        var script = '\
<#globalLevel#><#zzjzDag="zzjzParam.'+ConfigConst.ComModel.Key_ParamSetting_Diagram+'"#><#/globalLevel#>\n\
val ordds=<#zzjzCallDag="zzjzParam.'+ConfigConst.ComModel.Key_ParamSetting_Diagram+'"#>\n\
ordds.foreach((A)=>{outputRDD("<#zzjzRddName#>_"+A._1,A._2)\n\
    if(A._2.isInstanceOf[org.apache.spark.sql.DataFrame]) {A._2.asInstanceOf[org.apache.spark.sql.DataFrame].registerTempTable("<#zzjzRddName#>_"+A._1)\n\
    sqlc.cacheTable("<#zzjzRddName#>_"+A._1)}\n\
})';
        //将节点的参数逐个merge到diagram中
        for (var nid in node.paramSetting) {
            if (!nid || !node.paramSetting[nid] || typeof(node.paramSetting[nid]) == "function") {
                continue;
            }
            var nd = null;
            for (var i = 0; i < diagram.nodes.length; i++) {
                if (diagram.nodes[i].id == nid) {
                    nd = diagram.nodes[i];
                    break;
                }
            }
            if (nd) {
                if(!nd.paramSetting&&node.paramSetting[nid]){
                    nd.paramSetting={};
                }
                angular.extend(nd.paramSetting, node.paramSetting[nid]);
            }
        }
        //准备构造算子对象和节点对象
        if(!node.paramSetting[ConfigConst.ComModel.Key_ParamSetting_Diagram]) {
            Object.defineProperty(node.paramSetting, ConfigConst.ComModel.Key_ParamSetting_Diagram,{
                value: undefined,
                writable: true,
                enumerable: false
            });
        }
        if(!node.paramSetting["__nidmap__"]) {
            Object.defineProperty(node.paramSetting, "__nidmap__",{
                value: undefined,
                writable: true,
                enumerable: false
            });
        }
        var idmap=node.paramSetting["__nidmap__"]||{};
        diagram = resetNodesId(diagram,idmap);
        node.paramSetting[ConfigConst.ComModel.Key_ParamSetting_Diagram] = diagram;
        node.paramSetting["__nidmap__"] = idmap;
        return script;
    }

    /**
     * override父类方法，在compileNode之后执行
     * @param comObject
     * @param node
     * @param recursion
     * @returns {string}
     */
    function postCompileExtend(comObject, node, recursion, script) {
        comObject.script = null;
        // delete node.paramSetting[ConfigConst.ComModel.Key_ParamSetting_Diagram];
        return script;
    }

    /**
     * 对DAG中每一个节点重新分配节点ID，并将原始节点ID保存至originalId属性中。
     * 节点编译时，会使用originalId作为RDD输出的名称，而不再使用节点ID。
     * 该函数要求所有的算子已加载至缓存
     * @param dag 输入DAG对象
     * @param idmap 输入DAG的各节点的id转换映射表
     * @return {{}} 返回更新后DAG对象的JSON文本
     */
    function resetNodesId(dag,idmap){
        var result={nodes:[],edges:[]};
        if(!dag||!dag.nodes||dag.nodes.length<=0) return result;
        //调用递归函数，修改ID
        return resetNodesIdRecursion(dag,idmap);
    }

    function resetNodesIdRecursion(dag,idmap){
        //修改当前级别下所有的节点ID
        if(!dag||!dag.nodes||dag.nodes.length<=0) return dag ;
        for(var i=0;i<dag.nodes.length;i++){
            var node=dag.nodes[i];
            if(node){
                //修改当前节点ID
                var newid=idmap[node.id];
                if(!newid){
                    newid=Utility.newNodeId();
                    idmap[node.id]=newid;
                }
                node.originalId=node.id;
                node.id=newid;
                //修改边表的节点id
                if(dag.edges||dag.edges.length>0){
                    dag.edges.forEach(function(edge){
                        if(edge.source==node.originalId) edge.source=newid;
                        if(edge.target==node.originalId) edge.target=newid;
                    });
                }
                // result=result.replace(new RegExp(node.id,"gi"),newid);
                //判断当前节点是否包含子图
                var com=_self.ComLibSrv.getComponent(node.componentId);
                if(com instanceof Com){
                    var subDags=com.template.getParamValuesByType(com.template,node.paramSetting,ConfigConst.ComModel.Type_Dag);
                    angular.forEach(subDags,function(sub){
                        //每个子图再继续修改ID
                        resetNodesIdRecursion(sub,idmap);
                    });
                }
            }
        }
        return dag;
    }

    //原型方法
    if (CompositeCom.prototype.__initCompositeCom__ !== true) {
        CompositeCom.prototype.preCompileExtend = preCompileExtend;
        CompositeCom.prototype.postCompileExtend = postCompileExtend;
        CompositeCom.prototype.__initCompositeCom__ = true;
    }

    if (CompositeComTemplate.prototype.__initCompositeComTemplate__ !== true) {
        new CompositeComTemplate();
    }

    //初始化或构造函数
    var argn = arguments.length;
    selfCompositeCom.type = ConfigConst.ComLib.ComType_Composite;
    if (argn == 1) {
        load(selfCompositeCom, arguments[0]);
    } else {
        selfCompositeCom.template = new CompositeComTemplate();
    }
}

CompositeCom.prototype = new Com();    //类继承

function PythonCom(){
    //类继承
    Com.apply(this, arguments);

    //成员定义
    var selfPythonCom = this;
    //内部常量定义
    selfPythonCom.callTemplate = '';
    selfPythonCom.declareTemplate = '<#NodeScript#>\n';

    //函数定义
    //override父类方法
    function compile(node, recursion) {
        //算子的编译方法先生成该算子节点的执行脚本，然后在进行统一命名空间的封装
        var thisCom = this;
        if (!node || !node.id || node.componentId != thisCom.id) {
            return new CompileContext();
        }
        var oldScriptTmpl = thisCom.template.script;
        thisCom.template.script = thisCom.preCompileExtend(thisCom, node, recursion);
        var script = compileNode(thisCom, node, recursion);
        var compiledScript = thisCom.postCompileExtend(thisCom, node, recursion, script);
        compiledScript.script=compiledScript.script.replace(/\r/g,"");
        thisCom.template.script = oldScriptTmpl;
        return compiledScript;
    }

    function compileNode(com, node, recursion) {
        var context = new CompileContext();
        context.comType = ConfigConst.ComLib.ComType_Do;
        context.interpreter = com.interpreter;
        context.language = com.template.language;
        // 允许节点没有参数
        // if (!node.paramSetting) {
        //     context.script = com.template.script;
        //     return context;
        // }
        var script = com.template.script;

        //处理绑定语法
        script=com.compileBinding(script,node,com);

        //基本输入输出函数，并向下兼容，但是对于Python而言，应保留z.rdd方法
        // z.rdd("XX") => inputRDD("XX") => inputRDDs("XX")
        script = script.replace(/inputRDD\((.*)\)/g, 'z.rdd($1)');
        // outputrdd.put("b",XX) => outputRDD("b",XX)，但是对于Python而言，应保留outputrdd.put方法
        script = script.replace(/outputRDD\((.*)\)/g, 'outputrdd.put($1)');


        //逐项调用扩展函数，并替换
        //扩展，根据脚本中扩展函数调用compileFunc相应JS完成自定义脚本扩展。函数会自动传入zzjzParam参数。
        // 需要匹配的模式有：<#zzjzFunc="函数名"#>。
        //pList的数据结构：[{match:匹配模式,statement:扩展函数名}]
        var pList = com.matchExpression(script, "zzjzFunc");
        //检查是否已生成扩展函数对象
        // if(!com.template.compileFuncObj){
        //     com.compileFuncObj=makeCompileFuncObj(com);
        // }
        angular.forEach(pList, function (pkey) {
            var str = "";
            try {
                str = com.template.compileFuncObj[pkey.statement](zzjzParam);
            } catch (e) {
                console.error("ComLib执行%s时，调用扩展函数%s异常：%s", "compileNode", pkey.statement, e);
            }
            script = script.replace(new RegExp(pkey.match, "g"), str);
        });

        /**
         * node 编辑解析不支持奇怪的标签
         * edit by cai.liao
         * */
        //分支。需要匹配的模式有：<#zzjzIf="分支判断表达式"#>...<#/zzjzIf#>。该模式需要支持嵌套。
        //循环。需要匹配的模式有：<#zzjzRepeat="data in XX"#>...<#/zzjzRepeat#>。该模式需要支持嵌套。
        _scope.zzjzParam = node.paramSetting;
        //添加编译函数
        for (var fname in com.template.compileFuncObj) {
            if (fname && com.template.compileFuncObj[fname] && typeof(com.template.compileFuncObj[fname]) == "function") {
                _scope[fname] = com.template.compileFuncObj[fname];
            }
        }
        script = $zzjzCompile(script,_scope);
        _scope.zzjzParam = undefined;
        for (var fname in com.template.compileFuncObj) {
            if (fname && com.template.compileFuncObj[fname] && typeof(com.template.compileFuncObj[fname]) == "function") {
                _scope[fname] = undefined;
            }
        }

        // 替换NodePath
        script = script.replace(/<#NodePath#>/g, recursion ? (recursion + "/" + node.id) : ("/" + node.id));

        //对象级、全局级代码
        //<#globalLevel#> -> <#zzjzGlobalLevel#> -> <%#zzjzGlobalLevel#%>
        //<#objectLevel#> -> <#zzjzObjectLevel#> -> <%#zzjzObjectLevel#%>
        script = script.replace(/<#globalLevel#>/g, "<%#zzjzGlobalLevel#%>");
        script = script.replace(/<#\/globalLevel#>/g, "<%#/zzjzGlobalLevel#%>");
        script = script.replace(/<#objectLevel#>/g, "<%#zzjzObjectLevel#%>");
        script = script.replace(/<#\/objectLevel#>/g, "<%#/zzjzObjectLevel#%>");
        script = script.replace(/<#zzjzGlobalLevel#>/g, "<%#zzjzGlobalLevel#%>");
        script = script.replace(/<#\/zzjzGlobalLevel#>/g, "<%#/zzjzGlobalLevel#%>");
        script = script.replace(/<#zzjzOjectLevel#>/g, "<%#zzjzObjectLevel#%>");
        script = script.replace(/<#\/zzjzObjectLevel#>/g, "<%#/zzjzObjectLevel#%>");

        // 子图。需要匹配的模式有：<#zzjzDag="zzjzParam.子图参数"#>和<#zzjzCallDag="zzjzParam.子图参数"#>。
        pList = com.matchExpression(script, "zzjzDag");
        //pList的数据结构：[{match:匹配模式,statement:子图参数表达式}]
        //逐个子图参数表达式，创建子图脚本
        angular.forEach(pList, function (pkey) {
            //计算子图表达式
            var pvalue = "", novalue = false;
            try {
                pvalue = eval(pkey.statement);
            } catch (e) {
                console.warn("ComLib执行%s时，子图参数%s异常，%s", "compileNode", pkey.statement, e);
                novalue = true;
            }
            if (typeof(pvalue) === "object" && pvalue.nodes && pvalue.edges) {
                //已提取子图
                var nodeList = preCompileDag(pvalue);
                var heads=Dag.findHeadNodes(pvalue);
                if (nodeList.length > 0) {
                    var subcontext = compileNodeList(node.id, pvalue, nodeList,heads, recursion ? (recursion + "/" + node.id) : ("/" + node.id));
                    if (subcontext) {
                        script = script.replace(new RegExp(pkey.match, "g"), subcontext.script);
                        script = script.replace(new RegExp(pkey.match.replace("zzjzDag", "zzjzCallDag"), "g"), subcontext.callScript);
                    } else {
                        novalue = true;
                    }
                }
            } else {
                novalue = true;
            }
            if (novalue) {
                script = script.replace(new RegExp(pkey.match, "g"), "");
                script = script.replace(new RegExp(pkey.match.replace("zzjzDag", "zzjzCallDag"), "g"), "");
            }
        });

        //查找对象级代码
        //提取<%#zzjzObjectLevel#%>标签
        var objLevels = [], idxS = 0, idxE = 0;
        while ((idxS = script.indexOf("<%#zzjzObjectLevel#%>", idxE)) != -1) {
            if ((idxE = script.indexOf("<%#/zzjzObjectLevel#%>", idxS)) > idxS) {
                var s = script.substring(idxS + 21, idxE);
                objLevels.push(s);
            } else {
                //<%#zzjzObjectLevel#%>和<%#/zzjzObjectLevel#%>不匹配，中断编译直接返回空结果
                return new CompileContext();
            }
        }
        idxS = 0, idxE = 0;
        while ((idxS = script.indexOf("<%#zzjzObjectLevel#%>")) != -1) {
            if ((idxE = script.indexOf("<%#/zzjzObjectLevel#%>", idxS)) > idxS) {
                script = script.substr(0, idxS) + script.substr(idxE + 22);
            } else {
                break;
            }
        }

        //修改节点ID，统一命名空间，并输出
        context.script = com.declareTemplate.replace(/<#NodeScript#>/g, script).replace(/<#NodeId#>/g, node.id)
            .replace(/<#ObjectLevel#>/g, objLevels.join("\n"));
        context.script = com.compileBinding(context.script, node,com);
        context.callScript = com.callTemplate.replace(/<#NodeId#>/g, node.id);
        if (recursion && com.sn === ConfigConst.ComLib.PresetComSN.SN_VirtualSourceCom) {
            //子图嵌套中的虚拟源算子节点，此功能不可用，因为Python算子不支持嵌套子图
            context.callScript = context.callScript.replace(/<#InputRddMap#>/g, "inputRDDs");
        } else {
            context.callScript = context.callScript.replace(/<#InputRddMap#>/g, "rddMap");
        }
        context.inputRddNames = com.template.getParamValuesByType(com.template, node.paramSetting, ConfigConst.ComModel.Type_Rdd);
        context.interpreterGroup=com.template.interpreterGroup?com.template.interpreterGroup:Com.DEFAULT_INTERPRETER_GROUP;
        return context;
    }

    //原型方法
    if (PythonCom.prototype.__initPythonCom__ !== true) {
        PythonCom.prototype.compile = compile;
        PythonCom.prototype.compileNode = compileNode;
        PythonCom.prototype.__initPythonCom__ = true;
    }

    //初始化或构造函数
    var argn = arguments.length;
    selfPythonCom.type = ConfigConst.ComLib.ComType_Job;
    if (argn == 1) {
        Com.prototype.load(selfPythonCom, arguments[0]);
    }
}

PythonCom.prototype = new Com();    //类继承

//全局函数
/**
 * 对分析流进行预编译，将DAG格式转换成按顺序执行的节点列表
 * @param dag 分析流DAG
 * @returns {Array} 按顺序执行的节点列表
 */
function preCompileDag(dag) {
    var ndList= Dag.straightenDag(dag);
    // 强制将虚拟数据输出节点放到最后，这种强制处理方法可能导致分析流执行错误
    angular.forEach(ndList,function(x,indx){
        if(indx<ndList.length-1) {
            var com = _self.ComLibSrv.getComponent(x.componentId);
            if (com instanceof Com) {
                if (com.sn == ConfigConst.ComLib.PresetComSN.SN_VirtualDestinationCom) {
                    ndList.splice(indx, 1);
                    ndList.push(x);
                }
            }
        }
    });
    return ndList;
}

/**
 * 对分析流进行编译，生成可执行的后端脚本。
 * @param nodeList DAG预编译后的节点顺序列表
 * @returns {CompileContext}
 */
function compileNodeList(flowId, flowDag, nodeList,heads, recursion, defer) {
    console.time("compileNodeList_"+nodeList.map(function(x){return x.id;}).join(','));
    if (!nodeList || nodeList.length == 0) {
        return new CompileContext();
    }
    var contextList = [], inputRddNames=[];
    //首先获取所有相关算子，懒惰加载
    for (var i = 0; i < nodeList.length; i++) {
        //获取节点对应的算子
        var comdefer = _self.ComLibSrv.getComponent(nodeList[i].componentId);
        if(comdefer) {
            if (!(comdefer instanceof Com)) {
                //未获取算子
                if (!defer) {
                    defer = $q.defer();
                }
                comdefer.then(function (com) {
                    compileNodeList(flowId, flowDag, nodeList, heads, recursion, defer);
                });
                return comdefer;
            }
        }else{
            return new CompileContext();
        }
    }
    //至此，所有的算子已加载到算子库中
    var nodeBody = "", importScript = "", nodeCall = "";
    for (var i = 0; i < nodeList.length; i++) {
        //查找算子
        var com = _self.ComLibSrv.getComponent(nodeList[i].componentId);
        if (com instanceof Com) {
            //检查是否Python语言算子
            if(com.template.language==ConfigConst.ComLib.ComLanguage_Python || com.template.language==ConfigConst.ComLib.ComLanguage_R){
                return compilePythonNodeList(flowId,flowDag, nodeList,heads, recursion, defer);
            }
            var nodeContext = com.compile(nodeList[i], recursion);
            contextList.push(nodeContext);
            //将所有首节点的输入数据作为整个Dag编译后的输入数据
            if(Utility.some(heads,function(x){return x.id==nodeList[i].id;
                })){
                nodeContext.inputRddNames.forEach(function(y){
                    if(!Utility.contains(inputRddNames,y)){
                        inputRddNames.push(y);
                    }
                });
            }
            nodeBody += nodeContext.script + "\n";
            if (i == 0) {
                if (recursion) {
                    //子图的首节点
                    nodeCall += nodeContext.callScript.replace(/rddMap/g, "inputRDDs");
                } else {
                    //顶层的首节点
                    nodeCall += nodeContext.callScript;
                    //查找该节点的前序节点
                    var preNodes=Dag.findPreNodeIds(flowDag,nodeList[i]);
                    var preNodeIdStr=preNodes.join(",");
                    if(preNodeIdStr.length>0) {
                        importScript += ImportRddTemplate_Top.replace(/<#PreNodeIdList#>/g, preNodeIdStr);
                    }
                    // angular.forEach(nodeContext.inputRddNames, function (x) {
                    //     importScript += '    importRDD("' + x +((preNodeIdStr&&preNodeIdStr.length>0)?('","'+preNodeIdStr):'')+ '")\n';
                    // });
                    // angular.forEach(preNodes, function (x) {
                    //     importScript += '    importRDD("' + x.displayName+'_'+x.id+'_zzjz$reRun' +((preNodeIdStr&&preNodeIdStr.length>0)?('","'+preNodeIdStr):'')+ '")\n';
                    // });
                }
            } else {
                nodeCall += nodeContext.callScript;
            }
        }
    }

    //查找全局级代码
    //提取<%#zzjzGlobalLevel#%>标签
    var objLevels = [], idxS = 0, idxE = 0;
    while ((idxS = nodeBody.indexOf("<%#zzjzGlobalLevel#%>", idxE)) != -1) {
        if ((idxE = nodeBody.indexOf("<%#/zzjzGlobalLevel#%>", idxS)) > idxS) {
            var s = nodeBody.substring(idxS + 21, idxE);
            objLevels.push(s);
        } else {
            //<%#zzjzGlobalLevel#%>和<%#/zzjzGlobalLevel#%>不匹配，中断编译直接返回空结果
            return new CompileContext();
        }
    }
    idxS = 0, idxE = 0;
    while ((idxS = nodeBody.indexOf("<%#zzjzGlobalLevel#%>")) != -1) {
        if ((idxE = nodeBody.indexOf("<%#/zzjzGlobalLevel#%>", idxS)) > idxS) {
            nodeBody = nodeBody.substr(0, idxS) + nodeBody.substr(idxE + 22);
        } else {
            break;
        }
    }

    var context = new CompileContext();
    context.language = contextList[0].language;
    context.interpreterGroup=contextList[0].interpreterGroup;
    context.script=recursion?FlowTemplate:FlowTemplate_Top;
    context.script = context.script.replace(/<#NodeBodyScript#>/g, nodeBody.replace(/\$/g,"$$$$"))
        .replace(/<#NodeCallScript#>/g, nodeCall.replace(/\$/g,"$$$$"))
        .replace(/<#GlobalLevel#>/g, objLevels.join("\n").replace(/\$/g,"$$$$"))
        .replace(/<#ImportRDD#>/g, importScript.replace(/\$/g,"$$$$"))
        .replace(/<#FlowId#>/g, flowId);
    if(!recursion){
        var runningNodeId=heads.length>0?heads[0].id:nodeList[0].id;
        context.script=context.script.replace(/<#zzjzRunningFlowId#>/g, flowId).replace(/<#zzjzRunningNodeId#>/g, runningNodeId);
    }
    context.callScript = recursion ? CallFlowTemplate_Sub.replace(/<#FlowId#>/g, flowId) : CallFlowTemplate_Top.replace(/<#FlowId#>/g, flowId);
    //删除代码中所有注释行，即以//开头的行
    var scriptLines=context.script.split("\n");
    for(var i=0;i<scriptLines.length;i++){
        var line=scriptLines[i].trim();
        if(Utility.stringStartWith(line,"//")){
            scriptLines.splice(i,1);
            i--;
        }
    }
    context.script=scriptLines.join("\n");
    console.timeEnd("compileNodeList_"+nodeList.map(function(x){return x.id;}).join(','));
    return context;
}
function compilePythonNodeList(flowId,flowDag, nodeList,heads, recursion, defer) {
    if (!nodeList || nodeList.length == 0) {
        return new CompileContext();
    }
    var contextList = [], inputRddNames=[];
    //首先获取所有相关算子，懒惰加载
    for (var i = 0; i < nodeList.length; i++) {
        //获取节点对应的算子
        var comdefer = _self.ComLibSrv.getComponent(nodeList[i].componentId);
        if (!(comdefer instanceof Com)) {
            //未获取算子
            if (!defer) {
                defer = $q.defer();
            }
            comdefer.then(function (com) {
                compilePythonNodeList(flowId, flowDag,nodeList, heads, recursion, defer);
            });
            return comdefer;
        }
    }
    //至此，所有的算子已加载到算子库中
    var nodeBody = "", importScript = "", nodeCall = "";
    for (var i = 0; i < nodeList.length; i++) {
        //查找算子
        var com = _self.ComLibSrv.getComponent(nodeList[i].componentId);
        if (com instanceof Com) {
            var nodeContext = com.compile(nodeList[i], recursion);
            contextList.push(nodeContext);
            if(Utility.some(heads,function(x){return x.id==nodeList[i].id;
                })){
                nodeContext.inputRddNames.forEach(function(y){
                    if(!Utility.contains(inputRddNames,y)){
                        inputRddNames.push(y);
                    }
                });
            }
            nodeBody += nodeContext.script + "\n";
            if (i == 0) {
                if (recursion) {
                    //子图的首节点
                    nodeCall += nodeContext.callScript.replace(/rddMap/g, "inputRDDs");
                } else {
                    //顶层的首节点
                    nodeCall += nodeContext.callScript;
                    //查找该节点的前序节点
                    var preNodes=Dag.findPreNodeIds(flowDag,nodeList[i]);
                    angular.forEach(nodeContext.inputRddNames, function (x) {
                        importScript += '    importRDD("' + x +((preNodes&&preNodes.length>0)?('","'+preNodes.join(",")):'')+ '")\n';
                        importScript += '    importRDD("' + x+'_zzjz$reRun' +((preNodes&&preNodes.length>0)?('","'+preNodes.join(",")):'')+ '")\n';
                    });
                }
            } else {
                nodeCall += nodeContext.callScript;
            }
        }
    }

    //查找全局级代码
    //提取<%#zzjzGlobalLevel#%>标签
    var objLevels = [], idxS = 0, idxE = 0;
    while ((idxS = nodeBody.indexOf("<%#zzjzGlobalLevel#%>", idxE)) != -1) {
        if ((idxE = nodeBody.indexOf("<%#/zzjzGlobalLevel#%>", idxS)) > idxS) {
            var s = nodeBody.substring(idxS + 21, idxE);
            objLevels.push(s);
        } else {
            //<%#zzjzGlobalLevel#%>和<%#/zzjzGlobalLevel#%>不匹配，中断编译直接返回空结果
            return new CompileContext();
        }
    }
    idxS = 0, idxE = 0;
    while ((idxS = nodeBody.indexOf("<%#zzjzGlobalLevel#%>")) != -1) {
        if ((idxE = nodeBody.indexOf("<%#/zzjzGlobalLevel#%>", idxS)) > idxS) {
            nodeBody = nodeBody.substr(0, idxS) + nodeBody.substr(idxE + 22);
        } else {
            break;
        }
    }

    var context = new CompileContext();
    context.language = contextList[0].language;
    context.interpreterGroup=contextList[0].interpreterGroup;
    context.script = PythonFlowTemplate.replace(/<#FlowId#>/g, flowId).replace(/<#NodeBodyScript#>/g, nodeBody.replace(/\$/g,"$$$$"))
        .replace(/<#ImportRDD#>/g, importScript.replace(/\$/g,"$$$$")).replace(/<#NodeCallScript#>/g, nodeCall.replace(/\$/g,"$$$$"))
        .replace(/<#GlobalLevel#>/g, objLevels.join("\n").replace(/\$/g,"$$$$"));
    context.callScript = CallPythonFlowTemplate.replace(/<#FlowId#>/g, flowId);
    return context;
}
function compileDag(flowId, flowDag, dag, recursion, defer) {
    var nodelist = preCompileDag(dag);
    var heads=Dag.findHeadNodes(dag);
    if (nodelist && nodelist.length > 0) {
        return compileNodeList(flowId, flowDag, nodelist,heads, recursion, defer);
    } else {
        return new CompileContext();
    }
}
function compileDag2(flowId, flowDag, dag, defer, start) {
    console.time("compileDag2");
    //首先懒惰加载所有的节点算子
    if (!start) {
        start = 0;
    }
    /*            for (var i = start; i < dag.nodes.length; i++) {
         var node = dag.nodes[i];
         if (node && node.componentId) {
         var comdefer = _self.ComLibSrv.getComponent(node.componentId);
         if (!comdefer) {
         //该算子已被删除
         if (!defer) {
         defer = $q.defer();
         }
         setTimeout(function () {
         defer.reject("节点算子已被删除，该节点无法执行");
         }, 10);
         return defer.promise;
         }
         if (!(comdefer instanceof Com)) {
         if (!defer) {
         defer = $q.defer();
         }
         comdefer.then(function () {
         compileDag2(flowId, dag, defer, start);
         });
         return defer.promise;
         } else {
         //递归加载子级节点
         if (comdefer.template) {
         if (!defer) {
         defer = $q.defer();
         }
         _self.ComLibSrv.lazyLoad(comdefer.template, node.paramSetting).then(function (data) {
         compileDag2(flowId, dag, defer, start + 1);
         });

         return defer.promise;
         }else{
         if (!defer) {
         defer = $q.defer();
         }
         setTimeout(function () {
         defer.reject("节点算子已被删除，该节点无法执行");
         }, 10);
         return defer.promise;
         }
         }
         }
         }
         */            //至此，所有算子已加载
    var compile = compileDag(flowId, flowDag, dag);
    if (!defer) {
        defer = $q.defer();
    }
    setTimeout(function () {
        console.timeEnd("compileDag2");
        defer.resolve(compile);
    }, 0);
    return defer.promise;
}

/**
 * 根据DAG创建包含执行scala脚本的OOZIE调度XML
 * @param dag
 * @returns {string}XML文本
 */
/**记录开始节点*/
var startNodes = [];
var forkSize = 0;
var joinSize = 0;
function getOozieXml(noteId, flowName, dag) {
    //提取并格式化分析流
    //var runDag=angular.copy(dag);
    var ndList=Dag.straightenDag(dag);
    var runDag={edges:[],nodes:ndList};
    for (var i = 0; i < ndList.length - 1; i++) {
        runDag.edges.push({
            source: ndList[i].id,
            target: ndList[i + 1].id
        });
    }
    var tempDag = {};
    tempDag.edges=[];
    tempDag.nodes = runDag.nodes;
    /**复制数组*/
    var copyNodes = runDag.nodes;
    forkSize = 0;
    joinSize = 0;
    copyNodes = defineNode(copyNodes,runDag,noteId,dag);
    /**重新生成临时dag*/
    var tmpRunDag = createTmpDag(tempDag);
    var tempNodes = tmpRunDag.nodes;
    tempNodes = defineNode(tempNodes,tmpRunDag,noteId,dag);
    var xml = createOozieXml(startNodes,tempNodes,flowName);
    return xml;

}
function defineNode(copyNodes,runDag,noteId,originalDag) {
    startNodes = [];
    angular.forEach(copyNodes, function(copyNode) {
        /**joinId*/
        copyNode.joinId = Utility.appUuid();
        /**forkId*/
        copyNode.forkId = Utility.appUuid();
        copyNode.getTargetEdges=function(){
            return runDag.edges.filter(function(x){
                return x.source===copyNode.id;
            }).map(function(x){
                return {target:Dag.getNodeById(runDag, x.target)};
            });
        };
        copyNode.getSourceEdges=function(){
            return runDag.edges.filter(function(x){
                return x.target===copyNode.id;
            }).map(function(x){
                return {source:Dag.getNodeById(runDag, x.source)};
            });
        };
        /**ok*/
        copyNode.isExitOk = function() {
            var len = copyNode.getTargetEdges().length;
            if(len >= 1) {
                return true;
            }
            return false;
        };
        /**end*/
        copyNode.isExitEnd = function() {
            var len = copyNode.getSourceEdges().length;
            if(len >= 1) {
                return true;
            }
            return false;
        };
        if(copyNode.isExitOk() && !copyNode.isExitEnd()) {
            startNodes.push(copyNode);
        }
        else if(!copyNode.isExitOk() && !copyNode.isExitEnd()) {
            startNodes.push(copyNode);
        }
        /**join*/
        copyNode.isExitJoin = function() {
            var len = copyNode.getSourceEdges().length;
            if(len >= 2) {
                return true;
            }
            return false;
        };
        /**fork*/
        copyNode.isExitFork = function() {
            var len = copyNode.getTargetEdges().length;
            if(len >= 2) {
                return true;
            }
            return false;
        };

        /**joinXml*/
        copyNode.toJoinXml = function() {
            if(copyNode.isExitJoin()) {
                var join = document.createElement('join');
                join.setAttribute('name', copyNode.joinId);
                join.setAttribute('to', copyNode.id);
                return join;
            }
            return null;
        };
        /**actionXml*/
        copyNode.toActionXml = function(fork) {
            var action = document.createElement('action');
            action.setAttribute('name', copyNode.id);
            /**定义zzjz*/
            var zzjz = document.createElement('zzjz');
            zzjz.setAttribute('xmlns', 'uri:oozie:zzjz-action:0.1');
            /**定义action-zzjz-noteid、pid、nodeid*/
            var noteid = document.createElement('noteid');
            var pid = document.createElement('pid');
            var nodeid = document.createElement('nodeid');
            var content=document.createElement('content');
            /**设置值*/
            var pidVal = document.createTextNode(copyNode.id);
            pid.appendChild(pidVal);
            var noteidVal = document.createTextNode(noteId);
            noteid.appendChild(noteidVal);
            nodeid.appendChild(document.createTextNode(copyNode.displayName));
            // var tmpDag={edges:[],nodes:[copyNode]};
            // var tmpScript=getDagRunScript(noteId, copyNode.id,tmpDag,false);
            // var contentStr  = encode(tmpScript.script+tmpScript.callScript);
            var tmpRunContext=compileNodeList(noteId,originalDag?originalDag:runDag,[copyNode],[copyNode]);
            var contentStr=encode(Scheduling.getRunScript(noteId,copyNode.id,tmpRunContext));
            var contentVal=document.createTextNode(contentStr);
            content.appendChild(contentVal);
            zzjz.appendChild(noteid);
            zzjz.appendChild(pid);
            zzjz.appendChild(nodeid);
            zzjz.appendChild(content);
            action.appendChild(zzjz);

            var ok = document.createElement('ok');
            action.appendChild(ok);
            if(copyNode.isExitOk() && !copyNode.isExitFork()) {
                var childNodes = copyNode.getTargetEdges();
                var child = childNodes[0].target;
                if(child.isExitJoin()) {
                    ok.setAttribute('to', child.joinId);
                } else {
                    ok.setAttribute('to', child.id);
                }
            } else if(copyNode.isExitOk() && copyNode.isExitFork()) {
                ok.setAttribute('to', copyNode.forkId);
            } else {
                if (forkSize > joinSize) {
                    ok.setAttribute('to', 'join');
                } else {
                    ok.setAttribute('to', 'end');
                }
            }
            var error = document.createElement('error');
            error.setAttribute('to', 'fail');
            action.appendChild(error);
            return action;
        };
        /**forkXml*/
        copyNode.toForkXml = function() {
            if(copyNode.isExitFork()) {
                var fork = document.createElement('fork');
                fork.setAttribute('name', copyNode.forkId);
                var childNodes = copyNode.getTargetEdges();
                angular.forEach(childNodes, function(child) {
                    var path = document.createElement('path');
                    //forkPathNodes.push(child.target.id);
                    if(child.target.isExitJoin()) {
                        path.setAttribute('start', child.target.joinId);
                    } else {
                        path.setAttribute('start', child.target.id);
                    }
                    fork.appendChild(path);
                });
                return fork;
            }
            return null;
        };
    });
    return copyNodes;
}
function createOozieXml(startNodes,copyNodes,flowName) {
    var xml = document.createElement('workflow-app');
    xml.setAttribute('name', flowName);
    xml.setAttribute('xmlns', 'uri:oozie:workflow:0.2');
    /**定义start*/
    var start = document.createElement('start');
    xml.appendChild(start);

    if(startNodes.length > 1) {
        forkSize++;
        start.setAttribute('to', 'fork');
        var fork = document.createElement('fork');
        fork.setAttribute('name', 'fork');
        xml.appendChild(fork);
        angular.forEach(startNodes, function(startNode) {
            var path = document.createElement('path');
            path.setAttribute('start', startNode.id);
            fork.appendChild(path);
        });
    } else {
        if(startNodes.length > 0) {
            start.setAttribute('to', startNodes[0].id);
        } else {
            console.log(copyNodes);
            //start.setAttribute('to', startNodes[0].id);
        }
    }

    angular.forEach(copyNodes, function(copyNode) {
        if(copyNode.isExitJoin()) {
            joinSize ++;
            xml.appendChild(copyNode.toJoinXml());
        }
        if (copyNode.isExitFork()) {
            forkSize ++;
            xml.appendChild(copyNode.toForkXml());
        }
        var tmp = copyNode.toActionXml(fork);
        xml.appendChild(tmp);
    });
    if (forkSize > joinSize) {
        var join = document.createElement('join');
        join.setAttribute('name', 'join');
        join.setAttribute('to', 'end');
        xml.appendChild(join);
    }

    /**定义kill*/
    var kill = document.createElement('kill');
    kill.setAttribute('name', 'fail');
    var message = document.createElement('message');
    kill.appendChild(message);
    /**定义textnode赋值给message*/
    var message_text = document.createTextNode('ZZJZ failed, error  message[${wf:errorMessage(wf:lastErrorNode())}]');
    message.appendChild(message_text);
    xml.appendChild(kill);
    /**定义end*/
    var end = document.createElement('end');
    end.setAttribute('name', 'end');
    xml.appendChild(end);
    console.log(xml);
    return xml.outerHTML;
}
function createTmpDag(tempDag) {
    var queueNodes = [];
    /**节点加入队列*/
    var queue = [];
    var tempNodes = [];
    /**开始节点放入队列*/
    queueNodes.push(startNodes);

    var addQueueNode = function (nodes) {
        var childQueue = [];
        angular.forEach(nodes, function(node) {
            var childs = node.getTargetEdges();
            if (childs.length > 0) {
                angular.forEach(childs, function(child) {
                    if  (!Utility.contains(childQueue,child.target)) {
                        childQueue.push(child.target);
                    }
                });
            }
        });
        if (childQueue.length > 0) {
            queueNodes.push(childQueue);
            var tmp = angular.copy(childQueue);
            queue = [];
            addQueueNode(tmp);
        }
    };
    /**添加节点层次结构*/
    addQueueNode(startNodes);
    /**验证几点层次结构*/
    var queueLen = queueNodes.length;
    var resultNodes = [], hashNode = [];
    for (var i=queueLen-1;i>=0;i--) {
        var newQueues = [];
        var queue = queueNodes[i];
        angular.forEach(queue, function(node) {
            if (!Utility.contains(hashNode,node)) {
                newQueues.push(node);
                hashNode.push(node);
            }
        });
        if (newQueues.length > 0) {
            resultNodes.push(newQueues);
        }
    }

    /**根据新层次结构生成DAG*/
    var isFork = false;
    var len =  resultNodes.length;
    for (var i=len-1;i>=0;i--) {
        var currentNode = resultNodes[i];
        /**上一个节点*/
        var lastNode = resultNodes[i+1];
        if (currentNode.length > 1) {
            if (isFork) {
                var targetId = currentNode[0].id;
                console.log(currentNode[0]);
                angular.forEach(lastNode, function(last) {
                    var sourceId = last.id;
                    addDagLine(tempDag,sourceId,targetId);
                });
                for (var j =0;j<currentNode.length;j++) {
                    var nextNode = currentNode[j+1];
                    if (nextNode) {
                        var  sourceId = currentNode[j].id;
                        var  targetId =  nextNode.id;
                        addDagLine(tempDag,sourceId,targetId);
                    }
                }
                isFork = false;
            } else {
                if (lastNode) {
                    var lastLen = lastNode.length;
                    var sourceId = lastNode[lastLen - 1].id;
                    angular.forEach(currentNode, function (n) {
                        var targetId = n.id;
                        addDagLine(tempDag, sourceId, targetId);
                    });
                }
                isFork = true;
            }

            angular.forEach(currentNode, function (n) {
                tempNodes.push(n);
            });
        } else {
            if (lastNode) {
                var lastLen = lastNode.length;
                var targetId = currentNode[0].id;
                if (isFork) {
                    for (var n = 0;n<lastLen;n++) {
                        var sourceId= lastNode[n].id;
                        addDagLine(tempDag,sourceId,targetId);
                    }
                } else {
                    var sourceId = lastNode[lastLen-1].id;
                    addDagLine(tempDag,sourceId,targetId);
                }
            }
            tempNodes.push(currentNode[0]);
        }
    }
    tempDag.nodes = [];
    tempDag.nodes = tempNodes
    return tempDag;
}
function addDagLine(dag, sourceid, targetid){
    var edges=dag.edges;
    if(edges&&angular.isArray(edges)){
        if(!edges.some(function(x){return x.source===sourceid && x.target===targetid;})){
            edges.push({source:sourceid,target:targetid});
        }
    }else{
        dag.edges=[{source:sourceid,
            target:targetid}];
    }
}

//服务代码
this.ComParam = ComParam;
this.ComTemplate = ComTemplate;
this.Com = Com;
this.ViewCom = ViewCom;
this.ChartCom = ChartCom;
this.CompositeCom = CompositeCom;
this.PythonCom = PythonCom;
this.ComNode = ComNode;
this.CompileContext = CompileContext;
this.compileDag = compileDag;
this.compileDag2 = compileDag2;
this.getOozieXml=getOozieXml;
this.ComLibSrv = null;

module.exports = this;

