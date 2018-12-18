const Utility = require('./Utility');
"use strict";
//常量定义

//变量定义
var _self = this;
var _initiated = false;

//全局函数定义
function init() {
    _initiated = true;
}

/**
 * 数据擦除"0"
 * @param String
 */
function dataNormalized(colStr) {
    if (colStr.match(/\r0/)) {
        colStr = colStr.replace(/\r0/g, '\r');
    }
    if (colStr.match(/\n0/)) {
        colStr = colStr.replace(/\n0/g, '\n');
    }
    if (colStr.match(/\t0/)) {
        colStr = colStr.replace(/\t0/g, '\t');
    }
    return colStr;
}

//类
/**
 * 数据表字段或联动参数的schema类，定义了schema的数据结构和序列化方法。
 * 属性name是列名（字符串）。属性index是该列在数据表中的序号（数值)，可能为空。
 * 属性datatype是列字段类型（字符串）。
 * @constructor
 */
function FieldSchema() {
    //成员定义
    this.name = undefined;
    this.index = undefined;
    this.datatype = undefined;

    //函数定义
    function load() {
    }

    /**
     * 序列化当前FieldSchema对象为文本。实例化调用
     * @returns {string} 字段名(字段类型)格式的文本
     */
    function toString() {
        return this.name + "(" + this.datatype + ")";
    }

    /**
     * 将FieldSchema文本转换成FieldSchema对象。静态方法调用。
     * @param fieldstr 字段名(字段类型)格式的文本
     * @returns {FieldSchema} FieldSchema对象
     */
    function parse(fieldstr) {
        //字段标题格式必须是：字段名(字段类型)，其中字段名和字段类型都可以包含成对的圆括号
        var result = new FieldSchema();
        if (!fieldstr) return result;
        var i = fieldstr.lastIndexOf(")");
        if (i > 0) {
            //从idx2位置向前查找(
            var level = 1;
            for (var j = i - 1; j > 0; j--) {
                if (fieldstr[j] == ')') {
                    level++;
                } else if (fieldstr[j] == '(') {
                    level--;
                    if (level == 0) {
                        //找到对应的(
                        result.name = fieldstr.substring(0, j);
                        result.datatype = fieldstr.substring(j + 1, i).toLowerCase();
                        break;
                    }
                }
            }
        } else {
            //没有右括号，说明类型缺失，则字段名为从头到第一个左括号的内容，类型为第一个左括号以后的内容
            var j = fieldstr.indexOf("(");
            if (j >= 0) {
                result.name = fieldstr.substring(0, j);
                result.datatype = fieldstr.substring(j).toLowerCase();
            } else {
                result.name = fieldstr;
            }
        }
        return result;
    }

    //原型方法
    if (FieldSchema.prototype.__initFieldSchema__ !== true) {
        FieldSchema.prototype.toString = toString;
        FieldSchema.prototype.parse = parse;
        FieldSchema.prototype.__initFieldSchema__ = true;
    }

    /**
     * 构造函数代码
     */
    var argn = arguments.length;
    if (argn == 1) {
        var sche = arguments[0];
        if (typeof(sche) == 'string') {
            //传递文本
            var s = parse(sche);
            this.name = s.name;
            this.index = undefined;
            this.datatype = s.datatype;
        } else if (sche.name && sche.datatype) {
            //传递另一个schema对象
            this.name = sche.name;
            this.index = undefined;
            this.datatype = sche.datatype;
        }
    } else if (argn == 2) {
        //直接传递name 和datatype
        this.name = arguments[0];
        this.index = undefined;
        this.datatype = arguments[1];
    } else if (argn == 3) {
        //直接传递name、index和datatype
        this.name = arguments[0];
        this.index = arguments[1];
        this.datatype = arguments[2];
    } else {
        this.name = "";
        this.index = undefined;
        this.datatype = "";
    }
}

/**
 * 数据表类型，定义了数据表名称、结构、内容和生存时间。
 * 属性name是数据表名称，属性schema是数据表结构，是包含FieldSchema对象的数组。
 * 属性table是数据表内容，行列的数组。属性living是数据表的创建时间。
 * @param tableStr 数据表消息文本
 * @constructor 数据表实例
 */
