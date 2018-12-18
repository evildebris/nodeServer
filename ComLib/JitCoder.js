paramModelService =require('./paramModelService');
//常量定义

//变量定义
var _self = this;

this.ComponentLibrarySrv=undefined;

var _initiated = false;

var engineList = [];
var compiledScope = null;
var angularObjectRegistry = {};
var editorModeList = {
    'ace/mode/scala': '%spark\n',
    'ace/mode/sql': '%sql\n',
    'ace/mode/markdown': '%md\n',
    'ace/mode/sh': '%sh\n'
};
var currentFlowId = "";
var nextStepFnList = {};
var nodeParamSettingSchema = null;
var nodeParamSettingAxisPType = "axis";
var nodeParamSettingInputTablePType = "inputTable";
var nodeParamSettingLayoutPType = "layout";
//结果数据表的最长生命期：12小时，即43200000毫秒。0表示无限时。
var resultTableMaxLiving = 43200000;

var angularWatchScriptTemplate = '\nz.angularBind("linkageP_<#NodeId#>_<#ChartId#>","")\n' + 'z.angularWatch("linkageP_<#NodeId#>_<#ChartId#>",(before,after)=>{\n' + 'val s1=after.toString().split("<#NG&OBJ#>")\n' + "var conjParam= new scala.collection.mutable.HashMap[String, Any]()\n" + "for(s2 <- s1){\n" + 'val s3=s2.split("=",2)\n' + "conjParam(s3(0))=if(s3.length>1){\n" + 'if(s3(1).startsWith("\\"") && s3(1).endsWith("\\"")) s3(1).substring(1,s3(1).length-1) else java.lang.Float.parseFloat(s3(1))\n' + '} else null\n' + '}\n' + 'var linkageParam:scala.collection.mutable.HashMap[String,Any]=try{\n' + 'if(z.get("linkageParam")==null) new scala.collection.mutable.HashMap[String,Any]() else z.get("linkageParam").asInstanceOf[scala.collection.mutable.HashMap[String,Any]]\n' + '}catch{ case ex:Throwable => new scala.collection.mutable.HashMap[String,Any]()}\n' + 'linkageParam("<#NodeId#>_<#ChartId#>")=conjParam\n' + 'z.put("linkageParam",linkageParam)\n' + "})\n";
var angularUnwatchScriptTemplate = '\nz.angularUnwatch("linkageP_<#NodeId#>_<#ChartId#>")\n' +
    'z.angularUnbind("linkageP_<#NodeId#>_<#ChartId#>")\n';
var angularGetWatchScriptTemplate = 'val linkageP_<#LinkageParamName#>=linkageParam("<#LinkageParamName#>")\n';
var angularSqlScriptTemplate = '\nval sqlscript="""<#SqlScript#>"""\n' + 'var dfSql=sqlContext.sql(sqlscript)\n' + 'outputrdd.put("<#rddtablename#>",dfSql)\n' + 'dfSql.registerTempTable("<#rddtablename#>")\n' + 'sqlContext.cacheTable("<#rddtablename#>")\n';

var linkageScriptComment = '//DAG linkage application script';
var linkageScriptTemplate = '<#LinkageScriptComment#>\n' +
    'def getLinkageParam():scala.collection.mutable.HashMap[String,Any]={try{if(z.get("linkageParam")==null) new scala.collection.mutable.HashMap[String,Any]() else z.get("linkageParam").asInstanceOf[scala.collection.mutable.HashMap[String,Any]]}catch{ case ex:Throwable => new scala.collection.mutable.HashMap[String,Any]()}}\n' +
    'def setLinkageParam(p:scala.collection.mutable.HashMap[String,Any])={z.put("linkageParam",p)}\n' +
    //'def getLogParam():String={try{if(z.get("log")==null) "" else z.get("log").asInstanceOf[String]}catch{ case ex:Throwable => ""}}\n'+
    '<#LinkageNodeFunc#>\n' +
    '<#LinkageWatchScript#>';
var linkageNodeFuncTemplate = '\ndef func_<#NodeId#>()={\n' +
    '<#LinkageGetWatchScript#>\n' +
    '<#LinkageNodeFuncBody#>\n' +
    '}\n';
var linkageGetWatchInitScriptTemplate = 'var linkageParam=getLinkageParam()\n';
var linkageWatchScriptTemplate_Old = '\nz.angularBind("linkageP_<#LinkageParamName#>","")\n' + 'z.angularWatch("linkageP_<#LinkageParamName#>",(before,after)=>{\n' + 'val afterstr=after.toString()\n' + 'val s1=afterstr.split("<#NG&OBJ#>")\n' + "var conjParam= new scala.collection.mutable.HashMap[String, Any]()\n" + "for(s2 <- s1){\n" + 'val s3=s2.split("=",2)\n' + 'if(!s3(0).startsWith("<#")&& !s3(0).endsWith("#>")){conjParam(s3(0))=if(s3.length>1){\n' + 'if(s3(1).startsWith("\\"") && s3(1).endsWith("\\"")) s3(1).substring(1,s3(1).length-1) else java.lang.Float.parseFloat(s3(1))\n' + '} else null\n' + '}}\n' + 'var linkageParam=getLinkageParam()\n' + 'linkageParam("<#LinkageParamName#>")=conjParam\n' + 'setLinkageParam(linkageParam)\n' + 'var rddstr=""\n' + '<#LinkageCallNodeScript#>\n' + 'if(rddstr.length>0){\n' + 'val rddloc=afterstr.indexOf("<#NG&RDD#>=")\n' + 'var newstr=if(rddloc>=0) afterstr.substring(0,rddloc) else afterstr\n' + 'newstr+=(if(newstr.length>0 && !newstr.endsWith("<#NG&OBJ#>")) "<#NG&OBJ#>" else "")+"<#NG&RDD#>=\\""+rddstr+"\\""\n' + 'if(!afterstr.equals(newstr)) {z.angularBind("linkageP_<#LinkageParamName#>",newstr)\n' + 'var logstr=z' + "}})\n";
var linkageWatchScriptTemplate_Bak1111 = '\ndef watchfunc_<#LinkageParamName#>(before:Any,after:Any):Unit={\n'
    + 'z.angularUnwatch("linkageP_<#LinkageParamName#>")\n'
    +'try{\n'
    + 'var afterstr=after.toString()\n'
    + 'val s1=afterstr.split("<#NG&OBJ#>")\n'
    + "var conjParam= new scala.collection.mutable.HashMap[String, Any]()\n"
    + "for(s2 <- s1){\n"
    + 'val s3=s2.split("=",2)\n'
    + 'if(!s3(0).startsWith("<#")&& !s3(0).endsWith("#>")){conjParam(s3(0))=if(s3.length>1){\n'
    + 'if(s3(1).startsWith("\\"") && s3(1).endsWith("\\"")) s3(1).substring(1,s3(1).length-1) else java.lang.Float.parseFloat(s3(1))\n'
    + '} else null\n'
    + '}}\n'
    + 'var linkageParam=getLinkageParam()\n'
    + 'linkageParam("<#LinkageParamName#>")=conjParam\n'
    + 'setLinkageParam(linkageParam)\n'
    + 'afterstr="wat=1<#NG&OBJ#>"+afterstr\n'
    + 'var rddstr=""\n'
    + 'try{\n'
    + '<#LinkageCallNodeScript#>\n'
    + '}catch{case ex:Throwable=>z.put("log",ex.toString())}\n'
    //+ 'if(rddstr.length>0){\n'
    + 'val rddloc=afterstr.indexOf("<#NG&OBJ#><#NG&RDD#>=")\n'
    + 'var newstr=if(rddloc>=0) afterstr.substring(0,rddloc) else afterstr\n'
    + 'newstr+=(if(newstr.length>0) "<#NG&OBJ#>" else "")+"<#NG&RDD#>=\\""+rddstr+"\\""\n'
    + 'if(!afterstr.equals(newstr)) z.angularBind("linkageP_<#LinkageParamName#>",newstr)\n'
    + 'val logstr="change linkageP_<#LinkageParamName#> to: "+newstr+"\\n"\nz.put("log",logstr)\n'
    //+ '}\n'
    +'}catch{case ex:Throwable=>z.put("log",ex.toString())}\n'
    + 'finally{z.angularWatch("linkageP_<#LinkageParamName#>",watchfunc_<#LinkageParamName#> _)}\n'
    + "}\n"
    + 'z.angularBind("linkageP_<#LinkageParamName#>","")\n'
    + 'z.angularWatch("linkageP_<#LinkageParamName#>",watchfunc_<#LinkageParamName#> _)';