function DataTable(tableStr) {
    //成员定义
    this.name = undefined;
    this.schema = [];
    this.table = [];
    this.comment = undefined;
    this.living = new Date();
    this.nodePath="";
    this.truncated=false;

    //函数定义
    function load(instance, msg) {
        if (!msg || msg.length == 0) return;
        var textRows = msg.split('\n');
        instance.comment = '';
        var comment = false;

        //提取数据表schema
        var fieldCols = textRows[0].split('\t');
        for (var j = 0; j < fieldCols.length; j++) {
            var sche = new FieldSchema(fieldCols[j]);
            sche.index = j;
            instance.schema.push(sche);
        }
        //提取数据表内容和数据表名
        for (var i = 1; i < textRows.length; i++) {
            var textRow = textRows[i];
            if (comment) {
                //从comment中提取数据表名
                var tname = textRow.match(/<font color=blue>(.+)<\/font>/);
                if (tname && tname.length > 1) {
                    tname = tname[1];
                    if (tname.length > 0) {
                        instance.name = tname;
                    }
                } else {
                    instance.comment += textRow;
                }
                //从comment中提取数据的节点来源
                var tname = textRow.match(/<font color=white>(.+)<\/font>/);
                if (tname && tname.length > 1) {
                    tname = tname[1];
                    if (tname.length > 0) {
                        instance.nodePath = tname;
                    }
                } else {
                    instance.comment += textRow;
                }
                continue;
            }

            if (textRow === '' || textRow.replace(/^\x20\x20*/, '').replace(/\x20\x20*$/, '') === '') {
                //如果是全空格行，则认为数据表结束
                comment = true;
                continue;
            }
            //由于引擎返回的数据格式不规范，<font color=blue>之前应有一个空行，表示数据结束。故每一行都需要判断数据是否结束。
            var tname = textRow.match(/<font color=red>(.+)<\/font>/);
            if (tname && tname.length > 1) {
                comment = true;
                continue;
            }

            var textCols = textRow.split('\t');
            var colscount=textCols.length<instance.schema.length?textCols.length:instance.schema.length;
            var cols = [];
            for (var j = 0; j < colscount; j++) {
                var colstr = textCols[j];
                //原计划提供3种基本数据类型，现暂定只提供String类型，不做类型转换
                if (true) {
                    var coltype = instance.schema[j].datatype.toLowerCase();
                    if (coltype == "date" || coltype == "time" || coltype == "timestamp") {
                        cols.push(new Date(colstr.replace(/-/g, "/")));
                    } else if (coltype == "int" || coltype == "integer" || coltype == "long" || coltype == "float" || coltype == "double" || coltype.indexOf("number") == 0 || coltype.indexOf("decimal") == 0) {
                        var colnum = Number(colstr);
                        if (!isNaN(colnum)) {
                            cols.push(colnum);
                        }
                    } else {
                        cols.push(colstr);
                    }
                } else {
                    cols.push(colstr);
                }
            }
            instance.table.push(cols);
        }
        instance.living = new Date();
        return instance;
    }

    /**
     * 采用0插入法解析数据表
     * @param instance
     * @param msg
     */
    function load2(instance, msg) {
        //同一个数据表内，行分隔符为“\n\n”，列分隔符为“\t\t”。
        //数据表起始符为“\r\r”（原版本为“%table ”），数据表截止符为“\n\n\n\n”（原版本为“\n”）。
        //数据表名用“<font color=blue>”和“</font>”文本进行包裹。
        if (!msg || msg.length == 0) return;
        var textRows = msg.split('\n\n');
        instance.comment = '';
        var comment = false;

        //提取数据表schema
        var fieldCols = textRows[0].split('\t\t');
        for (var j = 0; j < fieldCols.length; j++) {
            var newFieldCol = dataNormalized(fieldCols[j]);
            var sche = new FieldSchema(newFieldCol);
            sche.index = j;
            instance.schema.push(sche);
        }
        //提取数据表内容和数据表名
        for (var i = 1; i < textRows.length; i++) {
            var textRow = textRows[i];
            if (comment) {
                //从comment中提取数据表名和数据的节点来源
                if(!instance.name||!instance.nodePath) {
                    var tname = textRow.match(/<font color=blue>(.+)<\/font><font color=white>(.+)<\/font>/);
                    if (tname && tname.length > 2) {
                        if (tname[1].length > 0) {
                            instance.name = dataNormalized(tname[1]);
                        }
                        if (tname[2].length > 0) {
                            instance.nodePath = tname[2];
                        }
                        continue;
                    }
                }
                //textRow = dataNormalized(textRow);
                instance.comment += textRow;
                continue;
            }

            if (textRow === '' || textRow.replace(/^\x20\x20*/, '').replace(/\x20\x20*$/, '') === '') {
                //如果是全空格行，则认为数据表结束
                comment = true;
                continue;
            }
            //由于引擎返回的数据格式不规范，<font color=blue>之前应有一个空行，表示数据结束。故每一行都需要判断数据是否结束。
            var tname = textRow.match(/<font color=red>(.+)<\/font>/);
            if (tname && tname.length > 1) {
                comment = true;
                continue;
            }

            var textCols = textRow.split('\t\t');
            var colscount=textCols.length<instance.schema.length?textCols.length:instance.schema.length;
            var cols = [];
            for (var j = 0; j < colscount; j++) {
                var colstr = textCols[j];
                colstr = dataNormalized(colstr);
                //原计划提供3种基本数据类型，现暂定只提供String类型，不做类型转换
                if (true) {
                    var coltype = instance.schema[j].datatype.toLowerCase();
                    if (coltype == "date" || coltype == "time" || coltype == "timestamp") {
                        cols.push(new Date(colstr.replace(/-/g, "/")));
                    } else if (coltype == "int" || coltype == "integer" || coltype == "long" || coltype == "float" || coltype == "double" || coltype.indexOf("number") == 0 || coltype.indexOf("decimal") == 0) {
                        var colnum = Number(colstr);
                        if (!isNaN(colnum)) {
                            cols.push(colnum);
                        }else{
                            cols.push(null);
                        }
                    } else {
                        cols.push(colstr);
                    }
                } else {
                    cols.push(colstr);
                }
            }
            instance.table.push(cols);
        }
        instance.living = new Date();
        return instance;
    }

    function load3(instance, msg) {
        //同一个数据表内，行分隔符为“\r\r”，列分隔符为“\t\t”。
        //数据表名用“<font color=blue>”和“</font>”文本进行包裹。且第一行一定是表名
        if (!msg || msg.length == 0) return;
        var textRows = msg.split('\r\r');
        instance.comment = '';
        if(!textRows||textRows.length<2) return instance;
        var comment = false;

        //提取数据表名
        var textRow = textRows[0];
        var tname = textRow.match(/<font color=blue>(.+)<\/font><font color=white>(.+)<\/font>/);
        if (tname && tname.length > 2) {
            if (tname[1].length > 0) {
                instance.name = dataNormalized(tname[1]);
            }
            if (tname[2].length > 0) {
                instance.nodePath = tname[2];
            }
        }
        //提取数据表schema
        var fieldCols = textRows[1].split('\t\t');
        for (var j = 0; j < fieldCols.length; j++) {
            var newFieldCol = dataNormalized(fieldCols[j]);
            var sche = new FieldSchema(newFieldCol);
            sche.index = j;
            instance.schema.push(sche);
        }
        //提取数据表内容
        for (var i = 2; i < textRows.length; i++) {
            textRow = textRows[i];
            //判断是否表结束
            if (i == textRows.length - 1) {
                //最后一行末尾可能会带上一个\n，需要前端特别的去掉
                if (Utility.stringEndWith(textRow, '\n')) {
                    textRow = textRow.substr(0, textRow.length - 1);
                }
                //如果数据行数超限则需要标识。
                var tname = textRow.match(/<font color=red>Results are limited by(.+)<\/font>/);
                if (tname && tname.length > 1) {
                    instance.truncated = true;
                    break;
                }
                var tname = textRow.match(/Output exceeds (\d+)\. Truncated\./);
                if (tname && tname.length > 1) {
                    instance.truncated = true;
                    break;
                }
            }
            //提取行内容
            var textCols = textRow.split('\t\t');
            var colscount=textCols.length<instance.schema.length?textCols.length:instance.schema.length;
            var cols = [];
            for (var j = 0; j < colscount; j++) {
                var colstr = textCols[j];
                colstr = dataNormalized(colstr);
                //原计划提供3种基本数据类型，现暂定只提供String类型，不做类型转换
                if (true) {
                    var coltype = instance.schema[j].datatype.toLowerCase();
                    if (coltype == "date" || coltype == "time" || coltype == "timestamp") {
                        cols.push(new Date(colstr.replace(/-/g, "/")));
                    } else if (coltype == "int" || coltype == "integer" || coltype == "long" || coltype == "float" || coltype == "double" || coltype.indexOf("number") == 0 || coltype.indexOf("decimal") == 0) {
                        var colnum = Number(colstr);
                        if (!isNaN(colnum)) {
                            cols.push(colnum);
                        }else{
                            cols.push(null);
                        }
                    } else {
                        cols.push(colstr);
                    }
                } else {
                    cols.push(colstr);
                }
            }
            instance.table.push(cols);
        }
        instance.living = new Date();
        return instance;
    }

    //原型方法
    if (DataTable.prototype.__initDataTable__ !== true) {
        DataTable.prototype.__initDataTable__ = true;
    }

    //初始化及构造函数内容
    load3(this, tableStr);
}