var linkageWatchScriptTemplate = '\ndef watchfunc_<#LinkageParamName#>(before:Any,after:Any):Unit={\n'
    + 'z.angularUnwatch("linkageP_<#LinkageParamName#>")\n'
    +'z.put("log","")\n'
    +'try{\n'
    + 'val gson = new Gson()\n'
    + 'val conjParam: java.util.Map[String,String] = gson.fromJson(after.toString(), classOf[java.util.Map[String,String]])\n'
    + 'conjParam.remove("__ERR__")\n'
    + 'var linkageParam=getLinkageParam()\n'
    + 'linkageParam("<#LinkageParamName#>")=conjParam\n'
    + 'setLinkageParam(linkageParam)\n'
    + 'var rddstr=""\n'
    + 'try{\n'
    + '<#LinkageCallNodeScript#>\n'
    + '}catch{case ex:Throwable=>conjParam.put("__ERR__",ex.toString())}\n'
    + 'conjParam.put("__RDD__",rddstr)\n'
    + 'z.angularBind("linkageP_<#LinkageParamName#>",gson.toJson(conjParam))\n'
    + 'conjParam.remove("__RDD__")\n'
    +'}catch{case ex:Throwable=>z.put("log",ex.toString())}\n'
    + 'finally{z.angularWatch("linkageP_<#LinkageParamName#>",watchfunc_<#LinkageParamName#> _)}\n'
    + "}\n"
    + 'z.angularUnwatch("linkageP_<#LinkageParamName#>")\n'
    + 'z.angularBind("linkageP_<#LinkageParamName#>","")\n'
    + 'z.angularWatch("linkageP_<#LinkageParamName#>",watchfunc_<#LinkageParamName#> _)';
var linkageSqlNodeFuncBodyTemplate_Bak1111 = 'var sqlscript="""<#SqlScript#>"""\n'
    + 'var linkageParam=getLinkageParam()\n'
    + 'for ((pk,pv) <- linkageParam){\n'
    + 'try{val pv1=pv.asInstanceOf[scala.collection.mutable.HashMap[String,Any]]\n'
    + 'for ((fk,fv) <- pv1){\n'
    + 'sqlscript=sqlscript.replace("<#"+pk+"."+fk+"#>", fv match{case x:java.lang.Float => x.toString() case y:String => "\'"+y+"\'" case _ => "NULL"})}\n'
    + '}catch{case ex:Throwable=>{}}}\n'
    + 'sqlscript=sqlscript.replaceAll("<#[a-zA-Z0-9_]+[.][a-zA-Z0-9_]+#>","NULL")\n'
    + 'val dfSql=sqlContext.sql(sqlscript)\n'
    + 'outputrdd.put("<#rddtablename#>",dfSql)\n'
    + 'dfSql.registerTempTable("<#rddtablename#>")\n'
    + 'sqlContext.cacheTable("<#rddtablename#>")';
var linkageSqlNodeFuncBodyTemplate = ''//'import com.google.gson.Gson\nimport collection.JavaConversions._\n'
    +'var sqlscript="""<#SqlScript#>"""\n'
    + 'var linkageParam=getLinkageParam()\n'
    + 'for ((pk,pv) <- linkageParam){\n'
    + 'try{val pv1=pv.asInstanceOf[java.util.Map[String,String]]\n'
    + 'for ((fk,fv) <- pv1){\n'
    + 'sqlscript=sqlscript.replace("<#"+pk+"."+fk+"#>", fv)}\n'
    + '}catch{case ex:Throwable=>{z.put("log",ex.toString())}}}\n'
    + 'sqlscript=sqlscript.replaceAll("<#[a-zA-Z0-9_]+[.][a-zA-Z0-9\\u4e00-\\u9fa5_]+#>","NULL")\n'
    + 'z.put("log",z.get("log").asInstanceOf[String]+"\\n"+sqlscript)\n'
    + 'val dfSql=sqlContext.sql(sqlscript)\n'
    + 'outputrdd.put("<#rddtablename#>",dfSql)\n'
    + 'dfSql.registerTempTable("<#rddtablename#>")\n'
    + 'sqlContext.cacheTable("<#rddtablename#>")';
var linkageParamScriptTemplate = 'linkageP_<#LinkageParamName#>("<#FieldName#>")';
var linkageCallNodeScriptTemplate = 'func_<#NodeId#>()\n';
var linkageDataViewNodeFuncTemplate = '\ndef func_<#NodeId#>(isget:Boolean*):String={\n' +
    'if(isget.length>0&&isget(0)){<#LinkageGetRDD#>} else {<#LinkageShowRDD#>\n' +
    '""}\n' +
    '}\n';
var linkageCallDataViewScriptTemplate = 'rddstr+=func_<#NodeId#>(true)\n';

//流处理应用代码模板
var nameLinkageScriptTemplate = '<#GlobalLevel#>'+
    'object ZZJZ_<#FlowId#>_<#RunNodeId#> extends Serializable {\n' +
    'import com.google.gson.Gson\nimport collection.JavaConversions._\n'+
    ' def getLinkageParam():scala.collection.mutable.HashMap[String,Any]={try{if(z.get("linkageParam")==null) new scala.collection.mutable.HashMap[String,Any]() else z.get("linkageParam").asInstanceOf[scala.collection.mutable.HashMap[String,Any]]}catch{ case ex:Throwable => new scala.collection.mutable.HashMap[String,Any]()}}\n' +
    ' def getLinkageParam(p:String):scala.collection.mutable.HashMap[String,Any]={try{if(z.get("linkageParam")==null) new scala.collection.mutable.HashMap[String,Any]() else z.get("linkageParam").asInstanceOf[scala.collection.mutable.HashMap[String,Any]].get(p).asInstanceOf[scala.collection.mutable.HashMap[String,Any]]}catch{ case ex:Throwable => new scala.collection.mutable.HashMap[String,Any]()}}\n' +
    ' def setLinkageParam(p:scala.collection.mutable.HashMap[String,Any])={z.put("linkageParam",p)}\n' +
    ' def getRdd(n:String):org.apache.spark.sql.DataFrame={try{z.rdd(n).asInstanceOf[org.apache.spark.sql.DataFrame]} catch{ case ex:Throwable => null}}\n' +
    'var rddList:scala.collection.mutable.HashMap[String,AnyRef]=null\n' +
    'var outputRdds=new scala.collection.mutable.ArrayBuffer[AnyRef]()\n' +
    '<#ObjectLevel#>\n'+
    '<#LinkageNodeFunc#>\n' +
    '<#LinkageWatchScript#>\n' +
    ' def applyCall():Unit={\n' +
    '<#ApplyCallNodeFunc#>' +
    '}\n' +
    'def apply(oRddList:scala.collection.mutable.HashMap[String,AnyRef]):scala.collection.mutable.HashMap[String,AnyRef]={\n' +
    'rddList=if(oRddList!=null&&oRddList.size>0) oRddList.clone else new scala.collection.mutable.HashMap[String,AnyRef]()\n' +
    'applyCall()\n' +
    'outputRdds.toArray\n' +
    'rddList\n' +
    '}\n' +
    'def apply(rdd:org.apache.spark.rdd.RDD[_]):scala.collection.mutable.HashMap[String,AnyRef]={\n' +
    'rddList=new scala.collection.mutable.HashMap[String,AnyRef]()\n' +
    'if(rdd!=null) rddList("StreamRDD")=rdd\n' +
    'applyCall()\n' +
    'outputRdds.toArray\n' +
    'rddList\n' +
    '}\n' +
    '}\n';
var nameLinkageNodeFuncTemplate = '\ndef func_<#NodeId#>()={\n' +
    '<#LinkageGetWatchScript#>\n' +
    '<#LinkageNodeFuncBody#>\n' +
    '}\n';
var nameLinkageGetWatchInitScriptTemplate = 'var linkageParam=getLinkageParam()\n';
var nameLinkageWatchScriptTemplate = '\ndef watchfunc_<#LinkageParamName#>(before:Any,after:Any):Unit={\n'
    + 'z.angularUnwatch("linkageP_<#LinkageParamName#>")\n'
    + 'val afterstr=after.toString()\n'
    + 'val s1=afterstr.split("<#NG&OBJ#>")\n'
    + "var conjParam= new scala.collection.mutable.HashMap[String, Any]()\n"
    + "for(s2 <- s1){\n"
    + 'val s3=s2.split("=",2)\n'
    + 'if(!s3(0).startsWith("<#")&& !s3(0).endsWith("#>")){conjParam(s3(0))=if(s3.length>1){\n'
    + 'if(s3(1).startsWith("\\"") && s3(1).endsWith("\\"")) s3(1).substring(1,s3(1).length-1) else java.lang.Float.parseFloat(s3(1))\n'
    + '} else null\n'
    + '}}\n'
    + 'var linkageParam=getLinkageParam()\n'
    + 'linkageParam("<#LinkageParamName#>")=conjParam\n'
    + 'setLinkageParam(linkageParam)\n'
    + 'afterstr="wat=1<#NG&OBJ#>"+afterstr\n'
    + 'var rddstr=""\n'
    + '<#LinkageCallNodeScript#>\n'
    + 'if(rddstr.length>0){\n'
    + 'val rddloc=afterstr.indexOf("<#NG&OBJ#><#NG&RDD#>=")\n'
    + 'var newstr=if(rddloc>=0) afterstr.substring(0,rddloc) else afterstr\n'
    + 'newstr+=(if(newstr.length>0) "<#NG&OBJ#>" else "")+"<#NG&RDD#>=\\""+rddstr+"\\""\n'
    + 'if(!afterstr.equals(newstr)) z.angularBind("linkageP_<#LinkageParamName#>",newstr)\n'
    + '}\n'
    + 'z.angularWatch("linkageP_<#LinkageParamName#>",watchfunc_<#LinkageParamName#> _)\n'
    + "}\n"
    + 'z.angularUnwatch("linkageP_<#LinkageParamName#>")\n'
    + 'z.angularBind("linkageP_<#LinkageParamName#>","")\n'
    + 'z.angularWatch("linkageP_<#LinkageParamName#>",watchfunc_<#LinkageParamName#> _)';
var nameLinkageSqlNodeFuncBodyTemplate = 'var sqlscript="""<#SqlScript#>"""\n' + 'var linkageParam=getLinkageParam()\n' + 'for ((pk,pv) <- linkageParam){\n' + 'try{val pv1=pv.asInstanceOf[scala.collection.mutable.HashMap[String,Any]]\n' + 'for ((fk,fv) <- pv1){\n' + 'sqlscript=sqlscript.replace("<#"+pk+"."+fk+"#>", fv match{case x:java.lang.Float => x.toString() case y:String => "\'"+y+"\'" case _ => "NULL"})}\n' + '}catch{case ex:Throwable=>{}}}\n' + 'sqlscript=sqlscript.replaceAll("<#[a-zA-Z0-9_]+[.][a-zA-Z0-9_]+#>","NULL")\n' + 'val dfSql=sqlContext.sql(sqlscript)\n' + 'outputrdd.put("<#rddtablename#>",dfSql)\n' + 'dfSql.registerTempTable("<#rddtablename#>")\n' + 'sqlContext.cacheTable("<#rddtablename#>")';
var nameLinkageParamScriptTemplate = 'linkageP_<#LinkageParamName#>("<#FieldName#>")';
var nameLinkageCallNodeScriptTemplate = 'func_<#NodeId#>()\n';
var nameLinkageDataViewNodeFuncTemplate = '\ndef func_<#NodeId#>(isget:Boolean*):String={\n' +
    'if(isget.length>0&&isget(0)){<#LinkageGetRDD#>} else {<#LinkageShowRDD#>\n' +
    '""}\n' +
    '}\n';
var nameLinkageCallDataViewScriptTemplate = 'rddstr+=func_<#NodeId#>(true)\n';
//var nameLinkageCallScriptTemplate = 'ZZJZ_<#FlowId#>_<#RunNodeId#>(null.asInstanceOf[scala.collection.mutable.HashMap[String,AnyRef]])\n';
var nameLinkageCallVarScriptTemplate = 'var rddList=new scala.collection.mutable.HashMap[String,AnyRef]()\n'
    +'<#InputRddList#>\n';
var nameLinkageCallScriptTemplate = 'rddList=ZZJZ_<#FlowId#>_<#RunNodeId#>(rddList)\n';
var nameLinkageCallRecursionScriptTemplate = 'rddList=ZZJZ_<#FlowId#>_<#RunNodeId#>(rddList)\n';
var nameLinkageCallScriptRddTemplate = 'ZZJZ_<#FlowId#>_<#RunNodeId#>.getRdd("<#RddName#>")';
var nameAngularGetWatchScriptTemplate = 'val linkageP_<#LinkageParamName#>=getLinkageParam("<#LinkageParamName#>")\n';
var nameLinkageStreamCallScriptTemplate = 'ZZJZ_<#FlowId#>_<#RunNodeId#>';
var nameInputRddListTemplate='rddList("<#RddName#>")=z.rdd("<#RddName#>")\n';

//UDT代码模板，专为彭工开发
var udtScriptTemplate='import org.apache.spark.sql.Row\n'
    +'import org.apache.spark.sql.types._\n'
    +'@SQLUserDefinedType(udt = classOf[<#UdtClassName#>])\n'
    +'class <#UdtClassName#> extends UserDefinedType[Vector[Tuple<#UdtFieldCount#>[<#UdtFieldDataTypeList#>]]] {\n'
    +'  override def sqlType: StructType = {\n'
    +'    StructType(Seq(\n'
    +'      StructField("<#UdtClassName#>",\n'
    +'        ArrayType(\n'
    +'          StructType(Seq(\n'
    +'            <#UdtStructFieldDefineList#>)),\n'
    +'          containsNull = false), nullable = false)\n'
    +'    )\n'
    +'    )\n'
    +'  }\n'
    +'  override def serialize(obj: Any): Row = {\n'
    +'    obj match {\n'
    +'      case v: Iterable[(<#UdtFieldDataTypeList#>)] =>\n'
    +'        val row = Row(v.toArray)\n'
    +'        row\n'
    +'      case row: Row =>\n'
    +'        row\n'
    +'    }\n'
    +'  }\n'
    +'  override def deserialize(datum: Any): Vector[Tuple<#UdtFieldCount#>[<#UdtFieldDataTypeList#>]] = {\n'
    +'    datum match {\n'
    +'      case row: Row =>\n'
    +'        require(row.length == 1, s"<#UdtClassName#>.deserialize given row with length ${row.length} " +\n'
    +'          s"but requires length == 1")\n'
    +'        val values = row.getAs[Array[Tuple<#UdtFieldCount#>[<#UdtFieldDataTypeList#>]]](0).toVector\n'
    +'        values\n'
    +'      case v =>\n'
    +'        v.asInstanceOf[Vector[Tuple<#UdtFieldCount#>[<#UdtFieldDataTypeList#>]]]\n'
    +'    }\n'
    +'  }\n'
    +'  override def pyUDT: String = "com.zzjz.deepinsight.trace.<#UdtClassName#>"\n'
    +'  override def userClass: Class[Vector[Tuple<#UdtFieldCount#>[<#UdtFieldDataTypeList#>]]] = classOf[Vector[Tuple<#UdtFieldCount#>[<#UdtFieldDataTypeList#>]]]\n'
    +'  override def equals(o: Any): Boolean = {\n'
    +'    o match {\n'
    +'      case v: <#UdtClassName#> => true\n'
    +'      case _ => false\n'
    +'    }\n'
    +'  }\n'
    +'  //override def hashCode: Int = 79192\n'
    +'  override def typeName: String = "Vector[Tuple<#UdtFieldCount#>[<#UdtFieldDataTypeList#>]]"\n'
    +'  override def asNullable: <#UdtClassName#> = this\n'
    +'}\n'
    +'case object <#UdtClassName#> extends <#UdtClassName#>\n';