/**
 * 数据集类型，数据表的集合和数量。
 * 属性length是数据集中数据表的数量。
 * 数据表的名称作为属性名，数据表对象作为相应的属性值。
 * @param msgStr 数据集消息文本
 * @constructor 数据集实例
 */
function DataSet(msgStr) {
    //成员定义
    this.length = 0;
    this.msg = "";

    //函数定义
    function load(instance, msg) {
        //分析数据表内容，数据表之间会以"\r\n"和"%table "分隔
        var raws = msg.split(/(\r\n|%table )/g);
        for (var i = raws.length - 1; i >= 0; i--) {
            if (raws[i] == "\r\n" || raws[i] == "%table " || raws[i] == "") {
                raws.splice(i, 1);
            }
        }
        for (var i = 0; i < raws.length; i++) {
            var table = new DataTable(raws[i]);
            if (table.name && table.name.length > 0) {
                //判断是否已经包含了同名表
                if(instance[table.name]){
                    if(!instance["__NODE__"]){
                        instance["__NODE__"]={};
                    }
                    if(!instance["__NODE__"][table.nodePath]){
                        instance["__NODE__"][table.nodePath]={};
                    }
                    instance["__NODE__"][table.nodePath][table.name]=table;
                    instance.length+=1;
                }else {
                    instance[table.name] = table;
                    instance.length += 1;
                }
            } else if (table.table && table.table.length > 0) {
                instance["unnamedTable_" + Utility.timeUuid()] = table;
                instance.length += 1;
            }
        }
    }

    /**
     * 采用0插入法解析数据集
     * @param instance
     * @param msg
     */
    function load2(instance, msg) {
        //同一个数据表内，行分隔符为“\n\n”，列分隔符为“\t\t”。
        //数据表起始符为“\r\r”（原版本为“%table ”），数据表截止符为“\n\n\n\n”（原版本为“\n”）。
        //数据表名用“<font color=blue>”和“</font>”文本进行包裹。
        var raws = msg.split("\r\r");
        // for (var i = raws.length - 1; i >= 0; i--) {
        //     if (raws[i] == "\r\n" || raws[i] == "%table " || raws[i] == "") {
        //         raws.splice(i, 1);
        //     }
        // }
        for (var i = 0; i < raws.length; i++) {
            if (raws[i] === "") {
                continue;
            }
            var table = new DataTable(raws[i]);
            if (table.name && table.name.length > 0) {
                //判断是否已经包含了同名表
                instance[table.name] = table;
                instance.msg+=table.comment;
                instance.length += 1;
            } else if (table.table && table.table.length > 0) {
                instance["unnamedTable_" + Utility.timeUuid()] = table;
                instance.length += 1;
            }
        }
    }

    function gc(maxLiving) {
        if (maxLiving <= 0) return;
        for (var name in this) {
            if (name != "length") {
                var table = this[name];
                if (table instanceof DataTable) {
                    if (table.living.getTime() + maxLiving < (new Date()).getTime()) {
                        delete this[name];
                        this.length = (this.length <= 1) ? 0 : (this.length - 1);
                    }
                }
            }
        }
    }

    //原型方法
    if (DataSet.prototype.__initDataSet__ !== true) {
        DataSet.prototype.gc = gc;
        DataSet.prototype.__initDataSet__ = true;
    }

    //初始化构造函数内容
    if (msgStr) {
        if (msgStr.length >= 0) {
            //NOTE或PARAGRAPH消息获得的results对象
            for (var i = 0; i < msgStr.length; i++) {
                var msg = msgStr[i];
                if (msg.type === "TABLE") {
                    load2(this, msg.data);
                } else if (msg.type === "TEXT") {
                    //this.msg += msg.data + "\n";
                    load2(this,msg.data);
                }
            }
        } else if (typeof(msgStr) == "string") {
            //ANGULAR_OBJECT_UPDATE消息获得的RDD文本
            load2(this, msgStr);
        }
    }
}