var udtStructFieldDefineTemplate='StructField("<#UdtFieldName#>", <#UdtFieldDataType#>Type, nullable = <#UdtFieldNullable#>)';

this.nodeState_Waiting = "waiting";
this.nodeState_Running = "running";
this.nodeState_Finished = "finished";
this.nodeState_Error = "error";
this.defaultNodeType = "ace/mode/scala";
this.dataViewNodeType = "dataview";


var scriptNodeFunc=[]; //多个节点

var callScript=[];//多个call



//add  生成单个执行函数体
var nameNodeFuncTemplate = '\ndef func_<#NodeId#>()={\n' +
    '<#NodeFuncBody#>\n' +
    '}\n';

//全局函数定义,多个节点，多个nodeScripts并且是一一对应
function code(node){
    commonService.setCurrentWorkflowModeName(node.data.displayName);
    var workTableCtrl = workTableService.getWorkTableScope();
    //版本2
    var dag = {
        edges: [],
        nodes: [node.data]
    };
    var flowId="";
    var nodeId=node.data.paragraphId;
    var runScript = getDagRunScript(flowId, nodeId, dag, false);//单个执行代码
    runScript.script += runScript.callScript;

    //def func_1012313904()={ }添加方法体
    var funcTemplate=angular.copy(nameNodeFuncTemplate);
    funcTemplate=funcTemplate.replace(/<#NodeId#>/g, noteId);
    funcTemplate=funcTemplate.replace(/<#NodeFuncBody#>/g, runScript.script);
    scriptNodeFunc.push(funcTemplate);
    var callNodeScriptTemplate=angular.copy(nameLinkageCallNodeScriptTemplate);
    callNodeScriptTemplate=callNodeScriptTemplate.replace(/<#NodeId#>/g, noteId);
    callScript.push(callNodeScriptTemplate);
    return runScript;
}


var getMyStage = function (dag, node, stage, viewList) {
    if (!node || !dag || !stage || !viewList)
        return undefined;
    stage.push(node);
    var pstNodes = self.findPostNodes(dag, node);
    if (node.libarary&&node.libarary.type == self.dataViewNodeType) {
        pstNodes.forEach(function (x) {
            if (!viewList.some(function (y) {
                    return y.id == x;
                })) {
                viewList.push(getNodeById(dag, x));
            }
        });
    } else {
        pstNodes.forEach(function (x) {
            getMyStage(dag, getNodeById(dag, x), stage, viewList);
        });
    }
    //对节点进行优化：删除重复节点（将靠前的重复节点删除）
    var nindex = stage.length - 1;
    while (nindex > 0) {
        for (var i = nindex - 1; i >= 0; i--) {
            if (stage[i].id == stage[nindex].id) {
                //重复节点
                stage.splice(i, 1);
                nindex--;
            }
        }
        nindex--;
    }
    return stage;
};
/**
 * 分析DAG，以数据展示节点为分隔，划分为阶段列表。返回按顺序的阶段列表，每个阶段是节点数组
 * @param dag 待执行DAG
 * @param head DAG的首节点
 * @returns {Array}返回按顺序的阶段列表，每个阶段是节点数组
 */
this.getStagesByDag = function (dag, head) {
    //分析DAG，以数据展示节点为分隔，划分为阶段列表
    var stageList = [];
    var vList = [];
    var nd = head;
    var dagcopy = null;
    if (!nd) {
        dagcopy = angular.copy(dag);
        //添加虚拟首节点
        nd = {id: "vitualHeadNode", libarary: {type: "virtual"}};
        var headIds = [];
        dagcopy.nodes.forEach(function (x) {
            if (!dagcopy.edges.some(function (y) {
                    return y.target == x.id;
                })) {
                headIds.push(x.id);
            }
        });
        dagcopy.nodes.push(nd);
        headIds.forEach(function (x) {
            dagcopy.edges.push({source: "vitualHeadNode", target: x});
        });
    } else {
        dagcopy = dag;
    }
    while (true) {
        //提取当前阶段，并将相应的数据展示节点入vList队列
        var stage = getMyStage(dagcopy, nd, [], vList);
        if (!stage || stage.length == 0) {
            //已分析完所有节点
            break;
        }
        //去掉虚拟首节点
        for (var i = stage.length - 1; i >= 0; i--) {
            if (stage[i].id == "vitualHeadNode") {
                stage.splice(i, 1);
            }
        }
        stageList.push(stage);
        //准备提取下一个阶段
        nd = vList.shift();
    }
    return stageList;
};
//%spark.spark
var getInterpreter=function(){
    var usrMsg=loginService.getCookies();
    if(usrMsg&&usrMsg.interpreters&&usrMsg.interpreters.length>0){
        var interpreter="";
        for(var i=0;i<usrMsg.interpreters.length;i++){
            var inter=usrMsg.interpreters[i];
            if(inter.resourceName){
                inter=inter.resourceName.split(" ");
                if(inter.length>1){
                    var inters=inter[1].split(",");
                    if(inters.length>0){
                        if(AppUtil.some(inters,function(x){return x.indexOf("spark")>=0;})){
                            return inter[0]+".spark";
                        }
                    }
                }
            }
        }
    }
    return null;
};
/**
 * 根据DAG创建包含唯一命名空间的运行脚本，该脚本统一为scala语言
 * @param flowId该脚本运行的流程ID，即NoteId
 * @param nodeId该脚本运行的节点ID，即ParagraphId
 * @param dag
 * @param isStream该脚本是否应用于流处理，false表示应用于批处理，true表示应用于流处理
 * @returns {string}返回执行脚本
 */
var getDagRunScript = function (flowId, nodeId, dag, isStream, subRecursion) {
    var timeProbe1=new Date();
    var runParam = {
        script: "",
        callScript: "",
        type: self.defaultNodeType
    };
    if (!flowId || !nodeId || !dag || !dag.edges || !dag.nodes)
        return runParam;
    var runDag = angular.copy(dag);
    //判断DAG是否只有单一首节点。否则创建虚拟首节点
    var edges = runDag.edges;
    var headNodes = [],
        tailNodes = [];
    var headNode;
    runDag.nodes.forEach(function (x) {
        if (!edges.some(function (y) {
                return x.id == y.target;
            })) {
            headNodes.push(x);
        }
        if (!edges.some(function (y) {
                return x.id == y.source;
            })) {
            tailNodes.push(x);
        }
    });
    if (headNodes.length == 0) {
        //无首节点
        console.debug("分析DAG时未找到首节点");
        return runParam;
    } else if (headNodes.length > 1) {
        //多个首节点，则添加虚拟首节点
        headNode = {
            id: "virtualHeadNode",
            paragraphId: nodeId,
            libarary: {
                type: "virtual",
                context: ""
            }
        };
        runDag.nodes.push(headNode);
        headNodes.forEach(function (x) {
            runDag.edges.push({
                source: headNode.id,
                target: x.id
            });
        });
    } else {
        headNode = headNodes[0];
    }
    //此时runDag是一棵树
    //找到首节点，将DAG分解成阶段，便于生成联动Watch脚本
    var stageList = self.getStagesByDag(runDag, headNode);
    //生成每个节点的执行函数脚本
    var nodeFuncScript = "";
    var npList={};
    for (var i = 0; i < dag.nodes.length; i++) {
        //节点如果是复合算子，则采用递归创建脚本
        var np = null,
            node = dag.nodes[i];
        if (node.libarary && node.libarary.workflowId && node.libarary.workflowId != '0' && node.libarary.workflowId != '-1'
            && node.libarary.wDiagramJSONString) {
            //复合算子
            if(node.libarary.context&&node.libarary.context.length>0){
                //第二版复合算子
                var subDag=JSON.parse(node.libarary.context);
                var cmpdParam={};
                try{
                    cmpdParam=JSON.parse(node.paramSetting);
                }catch(e){}
                //将复合算子的参数设置逐节点extend到subDag中
                angular.forEach(cmpdParam, function(ndParam, nd){
                    var oldNode=subDag.nodes.filter(function(x){return x.id==nd;});
                    oldNode=(oldNode&&oldNode.length>0)?oldNode[0]:null;
                    if(oldNode){
                        oldNode.paramSetting=JSON.stringify(ndParam);
                    }
                });
                node.libarary.context=JSON.stringify(subDag);
                np=getDagRunScript(flowId, node.paragraphId, subDag, isStream, true);
            }else{
                //第一版复合算子
                var subDag = JSON.parse(node.libarary.wDiagramJSONString);
                np = getDagRunScript(flowId, node.paragraphId, subDag, isStream, true);
            }
        } else {
            //普通算子
            np = applyNameLinkageNodeFuncTemplate(node, isStream,
                headNodes.some(function (x) {
                    return x.id == node.id;
                }),
                tailNodes.some(function (x) {
                    return x.id == node.id;
                }));
        }
        nodeFuncScript += np.script;
        npList[node.id]=np;
    }
    //生成每个阶段的联动Watch脚本
    var callNodeScript = buildNameStageLinkageWatchScript(stageList[0], flowId, true, npList);
    var watchScript = "";
    for (var i = 1; i < stageList.length; i++) {
        var nodes = stageList[i];
        watchScript += buildNameStageLinkageWatchScript(nodes, flowId, i == 0, npList);
    }
    //构建runParam
    var nodeIdSN=self.getNodeSN(nodeId);
    runParam.script = nameLinkageScriptTemplate.replace(/<#LinkageNodeFunc#>/g, nodeFuncScript);
    runParam.script = runParam.script.replace(/<#LinkageWatchScript#>/g, watchScript);
    runParam.script = runParam.script.replace(/<#ApplyCallNodeFunc#>/g, callNodeScript);
    runParam.script = runParam.script.replace(/<#FlowId#>/g, flowId);
    runParam.script = runParam.script.replace(/<#RunNodeId#>/g, nodeIdSN);
    //提取<#objectLevel#>标签
    var objLevels=[],idxS=0,idxE=0;
    while((idxS=runParam.script.indexOf("<#objectLevel#>",idxE))!=-1){
        if((idxE=runParam.script.indexOf("<#/objectLevel#>",idxS))>idxS){
            var s=runParam.script.substring(idxS+15,idxE);
            objLevels.push(s);
        }
    }
    idxS=0,idxE=0;
    while((idxS=runParam.script.indexOf("<#objectLevel#>"))!=-1){
        if((idxE=runParam.script.indexOf("<#/objectLevel#>",idxS))>idxS){
            runParam.script=runParam.script.substr(0,idxS)+
                runParam.script.substr(idxE+16);
        }else{
            break;
        }
    }
    runParam.script=runParam.script.replace(/<#ObjectLevel#>/g,objLevels.join("\n"));
    //提取<#globalLevel#>标签
    objLevels=[],idxS=0,idxE=0;
    while((idxS=runParam.script.indexOf("<#globalLevel#>",idxE))!=-1){
        if((idxE=runParam.script.indexOf("<#/globalLevel#>",idxS))>idxS){
            var s=runParam.script.substring(idxS+15,idxE);
            objLevels.push(s);
        }
    }
    idxS=0,idxE=0;
    while((idxS=runParam.script.indexOf("<#globalLevel#>"))!=-1){
        if((idxE=runParam.script.indexOf("<#/globalLevel#>",idxS))>idxS){
            runParam.script=runParam.script.substr(0,idxS)+
                runParam.script.substr(idxE+16);
        }else{
            break;
        }
    }
    runParam.script=runParam.script.replace(/<#GlobalLevel#>/g,objLevels.join("\n"));

    runParam.objectName="ZZJZ_<#FlowId#>_<#RunNodeId#>".replace(/<#FlowId#>/g, flowId)
        .replace(/<#RunNodeId#>/g, nodeIdSN);
    if (subRecursion) {
        runParam.callScript = nameLinkageCallRecursionScriptTemplate.replace(/<#FlowId#>/g, flowId).replace(/<#RunNodeId#>/g, nodeIdSN);
    } else {
        if (isStream) {
            runParam.callScript = nameLinkageStreamCallScriptTemplate.replace(/<#FlowId#>/g, flowId).replace(/<#RunNodeId#>/g, nodeIdSN);
        } else {
            //获取DAG各节点的输入RDD名
            var inputrddStr="";
            for(var i=0;i<dag.nodes.length;i++){
                var param=dag.nodes[i].paramSetting;
                //if(param&&self.ComponentLibrarySrv){
                //    param=JSON.parse(param);
                if(self.ComponentLibrarySrv){
                    try{
                        param=JSON.parse(param);
                    }catch(exp){
                        param={};
                    }
                    if(dag.nodes[i].libarary) {
                        if (dag.nodes[i].libarary.type == "combiner") {
                            //复合算子
                            var inrdd1 = self.ComponentLibrarySrv.getModelValuesByType4Composite(param,
                                dag.nodes[i].libarary.componentID, nodeParamSettingInputTablePType);
                            var inrdd2 = self.ComponentLibrarySrv.getModelValuesByType4Composite(param,
                                dag.nodes[i].libarary.componentID, "rdd");
                            var rddList = [];
                            angular.forEach(inrdd1, function (r, k) {
                                if (!AppUtil.contains(rddList, r)) {
                                    rddList.push(r);
                                }
                            });
                            angular.forEach(inrdd2, function (r, k) {
                                if (!AppUtil.contains(rddList, r)) {
                                    rddList.push(r);
                                }
                                inputrddStr += nameInputRddListTemplate.replace(/<#RddName#>/g, r);
                            });
                            angular.forEach(rddList, function (r) {
                                inputrddStr += nameInputRddListTemplate.replace(/<#RddName#>/g, r);
                            });
                        } else if (dag.nodes[i].libarary.componentType == "component" && dag.nodes[i].libarary.type != "dataview") {
                            //普通算法算子
                            var inrdd1 = self.ComponentLibrarySrv.getModelValuesByType(param,
                                dag.nodes[i].libarary.componentID, nodeParamSettingInputTablePType);
                            var inrdd2 = self.ComponentLibrarySrv.getModelValuesByType(param,
                                dag.nodes[i].libarary.componentID, "rdd");
                            angular.forEach(inrdd1, function (r, k) {
                                if(r) {
                                    inputrddStr += nameInputRddListTemplate.replace(/<#RddName#>/g, r);
                                }
                            });
                            angular.forEach(inrdd2, function (r, k) {
                                if(r) {
                                    inputrddStr += nameInputRddListTemplate.replace(/<#RddName#>/g, r);
                                }
                            });
                        }else if(dag.nodes[i].libarary.type == "dataview"){
                            //视图算子
                            if(param.modelList){
                                angular.forEach(param.modelList,function(model){
                                    var inTableName = paramModelService.getModelValuesByType(model, nodeParamSettingInputTablePType);
                                    for(var k in inTableName){
                                        if(k && inTableName[k] && typeof(inTableName[k])!='function') {
                                            inputrddStr += nameInputRddListTemplate.replace(/<#RddName#>/g, inTableName[k]);
                                        }
                                    }
                                });
                            }
                        }else if(dag.nodes[i].libarary.workflowId="999999" && dag.nodes[i].libarary.wDiagramJSONString){
                            //联动复合算子
                            try {
                                var subdag1 = JSON.parse(dag.nodes[i].libarary.wDiagramJSONString);
                                angular.forEach(subdag1.nodes, function (n) {
                                    try {
                                        if (n.libarary.type == "dataview") {
                                            var nparam = JSON.parse(n.paramSetting);
                                            if(nparam.modelList){
                                                angular.forEach(nparam.modelList,function(model){
                                                    var inTableName = paramModelService.getModelValuesByType(model, nodeParamSettingInputTablePType);
                                                    for(var k in inTableName){
                                                        if(k && inTableName[k] && typeof(inTableName[k])!='function') {
                                                            inputrddStr += nameInputRddListTemplate.replace(/<#RddName#>/g, inTableName[k]);
                                                        }
                                                    }
                                                });
                                            }
                                        }
                                    }catch(ex){
                                        console.warn(ex);
                                    }
                                });
                            }catch(e){
                                console.warn("e");
                            }
                        }
                    }
                }
            }
            runParam.callScript = nameLinkageCallVarScriptTemplate.replace(/<#InputRddList#>/g,inputrddStr)
                +nameLinkageCallScriptTemplate.replace(/<#FlowId#>/g, flowId)
                    .replace(/<#RunNodeId#>/g, nodeIdSN);
        }
    }
    runParam.type = self.defaultNodeType;
    var timeProbe2=new Date();
    console.debug("生成节点脚本耗时%d毫秒",timeProbe2.getTime()-timeProbe1.getTime());
    return runParam;
};

//获取模版信息
this.getParentRunParam=function(flowId,nodeId){
    var runParam = {
        script: "",
        callScript: "",
        type: self.defaultNodeType
    };
    if(callScript.length==0||scriptNodeFunc.length==0||flowId==null||nodeId==null){
        return runParam;
    };
    //构建runParam
    var nodeIdSN=self.getNodeSN(nodeId);
    var scriptTemplate= angular.copy(nameLinkageScriptTemplate);
    scriptTemplate=scriptTemplate.replace(/<#GlobalLevel#>/g,"");
    scriptTemplate=scriptTemplate.replace(/<#FlowId#>/g,flowId);
    scriptTemplate=scriptTemplate.replace(/<#RunNodeId#>/g,nodeIdSN);
    scriptTemplate=scriptTemplate.replace(/<#ObjectLevel#>/g,"");
    scriptTemplate=scriptTemplate.replace(/<#LinkageNodeFunc#>/g,scriptNodeFunc.join("\n"));
    scriptTemplate=scriptTemplate.replace(/<#LinkageWatchScript#>/g,"");
    scriptTemplate=scriptTemplate.replace(/<#ApplyCallNodeFunc#>/g,callScript.join("\n"));
    //inputrddStr
    runParam.callScript = nameLinkageCallVarScriptTemplate.replace(/<#InputRddList#>/g,"")
        +nameLinkageCallScriptTemplate.replace(/<#FlowId#>/g, flowId)
            .replace(/<#RunNodeId#>/g, nodeIdSN);

    //在脚本前加上interpreter标记
    if(!AppUtil.stringStartWith(runParam.script,"%")){
        var interpreter=getInterpreter();
        if(interpreter){
            runParam.script="%"+interpreter+"\n"+runParam.script;
        }
    }

    runParam.objectName="ZZJZ_<#FlowId#>_<#RunNodeId#>".replace(/<#FlowId#>/g, flowId)
        .replace(/<#RunNodeId#>/g, nodeIdSN);
    return runParam;
};

/**
 * 获取paragraphID的唯一标示码，即创建paragraph的系统时间（毫秒数），静态函数
 * @param nodeid nodeId，即paragraphID
 * @returns {*}唯一标示码，字符串
 */
this.getNodeSN = function (nodeid) {
    return nodeid.split("_")[1];
};

/**
 * 按LinkageNodeFuncTemplate模板创建节点的nodeParam执行参数
 * @param data 节点数据
 * @returns {{script: string, type: (string|*)}}返回执行参数
 */
var applyNameLinkageNodeFuncTemplate = function (data, isStream, isHead, isTail) {
    //借用getNodeDebugParam的部分代码
    var nodeParam = {
        script: "",
        type: data.libarary?data.libarary.type:"component"
    };
    var pid = data.paragraphId.substring(16);
    var rddName = ((data.displayName && data.displayName.length > 0) ? data.displayName + "_" : "table") + pid;
    //var rddName = "table" + pid;
    var structTypeParam = "";
    var inputTableNames = "";
    var rddTableNames = [];
    var obj = null;
    if (data.paramSetting) {
        obj = JSON.parse(data.paramSetting);
        var modellist = obj.modelList;
        if (modellist) {
            var nameArray = new Array();
            for (var i = 0; i < modellist.length; i++) {
                var objt = modellist[i];
                //var inTableName = paramModelService.getModelFirstValueByType(objt, nodeParamSettingInputTablePType);
                //if (!AppUtil.contains(nameArray, inTableName))
                //    nameArray.push(inTableName);
                var inTableName = paramModelService.getModelValuesByType(objt, nodeParamSettingInputTablePType);
                for(var k in inTableName){
                    if(k && inTableName[k] && typeof(inTableName[k])!='function') {
                        if (!AppUtil.contains(nameArray, inTableName[k]))
                            nameArray.push(inTableName[k]);
                    }
                }

                if (structTypeParam == "")
                    structTypeParam += "StructField(\"" + objt.name + "\", " + objt.type + ", false)";
                else
                    structTypeParam += " :: StructField(\"" + objt.name + "\", " + objt.type + ", false)";
            }
            nodeParam.tableNameList = nameArray;

            //采用rddDisplay.showRDDsByNames(Seq("tableXXX"))方式获取数据
            for (var i = 0; i < nameArray.length; i++) {
                inputTableNames += '"' + nameArray[i] + '",';
                rddTableNames.push(nameArray[i]);
            }
            if (inputTableNames.length > 0) {
                inputTableNames = inputTableNames.substring(0, inputTableNames.length - 1);
            }
        }
        if (structTypeParam != "")
            structTypeParam += "::Nil";
        var obj2 = angular.copy(obj);
        var param = data.paramSetting.replace(/"/g, "\\\"");
        param = param.replace(/\\\\/g, "\\\\\\");
        if (obj.exprsParam) {
            if (obj.exprsParam.indexOf("$") > -1 || obj.exprsParam.indexOf(",") > -1) {
                obj.exprsParam = undefined;
                param = JSON.stringify(obj).replace(/"/g, "\\\"");
            }
        }
        if (obj.colsExprsParam) {
            if (obj.colsExprsParam.indexOf("$") > -1) {
                obj.colsExprsParam = undefined;
                param = JSON.stringify(obj).replace(/"/g, "\\\"");
            }
        }

    }
    var scala;
    if (obj && obj.scriptsContent) {
        scala = obj.scriptsContent;
    } else {
        scala = data.libarary?data.libarary.context:"";
    }
    //分析当前节点是否需要从前一节点获取联动参数，方法是分析脚本中是否包含字符：<#联动参数.列名#>
    var inputLinkageParamList = [];
    var plist = [];
    if (scala) {
        plist = scala.match(/<#[a-zA-Z0-9_]+\.[a-zA-Z0-9\u4e00-\u9fa5_]+#>/g);
        if (plist) {
            plist.forEach(function (x) {
                var y = x.split(".");
                var z = y[0].substring(2);
                if (!AppUtil.contains(inputLinkageParamList, z))
                    inputLinkageParamList.push(z);
            });
        }
    }
    if (param)
        scala = scala.replace(/<#jsonparam#>/g, param);
    //added by yanhui
    for (var key in  obj){
        var reg = new RegExp("<#"+key+"#>","g");
        scala = scala.replace(reg,obj[key]);
    }
    scala = scala.replace(/<#rddtablename#>/g, rddName);
    var inTableName = paramModelService.getModelFirstValueByType(obj, nodeParamSettingInputTablePType);
    if (obj && inTableName)
        scala = scala.replace(/<#inputtablename#>/g, inTableName);
    if (inputTableNames != "") {
        scala = scala.replace(/<#inputtablenames#>/g, inputTableNames);
    }else{
        scala=scala.replace(/<#inputtablenames#>/g, '');
    }
    //为实现向下兼容，更改联动脚本获取数据的方式为rddDisplay.showRDDsByNames(Seq("tableXXX"))方式
    //scala = scala.replace(/rddDisplay\.showRDDs\(Seq\(/g, "rddDisplay.showRDDsByNames2(Seq(");
    scala = scala.replace(/rddDisplay\.showRDDs\(Seq\(/g, "rddDisplay.showRDDsByNames3(rddList,Seq(");
    if (obj2 && obj2.exprsParam)
        scala = scala.replace(/<#exprsParam#>/g, obj2.exprsParam);
    if (obj2 && obj2.colsExprsParam)
        scala = scala.replace(/<#colsExprsParam#>/g, obj2.colsExprsParam);
    if (structTypeParam && structTypeParam != "")
        scala = scala.replace(/<#structTypeParam#>/g, structTypeParam);
    var lcstr = data.paramSetting;
    scala = scala.replace(/"""<#zzjzParam#>"""/g, '"""'+lcstr+'"""');
    scala = scala.replace(/"<#zzjzParam#>"/g, '"""'+lcstr+'"""');

    //生成UDT转换代码，专为彭工开发
    if(scala.indexOf("<#UdtClassDefine#>")>=0){
        var udtClassDefine="";
        //单个UDT定义
        if(obj.className&&obj.modelList&&obj.modelList.length>0) {
            var typeList = [];
            var structList = [];
            var refList=[];
            angular.forEach(obj.modelList, function (f,i) {
                typeList.push(f.type);
                refList.push("r("+(i+1).toString()+")");
                var udtfield=udtStructFieldDefineTemplate.replace(/<#UdtFieldName#>/g, f.name)
                    .replace(/<#UdtFieldDataType#>/g, f.type).replace(/<#UdtFieldNullable#>/g, "false");
                //匹配Array[]类型
                structList.push(udtfield);
                //替换字段名和类型
                scala=scala.replace(new RegExp("<#UdtClassDefine\\[0\\]\\["+i+"\\]\\.field#>","g"),f.name);
                scala=scala.replace(new RegExp("<#UdtClassDefine\\[0\\]\\["+i+"\\]\\.type#>","g"),f.type);
            });
            udtClassDefine+=udtScriptTemplate.replace(/<#UdtClassName#>/g,obj.className)
                .replace(/<#UdtFieldCount#>/g,obj.modelList.length)
                .replace(/<#UdtFieldDataTypeList#>/g,typeList.join(','))
                .replace(/<#UdtStructFieldDefineList#>/g,structList.join(','));
            scala=scala.replace(/<#UdtClassDefine\[0\]\.fieldDataTypeList#>/g,typeList.join(','));
            scala=scala.replace(/<#UdtClassDefine\[0\]\.fieldReferList#>/g,refList.join(','));
        }
        scala=scala.replace(/<#UdtClassDefine\[0\]#>/g,obj.className);
        scala=scala.replace(/<#UdtClassDefine\[0\]\.length#>/g,obj.modelList.length);
        scala=scala.replace(/<#UdtClassDefine\[0\]\.groupFieldName#>/g,(new self.FieldSchema(obj.groupField)).name);
        var groupFieldType=(new self.FieldSchema(obj.groupField)).datatype;
        if(groupFieldType){
            groupFieldType=groupFieldType.toLowerCase();
            var supportedTypeList=["String","Boolean","Byte","Short","Integer","Long","Float","Double","Decimal","Date","Timestamp","Null"];
            for(var i=0;i<supportedTypeList.length;i++){
                if(groupFieldType==supportedTypeList[i].toLowerCase()){
                    groupFieldType=supportedTypeList[i];
                    break;
                }
            }
        }
        scala=scala.replace(/<#UdtClassDefine\[0\]\.groupFieldType#>/g,groupFieldType);
        scala=scala.replace(/<#UdtClassDefine#>/g,udtClassDefine);
        scala=scala.replace(/<#UdtClassDefine\[0\]\.paramJson#>/g,JSON.stringify(obj));
    }
    //生成UDT转换代码，专为彭工开发

    //检查当前节点是否包含脚本类参数，检查是否含有<#zzjzParam.参数名#>变量
    //var varparam=[];
    //plist = scala.match(/<#zzjzParam\.[a-zA-Z0-9_]+#>/g);
    //if (plist) {
    //    plist.forEach(function (x) {
    //        var y = x.split(".");
    //        var z = y[1].substr(0,y[1].length-2);
    //        if (!AppUtil.contains(varparam, z))
    //            varparam.push(z);
    //    });
    //}
    //angular.forEach(varparam,function(x){
    //    //替换所有的<#zzjzParam.参数名#>变量
    //    scala=scala.replace(new RegExp("<#zzjzParam."+x+"#>","g"),obj?(obj[x]?obj[x]:""):"");
    //});
    var replaceFunc=function(pobj){
        angular.forEach(pobj,function(pv,pk){
            if(!angular.isObject(pv)){
                scala=scala.replace(new RegExp("<#zzjzParam."+pk+"#>","g"),pv.toString());
                scala=scala.replace(new RegExp("<#"+pk+"#>","g"),pv.toString());
            }else{
                replaceFunc(pv);
            }
        });
    };
    replaceFunc(obj);

    //根据节点类型，采用不同策略生成统一的spark脚本的运行参数
    if (nodeParam.type == self.dataViewNodeType) {
        //数据展示节点，策略是从RDD中获取数据，仅包含获取数据的脚本
        nodeParam.script = nameLinkageDataViewNodeFuncTemplate.replace(/<#NodeId#>/g, pid);
        nodeParam.script = nodeParam.script.replace(/<#LinkageGetWatchScript#>/g, "");
        var getrddscript = scala.replace("rddDisplay.showRDD", "rddDisplay.getRDD");
        nodeParam.script = nodeParam.script.replace(/<#LinkageShowRDD#>/g, scala);
        nodeParam.script = nodeParam.script.replace(/<#LinkageGetRDD#>/g, getrddscript);
    } else if (nodeParam.type == "ace/mode/sql") {
        //SQL算子节点，在服务端重构脚本
        nodeParam.script = nameLinkageNodeFuncTemplate.replace(/<#NodeId#>/g, pid);
        nodeParam.script = nodeParam.script.replace(/<#LinkageGetWatchScript#>/g, "");
        nodeParam.script = nodeParam.script.replace(/<#LinkageNodeFuncBody#>/g, linkageSqlNodeFuncBodyTemplate);
        nodeParam.script = nodeParam.script.replace(/<#SqlScript#>/g, scala);
        nodeParam.script = nodeParam.script.replace(/<#rddtablename#>/g, rddName);
    } else {
        //数据处理节点，策略是获取联动参数，然后执行脚本
        //默认此时脚本语言是scala，SparkInterpreter
        var watchScript = "";
        for (var i = 0; i < inputLinkageParamList.length; i++) {
            watchScript += nameAngularGetWatchScriptTemplate.replace(/<#LinkageParamName#>/g, inputLinkageParamList[i]);
        }
        //修改节点的运行脚本
        if (plist) {
            for (var i = 0; i < plist.length; i++) {
                var x = plist[i];
                var y = x.split(".");
                var y1 = y[0].substring(2);
                var y2 = y[1].substring(0, y[1].length - 2);
                var z = new RegExp(x, "g");
                scala = scala.replace(z, nameLinkageParamScriptTemplate.replace(/<#LinkageParamName#>/g, y1).replace(/<#FieldName#>/g, y2));
            }
        }
        nodeParam.script = nameLinkageNodeFuncTemplate.replace(/<#NodeId#>/g, pid);
        nodeParam.script = nodeParam.script.replace(/<#LinkageGetWatchScript#>/g,
            (watchScript.length > 0) ? nameLinkageGetWatchInitScriptTemplate + watchScript : watchScript);
        nodeParam.script = nodeParam.script.replace(/<#LinkageNodeFuncBody#>/g, scala);
    }

    nodeParam.type = self.defaultNodeType;
    nodeParam.tableNameList = [rddName];

    //针对唯一命名空间封装修改脚本：修改调用outputrdd.put和z.rdd
    /*if (isHead) {
     if (isStream) {
     //流处理的首节点，将z.rdd(XX)更改为rddList("StreamRDD")
     nodeParam.script = nodeParam.script.replace(/z\.rdd\((.*)\)/g, 'rddList("StreamRDD")');
     } else {
     //批处理的首节点，保留z.rdd(XX)
     //nodeParam.script=nodeParam.script.replace(/z\.rdd\((.*)\)/g, 'rddList($1)');
     }
     } else {
     //中间节点，将z.rdd(XX)更改为rddList(XX)
     nodeParam.script = nodeParam.script.replace(/z\.rdd\((.*)\)/g, 'rddList($1)');
     }
     if (isTail) {
     if (isStream) {
     //流处理的尾节点，将outputrdd.put(XX,YY)更改为outputRdds+=YY
     nodeParam.script = nodeParam.script.replace(/outputrdd\.put\((.*),(\s*)(.*)\)/g, 'outputRdds+=$3');
     }
     } else {
     //中间节点，将outputrdd.put(XX,YY)更改为rddList(XX)=YY
     nodeParam.script = nodeParam.script.replace(/outputrdd\.put\((.*),(\s*)(.*)\)/g, 'rddList($1)=$3');
     }*/
    if (isStream) {
        //流处理的首节点，将z.rdd(XX)更改为rddList("StreamRDD")
        nodeParam.script = nodeParam.script.replace(/z\.rdd\((.*)\)/g, 'rddList("StreamRDD")');
    } else {
        //中间节点，将z.rdd(XX)更改为rddList(XX)
        nodeParam.script = nodeParam.script.replace(/z\.rdd\((.*)\)/g, 'rddList($1)');
    }
    if (isStream) {
        if (isTail) {
            //流处理的尾节点，将outputrdd.put(XX,YY)更改为outputRdds+=YY
            nodeParam.script = nodeParam.script.replace(/outputrdd\.put\((.*),(\s*)(.*)\)/g, 'outputRdds+=$3');
        }
    } else {
        //将outputrdd.put(XX,YY)之后增加一行：rddList(XX)=YY
        var scriptLines=nodeParam.script.split(/\n/);
        for(var li=0;li<scriptLines.length;li++){
            var scr=scriptLines[li];
            if(scr.match(/\s*outputrdd\.put\((.+),(\s*)(.+)\)/)){
                var listStr=scr.replace(/outputrdd\.put\((.+),(\s*)(.+)\)/g, 'rddList($1)=$3');
                scriptLines.splice(++li,0,listStr);
            }
        }
        //nodeParam.script = nodeParam.script.replace(/outputrdd\.put\((.*),(\s*)(.*)\)/g, 'rddList($1)=$3');
        nodeParam.script=scriptLines.join("\n");
    }
    return nodeParam;
};

/**
 * 构建联动事件处理脚本
 * @param stage DAG的单个阶段，即节点列表
 */
var buildNameStageLinkageWatchScript = function (stage, flowId, first, scalaList) {
    var result = "";
    if (!stage || stage.length <= 0) return result;
    //分析第一个节点的输入参数，有多少个输入参数，就生成多少个联动脚本
    var data = stage[0];
    var pid = data.paragraphId.substring(16);
    var obj = null;
    if (data.paramSetting) {
        obj = JSON.parse(data.paramSetting);
    }
    //替换新的方法获取scala
    //var scala;
    //if (obj && obj.scriptsContent) {
    //    scala = obj.scriptsContent;
    //} else {
    //    scala = data.libarary.context;
    //}
    //替换新的方法获取scala
    var scala=(scalaList[data.id])?scalaList[data.id].script:null;
    if (first) {
        //第一个阶段，无需生成watch脚本，直接生成调用节点函数call脚本
        for (var i = 0; i < stage.length; i++) {
            var node = stage[i];
            if (node.id == "virtualHeadNode") continue;
            if (node.libarary && node.libarary.workflowId && node.libarary.workflowId != '0' && node.libarary.workflowId != '-1' && node.libarary.wDiagramJSONString) {
                result += nameLinkageCallRecursionScriptTemplate.replace(/<#FlowId#>/g, flowId).replace(/<#NodeId#>/g, self.getNodeSN(stage[i].paragraphId));
            } else {
                result += nameLinkageCallNodeScriptTemplate.replace(/<#NodeId#>/g, self.getNodeSN(stage[i].paragraphId));
            }
        }
    } else {
        //非第一个阶段，一定包含联动watch脚本
        //分析当前节点是否需要从前一节点获取联动参数，方法是分析脚本中是否包含字符：<#联动参数.列名#>
        var inputLinkageParamList = [];
        var plist = [];
        if (scala) {
            plist = scala.match(/<#[a-zA-Z0-9_]+\.[a-zA-Z0-9\u4e00-\u9fa5_]+#>/g);
            if (plist) {
                plist.forEach(function (x) {
                    var y = x.split(".");
                    var z = y[0].substring(2);
                    if (!AppUtil.contains(inputLinkageParamList, z))
                        inputLinkageParamList.push(z);
                });
            }
        }
        //逐个联动参数生成watch脚本
        inputLinkageParamList.forEach(function (x) {
            var script = linkageWatchScriptTemplate.replace(/<#LinkageParamName#>/g, x);
            var call = "";
            for (var i = 0; i < stage.length; i++) {
                if (stage[i].libarary&&stage[i].libarary.type == self.dataViewNodeType) {
                    call += linkageCallDataViewScriptTemplate.replace(/<#NodeId#>/g, self.getNodeSN(stage[i].paragraphId));
                } else if(stage[i].libarary&&stage[i].libarary.type=='combiner'){
                    call +=nameLinkageCallScriptTemplate.replace(/<#FlowId#>/g, flowId)
                        .replace(/<#RunNodeId#>/g, self.getNodeSN(stage[i].paragraphId));
                } else {
                    call += linkageCallNodeScriptTemplate.replace(/<#NodeId#>/g, self.getNodeSN(stage[i].paragraphId));
                }
            }
            result += script.replace(/<#LinkageCallNodeScript#>/g, call);
        });
    }
    return result;
};



//服务代码
this.code = code;