/**
 * 数据集类型，数据表的集合和数量。
 * 属性length是数据集中数据表的数量。
 * 数据表的名称作为属性名，数据表对象作为相应的属性值。
 * @param msgStr 数据集消息文本
 * @constructor 数据集实例
 */
function DataSetMap(msgStr) {
    //成员定义
    this.msg="";

    //函数定义
    function load(instance, msg) {
        //分析数据表内容，数据表之间会以"\r\n"和"%table "分隔
        var raws = msg.split(/(\r\n|%table )/g);
        for (var i = raws.length - 1; i >= 0; i--) {
            if (raws[i] == "\r\n" || raws[i] == "%table " || raws[i] == "") {
                raws.splice(i, 1);
            }
        }
        for (var i = 0; i < raws.length; i++) {
            var table = new DataTable(raws[i]);
            if (table.name && table.name.length > 0) {
                //判断是否已经包含了同名表
                if(instance[table.name]){
                    if(!instance["__NODE__"]){
                        instance["__NODE__"]={};
                    }
                    if(!instance["__NODE__"][table.nodePath]){
                        instance["__NODE__"][table.nodePath]={};
                    }
                    instance["__NODE__"][table.nodePath][table.name]=table;
                    instance.length+=1;
                }else {
                    instance[table.name] = table;
                    instance.length += 1;
                }
            } else if (table.table && table.table.length > 0) {
                instance["unnamedTable_" + Utility.timeUuid()] = table;
                instance.length += 1;
            }
        }
    }

    /**
     * 采用0插入法解析数据集
     * @param instance
     * @param msg
     */
    function load2(instance, msg) {
        //同一个数据表内，行分隔符为“\n\n”，列分隔符为“\t\t”。
        //数据表起始符为“\r\r”（原版本为“%table ”），数据表截止符为“\n\n\n\n”（原版本为“\n”）。
        //数据表名用“<font color=blue>”和“</font>”文本进行包裹。
        var raws = msg.split("\r\r");
        for (var i = 0; i < raws.length; i++) {
            if (raws[i] === "") {
                continue;
            }
            var table = new DataTable(raws[i]);
            if (table.nodePath && table.nodePath.length > 0) {
                //判断是否已经包含了同节点表
                var dataset = instance[table.nodePath];
                if (!dataset) {
                    dataset = new DataSet();
                    instance[table.nodePath] = dataset;
                }
                if (table.name && table.name.length > 0) {
                    dataset[table.name] = table;
                    dataset.length += 1;
                    instance.msg+=table.comment;
                }
                //针对v0.8.2引擎开始，未获取到数据表名的内容，被认为是消息文本，而不是数据表
                //以下代码逻辑不再使用
                // else if (table.table && table.table.length > 0) {
                //     dataset["unnamedTable_" + Utility.timeUuid()] = table;
                //     dataset.length += 1;
                // }
            }
            if(!table.nodePath||!table.name){
                //无表名，说明该段是消息文本
                instance.msg+=raws[i];
            }
        }
    }

    function load3(instance, msg) {
        //一个msg对象中仅包含一个表
        var table = new DataTable(msg);
        if (table.nodePath && table.nodePath.length > 0) {
            //判断是否已经包含了同节点表
            var dataset = instance[table.nodePath];
            if (!dataset) {
                dataset = new DataSet();
                instance[table.nodePath] = dataset;
            }
            if (table.name && table.name.length > 0) {
                if(!dataset[table.name]){
                    dataset.length += 1;
                }
                dataset[table.name] = table;
                if(table.comment) {
                    instance.msg += table.comment;
                }
            }
        }
        if (!table.nodePath || !table.name) {
            //无表名，说明该段是消息文本
            instance.msg += msg;
        }
    }

    function gc(maxLiving) {
        if (maxLiving <= 0) return;
        for (var name in this) {
            if (name != "length") {
                var table = this[name];
                if (table instanceof DataTable) {
                    if (table.living.getTime() + maxLiving < (new Date()).getTime()) {
                        delete this[name];
                        this.length = (this.length <= 1) ? 0 : (this.length - 1);
                    }
                }
            }
        }
    }

    //原型方法
    if (DataSetMap.prototype.__initDataSetMap__ !== true) {
        DataSetMap.prototype.gc = gc;
        DataSetMap.prototype.__initDataSetMap__ = true;
    }

    //初始化构造函数内容
    if (msgStr) {
        if (typeof(msgStr) == "string") {
            //ANGULAR_OBJECT_UPDATE消息获得的RDD文本
            load2(this, msgStr);
        }else if (msgStr.length >= 0) {
            //NOTE或PARAGRAPH消息获得的results对象
            for (var i = 0; i < msgStr.length; i++) {
                var msg = msgStr[i];
                if (msg.type === "TABLE") {
                    load3(this, msg.data);
                } else if (msg.type === "TEXT") {
                    this.msg += msg.data + "\n";
                    //load2(this, msg.data);
                }
            }
        }
        //消除多余空行
        this.msg=this.msg.replace(/\n{2,}/g,'\n');
    }
}


//服务代码
this.FieldSchema = FieldSchema;
this.DataTable = DataTable;
this.DataSet = DataSet;
this.DataSetMap=DataSetMap;

init();
module.exports =this;