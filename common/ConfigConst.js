module.exports={

    /**
     * 请大家在修改此文件时，务必按照以下要求规范书写：
     * 每个对象之前必须添加该对象的说明和增加/修改者姓名。
     * 如果对象包含子对象，则子对象也应该添加说明。例如：
     * //后台站点的IP地址。增加：张三。
     * //该地址修改为后台服务A的IP地址。修改：李四，2016/12/12。
     * serverAIp: 1.1.1.1
     */

    // 前端平台版本号。增加：齐咏杰
    Version:"1.0",
    //基础框架的基本配置常量。增加：齐工，2017/2/16
    Framework:{
        RestUrl:"/api/rest/:action",   // REST URL
        UploadUrl:"/",          // 上传文件服务URL
        DownloadUrl:"/",        // 下载已上传文件URL
        AuthorityUrl:"/auth/",         // 统一权限管理URL
        HdfsUrlPrefix:"hdfs://master.zzjz.com:8020",   //默认的HDFS路径前缀
        RestAction:{
            GetComList:"queryComponentList.rest",//检索算子库
            GetComTemplate:"queryComponentTemplate.rest",//根据算子ID获取算子模板
            GetComByVersion:"queryComponentByVersion.rest",//根据序列号、版本号获取算子
            GetComById:"queryComponentById.rest",//根据序列号、版本号获取算子
            GetComBySn:"queryComponentBySN.rest",//根据序列号各版本算子
            SaveCom:"saveComponent.rest",//保存算子基本信息
            SaveComTemplate:"saveComponentTemplate.rest",//保存算子模板
            DeleteCom:"deleteComponent.rest",//保存算子模板
            UploadFile:"uploadFile.rest",//上传文件
            UploadFiles:"uploadFiles.rest",//上传jar文件
            ListFile:"listFile.rest",//列表已上传文件
            ListDirectory:"listDirectory.rest",//列表目录
            deleteFile:"deleteFile.rest",//删除已上传文件
            GetFlowById:"queryWorkflowById.rest",//根据分析流ID获取分析流
            SaveFlow:"saveOrUpdateWorkflow.rest",//根据分析流ID保存分析流
            DeleteFlow:"deleteWorkflowById.rest",//根据分析流ID删除分析流
            GetFlowList:"queryWorkflowList.rest",//获取所有分析流
            ExecuteFlowById:"execWorkflowById.rest",//根据分析流ID执行分析流
            queryFilePage:"queryFileList.rest",//查询文件列表  param{destination,directory,search, sort}
            delFile:"delFile.rest",//删除文件
            queryDirectory:"queryDirectory.rest",//查询目录
            listCase:"listCase.rest",//获取图元列表
            getMark:"getMark.rest",
            updateCase:"updateCase.rest",//新增或者编辑图元
            deleteCase:"deleteCase.rest",//删除图元
            copyFile:"copyFile.rest",//复制文件
            addCom:"saveComponentLib.rest",
            moveComponentLib:"moveComponentLib.rest",
            saveComponentRelation:"saveComponentRelation.rest",
            getCom:"queryComponentLibByDir.rest",
            DeleteComStor:"delComponentLib.rest",
            queryNoLib:"queryComponentNotInLib.rest",
            queryComList:"queryComponentByLib.rest",
            //app 发布接口
            saveAppFlow :"saveAppFlow.rest",
            getAppByFlow :"getAppByFlow.rest",
            getAuthorizedAppFlow :"getAuthorizedAppFlow.rest",
            deleteAppFlow :"deleteAppFlow.rest",
            //app参数系统接口
            getAppArgsList:"getAppArgsList.rest",
            saveAppArgs:"saveAppArgs.rest",
            deleteAppArgs:"deleteAppArgs.rest",
            //目录接口
            getDirectory:"getDirectory.rest",//查询目录
            queryDirectoryByType:"queryDirectoryByType.rest",//根据type查询目录
            saveDirectory:"saveDirectory.rest",//保存目录
            deleteDirectory:"deleteDirectory.rest",//删除目录
            queryComponentLibByDirPage:"queryComponentLibByDirPage.rest",
            queryComponentByLibPage:"queryComponentByLibPage.rest",
            //目录关系接口
            queryCategorizeByTypeSource:"queryCategorizeByTypeSource.rest",
            queryCategorizeByTypeDestination:"queryCategorizeByTypeDestination.rest",
            addCategorize:"addCategorize.rest",
            updateCategorize:"updateCategorize.rest",
            deleteCategorize:"deleteCategorize.rest",
            queryComponentByDir:"queryComponentByDir.rest",
            queryDirectorysHierarchyName:"queryDirectorysHierarchyName.rest", //根据类型查询 目录名称上下级关系
            GetComByDir:"queryComponentByDir.rest",      //检索某个目录下的算子
            downloadExcel:"downloadExcel.rest", //导出excel算子
            exportworkFlow:"exportworkFlow.rest",//导出分析流
            analysisExcel:"analysisExcel.rest",  //导入算子excel
            analysisWorkFlowExcel:"analysisWorkFlowExcel.rest",//导入分析流
            exportApp:"exportApps.rest",//导出App
            analysisAppExcel:"analysisAppFlows.rest",  //导入App
            updateCompontAuth:"updateCompontAuth.rest",
            //SGK:保存视图模板 saveViewsTemplate
            queryViewsTpl: "queryViewsTemplates.rest",
            queryViewsTplById: "queryViewsTemplatesById.rest",
            deleteViewsTpl: "deleteViewsTemplates.rest",
            saveViewsTpl: "saveViewsTemplates.rest",
            updateViewsTpl: "updateViewsTemplates.rest",
            //添加用户资源
            saveUserResource:"saveUserResource.rest",
            //编辑用户资源
            updateUserResource:"updateUserResource.rest",
            //查询用户资源列表
            getUserResourceList:"queryResourceListByUserId.rest",
            //删除用户资源
            deleteUserResource:"deleteUserResource.rest",
            //通过id查询资源详情
            getUserResourceByParam:"getUserResourceByParam.rest",
            //通过param新增通用算子库详情
            saveCommonUseByParam:"saveCommonUseByParam.rest",
            //通过param查询通用算子库详情
            getUserCommonUseByParam:"getUserCommonUseByParam.rest",
            //通过param删除通用算子库详情
            deleteCommonUseByParam:"deleteCommonUseByParam.rest",
            //通过param修改通用算子库详情
            updateCommonUseByParam:"updateCommonUseByParam.rest",
            //通过算子库Id查找算子列表详情
            queryComponentByLib:"queryComponentByLib.rest",
            //拖动算子或者双击分析流查找算子或者分析流详情
            queryCommeVoByParam:"queryCommeVoByParam.rest",
            //右侧手风琴查询
            queryComponentALLByName:"queryComponentALLByName.rest",
            //通过算子库查询简略算子列表
            queryComponentByLibId:"queryComponentByLibId.rest",
            //批量删除算子库下的算子
            delComponentLibRelation:"delComponentLibRelation.rest",
            //算子克隆
            cloneComponent:"cloneComponent.rest",
            queryComponentNotDelete:"queryComponentNotDelete.rest",
            queryFileListPage:"queryFileListPage.rest",
            coverWorkflow:"coverWorkflow.rest",
            coverAppFlows:"coverAppFlows.rest",
            coverComponent:"coverComponent.rest",
            deleteUnZipFile:"deleteUnZipFile.rest",
            checkJarsVersion:"checkJarsVersion.rest",
            //上传jar文件   jar列表接口
            queryReation:"queryReation.rest",
            //hdfs上传接口
            hdfsUpload:"chunkUpload.rest",
            //hdfs握手接口
            hdfsUploadHandshake:"getChunkByMd5.rest",
            //delReation.rest 删除jar 参数fileId
            delReation:"delReation.rest",
            checkReation:"checkReation.rest",
            //renameJar.rest 重命名 参数fileId oldname newName
            renameJar:"renameJar.rest",
            //getStages
            getStages:"getStages.rest",
            //同步文件
            updateFile:"updateFile.rest",
            //getApplications.rest
            getApplications:"getApplications.rest",
            //getJobsByWorkflow.rest
            getJobsByWorkflow:"getJobsByWorkflow.rest",
            //getJobs.rest
            getJobs:"getJobs.rest",
            //getAttempt.rest
            getAttempt:"getAttempt.rest",
            //指定应用执行器  spark/getExecutors.rest
            getExecutors:"getExecutors.rest",
            //指定stage对应task信息 spark/getTaskSummary.rest
            getTaskSummary:"getTaskSummary.rest",
            //指定stage对应task列表 spark/getTasks.rest
            getTasks:"getTasks.rest",
            //获取算子所有的svn版本号 getAllVersions.rest
            getAllVersions:"getAllVersions.rest",
            //获取算子所有的svn版本号  getContentAtVersion.rest
            getContentAtVersion: "getContentAtVersion.rest",
            //新文件管理模块,文件目录查询
            queryDir:"queryDir.rest",
            saveDir:"saveDir.rest",
            //获取分析流锁
            getWorkflowLock:"getWorkflowLock.rest",
            //分析流解锁
            workflowLock:"workflowLock.rest",
            /*********************统一权限Url add tanglvshuang 2018.1.25*******************/
            getPermission:"tyqxgl/rest/deepInsight/{type}/{userId}/getPermission",//{tyope}为（分析流：fxl  算子：sz  算子库：szk）,
            deleteDir:"deleteDir.rest"
        },
        Upload:{
            Destination_Web:"web",// 上传到Web，前端浏览器可以下载该文件
            Destination_HDFS:"hdfs",// 上传到HDFS，集群应用可以访问该文件
            Destination_Engine:"engine",// 上传到ZZJZ引擎，引擎可以加载该JAR包
            SubDirectory_WebTemplate:"template",//上传到Web的模板文件的根目录
            SubDirectory_WebImage:"icon",//上传到Web的图片文件的根目录
            SubDirectory_WebOther:"other",//上传到Web的其他文件的根目录
            HDFS_Url:"hdfs://master.zzjz.com:8020",//集群HDFS根地址
            //平台预先提供的网页小图标列表
            PreUpload_WebSmallIconList:[
                {text:"basictocomposite_16x16.png",value:"/app/resource/icon/basictocomposite_16x16.png"},
                {text:"call_clean_16x16.png",value:"/app/resource/icon/call_clean_16x16.png"},
                {text:"call_relationship_16x16.png",value:"/app/resource/icon/call_relationship_16x16.png"},
                {text:"connected_graph_16x16.png",value:"/app/resource/icon/connected_graph_16x16.png"},
                {text:"data_merge_16x16.png",value:"/app/resource/icon/data_merge_16x16.png"},
                {text:"data_modeling_16x16.png",value:"/app/resource/icon/data_modeling_16x16.png"},
                {text:"data_reconstruction_16x16.png",value:"/app/resource/icon/data_reconstruction_16x16.png"},
                {text:"database_16x16.png",value:"/app/resource/icon/database_16x16.png"},
                {text:"excel_16x16.png",value:"/app/resource/icon/excel_16x16.png"},
                {text:"get_trajectoryt_16x16.png",value:"/app/resource/icon/get_trajectoryt_16x16.png"},
                {text:"graphics_extracting_16x16.png",value:"/app/resource/icon/graphics_extracting_16x16.png"},
                {text:"grouping_statistics_16x16.png",value:"/app/resource/icon/grouping_statistics_16x16.png"},
                {text:"gt_16x16.png",value:"/app/resource/icon/gt_16x16.png"},
                {text:"gt_accompany_16x16.png",value:"/app/resource/icon/gt_accompany_16x16.png"},
                {text:"gt_create_16x16.png",value:"/app/resource/icon/gt_create_16x16.png"},
                {text:"hdfs_database_16x16.png",value:"/app/resource/icon/hdfs_database_16x16.png"},
                {text:"intermediate_bond_16x16.png",value:"/app/resource/icon/intermediate_bond_16x16.png"},
                {text:"line_chart_16x16.png",value:"/app/resource/icon/line_chart_16x16.png"},
                {text:"matching_point_16x16.png",value:"/app/resource/icon/matching_point_16x16.png"},
                {text:"matching_type_16x16.png",value:"/app/resource/icon/matching_type_16x16.png"},
                {text:"merge_16x16.png",value:"/app/resource/icon/merge_16x16.png"},
                {text:"missing_value_16x16.png",value:"/app/resource/icon/missing_value_16x16.png"},
                {text:"network_analysis_16x16.png",value:"/app/resource/icon/network_analysis_16x16.png"},
                {text:"notrajectoryt_type_16x16.png",value:"/app/resource/icon/notrajectoryt_type_16x16.png"},
                {text:"point_strong_weak_16x16.png",value:"/app/resource/icon/point_strong_weak_16x16.png"},
                {text:"random_number_16x16.png",value:"/app/resource/icon/random_number_16x16.png"},
                {text:"ranks_16x16.png",value:"/app/resource/icon/ranks_16x16.png"},
                {text:"recode_16x16.png",value:"/app/resource/icon/recode_16x16.png"},
                {text:"record_selection_16x16.png",value:"/app/resource/icon/record_selection_16x16.png"},
                {text:"record_sorting_16x16.png",value:"/app/resource/icon/record_sorting_16x16.png"},
                {text:"relation_difference_16x16.png",value:"/app/resource/icon/relation_difference_16x16.png"},
                {text:"relational_database_16x16.png",value:"/app/resource/icon/relational_database_16x16.png"},
                {text:"relationship_weights_16x16.png",value:"/app/resource/icon/relationship_weights_16x16.png"},
                {text:"scala_component_16x16.png",value:"/app/resource/icon/scala_component_16x16.png"},
                {text:"sql_component_16x16.png",value:"/app/resource/icon/sql_component_16x16.png"},
                {text:"text_document_16x16.png",value:"/app/resource/icon/text_document_16x16.png"},
                {text:"three_line_merge_16x16.png",value:"/app/resource/icon/three_line_merge_16x16.png"},
                {text:"trajectory_str2df_16x16.png",value:"/app/resource/icon/trajectory_str2df_16x16.png"},
                {text:"trajectoryt_type_16x16.png",value:"/app/resource/icon/trajectoryt_type_16x16.png"},
                {text:"two_line_merge_16x16.png",value:"/app/resource/icon/two_line_merge_16x16.png"},
                {text:"variable_calculate_16x16.png",value:"/app/resource/icon/variable_calculate_16x16.png"},
                {text:"view_left__mid_right_16x16.png",value:"/app/resource/icon/view_left__mid_right_16x16.png"},
                {text:"view_one_16x16.png",value:"/app/resource/icon/view_one_16x16.png"},
                {text:"view_up_down_16x16.png",value:"/app/resource/icon/view_up_down_16x16.png"}
            ],
            //平台预先提供的网页大图标列表
            PreUpload_WebBigIconList:[
                {text:"basictocomposite_64x64.png",value:"/app/resource/icon/basictocomposite_64x64.png"},
                {text:"call_clean_64x64.png",value:"/app/resource/icon/call_clean_64x64.png"},
                {text:"call_relationship_64x64.png",value:"/app/resource/icon/call_relationship_64x64.png"},
                {text:"connected_graph_64x64.png",value:"/app/resource/icon/connected_graph_64x64.png"},
                {text:"data_merge_64x64.png",value:"/app/resource/icon/data_merge_64x64.png"},
                {text:"data_modeling_64x64.png",value:"/app/resource/icon/data_modeling_64x64.png"},
                {text:"data_reconstruction_64x64.png",value:"/app/resource/icon/data_reconstruction_64x64.png"},
                {text:"database_64x64.png",value:"/app/resource/icon/database_64x64.png"},
                {text:"excel_64x64.png",value:"/app/resource/icon/excel_64x64.png"},
                {text:"get_trajectoryt_64x64.png",value:"/app/resource/icon/get_trajectoryt_64x64.png"},
                {text:"graphics_extracting_64x64.png",value:"/app/resource/icon/graphics_extracting_64x64.png"},
                {text:"grouping_statistics_64x64.png",value:"/app/resource/icon/grouping_statistics_64x64.png"},
                {text:"gt_64x64.png",value:"/app/resource/icon/gt_64x64.png"},
                {text:"gt_accompany_64x64.png",value:"/app/resource/icon/gt_accompany_64x64.png"},
                {text:"gt_create_64x64.png",value:"/app/resource/icon/gt_create_64x64.png"},
                {text:"hdfs_database_64x64.png",value:"/app/resource/icon/hdfs_database_64x64.png"},
                {text:"intermediate_bond_64x64.png",value:"/app/resource/icon/intermediate_bond_64x64.png"},
                {text:"line_chart_64x64.png",value:"/app/resource/icon/line_chart_64x64.png"},
                {text:"matching_point_64x64.png",value:"/app/resource/icon/matching_point_64x64.png"},
                {text:"matching_type_64x64.png",value:"/app/resource/icon/matching_type_64x64.png"},
                {text:"merge_64x64.png",value:"/app/resource/icon/merge_64x64.png"},
                {text:"missing_value_64x64.png",value:"/app/resource/icon/missing_value_64x64.png"},
                {text:"network_analysis_64x64.png",value:"/app/resource/icon/network_analysis_64x64.png"},
                {text:"notrajectoryt_type_64x64.png",value:"/app/resource/icon/notrajectoryt_type_64x64.png"},
                {text:"point_strong_weak_64x64.png",value:"/app/resource/icon/point_strong_weak_64x64.png"},
                {text:"random_number_64x64.png",value:"/app/resource/icon/random_number_64x64.png"},
                {text:"ranks_64x64.png",value:"/app/resource/icon/ranks_64x64.png"},
                {text:"recode_64x64.png",value:"/app/resource/icon/recode_64x64.png"},
                {text:"record_selection_64x64.png",value:"/app/resource/icon/record_selection_64x64.png"},
                {text:"record_sorting_64x64.png",value:"/app/resource/icon/record_sorting_64x64.png"},
                {text:"relation_difference_64x64.png",value:"/app/resource/icon/relation_difference_64x64.png"},
                {text:"relational_database_64x64.png",value:"/app/resource/icon/relational_database_64x64.png"},
                {text:"relationship_weights_64x64.png",value:"/app/resource/icon/relationship_weights_64x64.png"},
                {text:"scala_component_64x64.png",value:"/app/resource/icon/scala_component_64x64.png"},
                {text:"sql_component_64x64.png",value:"/app/resource/icon/sql_component_64x64.png"},
                {text:"text_document_64x64.png",value:"/app/resource/icon/text_document_64x64.png"},
                {text:"three_line_merge_64x64.png",value:"/app/resource/icon/three_line_merge_64x64.png"},
                {text:"trajectory_str2df_64x64.png",value:"/app/resource/icon/trajectory_str2df_64x64.png"},
                {text:"trajectoryt_type_64x64.png",value:"/app/resource/icon/trajectoryt_type_64x64.png"},
                {text:"two_line_merge_64x64.png",value:"/app/resource/icon/two_line_merge_64x64.png"},
                {text:"variable_calculate_64x64.png",value:"/app/resource/icon/variable_calculate_64x64.png"},
                {text:"view_left__mid_right_64x64.png",value:"/app/resource/icon/view_left__mid_right_64x64.png"},
                {text:"view_up_down_64x64.png",value:"/app/resource/icon/view_up_down_64x64.png"},
                {text:"view_one_64x64.png",value:"/app/resource/icon/view_one_64x64.png"}
            ],
            //平台预先提供的模板列表
            PreUpload_WebTemplateList:[
                {text:"文本数据源参数设置",value:"/app/module/home/worktable/paramsetting/json.data.html"}
            ],
            //目录及分类类型对照表
            Categorize_Map:{ "web":1, "hdfs":2, "engine":4, "component":8, "flow":16, "app":32 },
            enginePathId:'3f279064ca584e57a8ff73cad895c96d',
            templatePathId:'9ded18f1c80543f5a40493180b976648',
            iconPathId:'f447eb02742644158c2df612836a1c18',
            otherPathId:'2985867698704ccabd724f88b4db2b49'
        }
    },
    //算子参数模型的基本配置常量。增加：齐工，2016/11/20
    ComModel:{
        Key_Name:"name",
        Key_Title:"title",
        Key_Default:"default",
        Key_Type:"type",
        Key_Element:"element",
        Key_Group:"group",
        Key_require:"require",
        Key_ParamSetting_Diagram:"__diagram__",
        Type_Normal:"normal",
        Type_Rdd:"rdd",
        Type_Bind:"rddField",
        Type_Script:"script",
        Type_View_Axis:"axis",
        Type_View_Layout:"layout",
        Type_Dag:"dag",
        Type_Component:"component",
        Require_Global:"global",
        Require_Group:"group",
        Require_None:"none",
        //算子参数element属性的选择项，text表示选项的说明，value表示element属性的赋值。增加：齐工，2017.04.29
        Element_List:[
            {"text":"输入框","value":"text"},
            {"text":"多功能输入框","value":"text2"},
            // {"text":"唯一输入框","value":"uniquetext"},
            // {"text":"表名","value":"tablename"},
            // {"text":"表达式","value":"expressinput"},
            {"text":"函数表达式","value":"funcExpression"},
            {"text":"密码框","value":"password"},
            {"text":"多行文本框","value":"textarea"},
            {"text":"SQL专用多行文本框","value":"SQLOnly"},
            {"text":"复选框","value":"checkbox"},
            {"text":"单选框","value":"radio"},
            {"text":"HDFS文件单选","value":'selectHdfs'},
            {"text":"HDFS文件多选","value":'mulselectHdfs'},
            {"text":"HDFS目录多选","value":'selectHdfsdir'},
            {"text":"下拉菜单","value":"select"},
            {"text":"动态下拉菜单","value":"mulselect"},
            {"text":"动态列表","value":"mullist"},
            {"text":"组合框","value":"union"},
            {"text":"日期选择","value":"date"},
            {"text":"图片选择框","value":"imgselect"},
            {"text":"文件上传框","value":"fileupload"},
            {"text":"范围选择框","value":"range"},
            {"text":"编辑框","value":"edit"},
            {"text":"时间点","value":"time"},
            {"text":"时间段","value":"timerange"},
            {"text":"版本号","value":"version"},
            {"text":"多选数据字段","value":"comdrag"},
            {"text":"单选数据字段","value":"singleComdrag"},
            {"text":"单选坐标轴","value":'singleInputComdrag'},
            {"text":"多选坐标轴","value":'inputComdrag'},
            {"text":"前后序节点勾选控件","value":"checkbox2"},
            {"text":"默认","value":"default"}
        ],
        Element_Checkbox:"checkbox",
        Element_MulList:"mullist",
        Element_MulSelect:"mulselect",
        Element_MulOption:"muloption",
        Element_Default:"default",
        //算子参数type属性的选择项，text表示选项的说明，value表示element属性的赋值。增加：齐工，2017.04.29
        Type_List:[
            {"text":"普通参数","value":"normal"},
            {"text":"数据","value":"rdd"},
            {"text":"数据列","value":"rddField"},
            {"text":"算法程序","value":"script"},
            {"text":"绘图坐标","value":"axis"},
            {"text":"绘图布局","value":"layout"},
            {"text":"子分析流","value":"dag"},
            {"text":"算子引用","value":"component"}
        ]
    },
    //算子库相关常量。增加：齐工，2016/11/20
    ComLib:{
        //算子的默认版本号常量。增加：齐工，2016/11/20
        ComVersion_Default:"latest",
        //算子的类型名称常量。增加：齐工，2017/05/24
        ComTypeList:[
            {"text":"处理算子","value":"job"},
            {"text":"图元算子","value":"chart"}
        ],
        //处理算子类型常量。增加：齐工，2016/11/20
        ComType_Do:"job",
        //视图算子类型常量。增加：齐工，2016/11/20
        ComType_View:"view",
        //图元算子类型常量。增加：齐工，2016/11/20
        ComType_ViewAtom:"chart",
        //数据源算子类型常量。增加：齐工，2017/2/20
        ComType_DataSource:"datasource",
        ComType_Linkage:"linkage",
        //处理算子的语言类型常量。增加：齐工，2018/1/24
        ComLanguageList:[
            {"text":"Scala","value":"scala"},
            {"text":"Python","value":"python"},
            {"text":"R","value":"r"}
        ],
        ComLanguage_Python:"python",
        ComLanguage_Scala:"scala",
        ComLanguage_R:"r",
        //复合算子类型常量。增加：齐工，2017/3/7
        ComType_Composite:"composite",
        //算子的分类ID列表的分隔字符。增加：齐工，2017/1/5
        CategorySplit:",",
        //视图算子的绘图模板。增加：齐工，2017.2.20
        ViewComRenderTemplate:"",
        //算子新增版本标识。增加：齐工，2017.3.17
        NewComVersion:"upgrade",
        //平台预置的算子序列号。增加：齐工
        PresetComSN:{
            //子图虚拟源算子的SN。增加：齐工，2017.4.24
            SN_VirtualSourceCom:"faa72679-deab-4944-9f7d-660289bee640",
            //子图虚拟宿算子的SN。增加：齐工，2017.7.16
            SN_VirtualDestinationCom:"dd6e15d6-4732-4684-a525-45953805dc56",
            //数据预览算子的SN。增加：齐工
            SN_DataPreview:"561eb75c-19a2-4a7d-9e72-d197315c1717",
            //复合算子原型的SN。增加：齐工
            CompositePrototype:"7019d8cb-5324-441d-927d-bea106cc1213",
            //视图筛选数据源的SN。增加：齐咏杰
            ViewFilterSource:"bc9a6dfd-eed6-4fec-a04b-65b42f70aa7b",
            //保存节点数据算子的SN。增加：齐咏杰
            SaveNodeData:"a74739dd-8885-402a-9935-386035995669",
            //保存节点数据算子的SN。增加：齐咏杰
            LoadNodeData:"28f306e8-c8e4-4a53-9de2-5953239a4d11",
            //数据展示和子图数据展示、联动展示算子的SN。增加：齐咏杰
            DataView:"008cbb51-d68e-4cae-a426-fed0be2d4781",
            SubDagView:"933ffe9b-323c-4eff-a3ee-84161e87c6c2",
            LinkageView:"840e9894-0cc8-4025-ab35-6de43a2a8e98",
            LinkageSelectedData:"c10a9abe-82fd-41a0-94b0-d8295ed3a868",
            //资源配置参数模板，仅用于资源管理页面，不具有执行功能。增加：齐咏杰，2018.2.9
            SparkInterpreterConfig:"6c4aff100ade40b7a30e51f77862b909",
            //
            SystemParamList:"3965236110124c6d88bd2aa819fb4bb4"
        },
        //预定义的算子参数设置模板。增加：齐工，2017.6.16
        ComParamSettingUrls:[
            {"text":"通用算子模板","value":"/app/module/comLib/comApply/commonView.html"},
            {"text":"通用算子增强模板","value":"/app/module/comLib/comApply/commonViewLast.html"},
            {"text":"Excel数据源模板","value":"/app/module/home/worktable/paramsetting/excel.data.html"},
            {"text":"关系数据库数据源模板","value":"/app/module/comLib/comApply/relationView.html"},
            {"text":"关系数据库数据源增强模板","value":"/app/module/comLib/comApply/relationViewEnhance.html"},
            {"text":"文本数据源模板","value":"/app/module/home/worktable/paramsetting/json.data.html"},
            {"text":"数据视图模板","value":"/app/module/viewCube/paramSet.tpl.html"},
            {"text":"联动数据视图模板","value":"/app/module/viewCube/paramSetCopy.tpl.html"},
            {"text":"MongDB模板","value":"/app/module/comLib/comApply/mongodbView.html"},
            {"text":"webpage模板","value":"/app/module/comLib/comApply/webpageView.html"},
            {"text":"MongoDB数据源模板","value":"/app/module/comLib/comApply/mongoDB.template.html"},
            {"text":"快读数据库模板","value":"/app/module/comLib/comApply/relationNew.html"},
            {"text":"数据建模模板","value":"/app/module/comLib/comApply/dataModel.html"},
            {"text":"读取数据库模板","value":"/app/module/comLib/comApply/readAndWriteDataBase.html"},
            {"text":"HBase读取模板","value":"/app/module/comLib/comApply/hbaseView.html"}
        ]
    },
    //与对象存储相关的常量。增加：齐工，2016/12/29
    Store:{
        //对象状态的枚举
        //对象的新增状态，未存储。增加：齐工，2016/12/29
        State_Added:"added",
        //对象的删除状态，未同步删除存储中的对象。增加：齐工，2016/12/29
        State_Deleted:"deleted",
        //对象的剥离状态，未同步至存储。增加：齐工，2016/12/29
        State_Detached:"detached",
        //对象的修改状态，未存储。增加：齐工，2016/12/29
        State_Modified:"modified",
        //对象的未更改状态，或已同步至存储。增加：齐工，2016/12/29
        State_Unchanged:"unchanged"
    },
    //与分类目录相关的常量。增加：齐工，2016/12/30
    Directory:{
        //分类目录类型的枚举，建议改成按位标识的枚举，如1、2、4、8...
        //算子分类的类型。增加：齐工，2016/12/30
        Type_Com:"1",
        //图元分类的类型。增加：齐工，2016/12/30
        Type_Chart:"2",
        //分析流分类的类型。增加：齐工，2016/12/30
        Type_Flow:"4"
    },
    //与分析流相关的常量。增加：齐工，2017/3/9
    Flow:{
        //节点的等待状态。增加：齐工，2017/3/9
        NodeState_Waiting: "waiting",
        //节点的等待状态。挂起：齐工，2017/3/9
        NodeState_Pending: "pending",
        //节点的执行状态。增加：齐工，2017/3/9
        NodeState_Running : "running",
        //节点的完成状态。增加：齐工，2017/3/9
        NodeState_Finished : "finished",
        //节点的出错状态。增加：齐工，2017/3/9
        NodeState_Error : "error",
        //结果数据表的最长生命期：6小时，即21600000毫秒。0表示无限时。增加：齐工，2017/3/10
        resultTableMaxLiving : 21600000
    },
    // 与引擎调度相关的常量。增加：齐工，2017/4/6
    Scheduling:{
        // 缺省的引擎URL路径。增加：齐工，2017/4/6
        DefaultEngineUrl:"/engine",
        // 获取引擎指定节点的输出RDD的schema
        RestAction:{ GetRddSchemas:"paragraphRddNameAndSchema" },
        //缺省的引擎URL端口。增加：齐工，2017/4/6
        DefaultEnginePort:9898,
        //默认的Note ID长度。增加：齐工，2017/4/17
        DefaultFlowIdLength:10,
        //默认的Paragraph ID长度。增加：齐工，2017/4/17
        DefaultNodeIdLength:8,
        //默认的引擎响应等待超时时间，毫秒。增加：齐工
        EngineTimeout:30000
    },
    //数据驱动方法名称 add  tanglvshuang
    Methods:["getDirectories","updateDirectory","removeDirectory","getItem","addItem","updateItem","removeItem"],
    //数据驱动服务名称 add  tanglvshuang
    DriverNames:{
        Flow:"flow",
        Component:"component",
        Icon:"icon",
        TipIcon:"tipIcon",
        Template:"template",
        File:"file"
    },
    //消息总线注册消息。不同的用途，消息必须不同，否则相互影响。增加：齐工
    MessageQueue:{
        // 消息提示模块。增加：齐工
        Notification:"notification",
        // 调度服务内部使用的消息，请勿更改。增加：齐工
        Scheduling_Note:"setNoteContent",
        Scheduling_Paragraph:"updateParagraph",
        Scheduling_AngularUpdate:"angularObjectUpdate",
        Scheduling_AngularRemove:"angularObjectRemove",
        Scheduling_ConnectChanged:"connectChanged",
        Scheduling_Progress:"updateProgress",
        Scheduling_Timeout:"engineTimeout",
        Scheduling_InterpreterBinding:"interpreterBindings",
        // 引擎RDD数据推送消息。增加：齐工
        DataSetReceived:"dataSetReceived",
        DataSetShow:"dataSetShow",
        // 平台登录消息。增加：齐工
        Login_Success:"loginSuccess",
        //重设资源 tanglvshuang 2018.3.29
        Resetting_Resources:"ResettingResources"
    },
    //资源管理属性的中文配置
    InterpreterConfig:[
        {"name":"PYSPARK_PYTHON","cname":"python设置","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"zzjz.spark.useHiveContext","cname":"是否使用Hive环境","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"zzjz.spark.printREPLOutput","cname":"是否输出调试","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"zzjz.spark.maxResult","cname":"最大输出记录数","isShow":true,"defaultValue":"","isDefault":true},
        {"name":"zzjz.interpreter.output.limit","cname":"最大输出字节数","isShow":true,"defaultValue":"","isDefault":true},
        {"name":"zzjz.spark.concurrentSQL","cname":"是否使用并行SQL","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"zzjz.spark.sql.stacktrace","cname":"是否跟踪SQL执行","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"zzjz.spark.importImplicit","cname":"是否支持隐式导入","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"zzjz.dep.localrepo","cname":"引擎本地包地址","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"zzjz.interpreter.localRepo","cname":"引擎本地资源库地址","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"zzjz.dep.additionalRemoteRepository","cname":"附加包地址","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"zzjz.pyspark.python","cname":"pyspark类型","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"args","cname":"环境参数","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"master","cname":"主服务器地址","isShow":true,"defaultValue":"master://master.zzjz.com:7077","isDefault":true},
        {"name":"spark.app.name","cname":"Spark应用名称","isShow":true,"defaultValue":"ZZJZ","isDefault":true},
        {"name":"spark.cores.max","cname":"Spark使用最大内核数","isShow":true,"defaultValue":"30","isDefault":true},
        {"name":"spark.executor.memory","cname":"Spark运行内存","isShow":true,"defaultValue":"6g","isDefault":true},
        {"name":"spark.executor.cores","cname":"Spark单任务使用核数","isShow":true,"defaultValue":"6","isDefault":true},
        {"name":"spark.home","cname":"Spark主目录","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"spark.yarn.jar","cname":"Spark依赖jar包","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"zeppelin.dep.additionalRemoteRepository","cname":"ZZJZ开发者附加远程资源库","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"zeppelin.dep.localrepo","cname":"ZZJZ开发者本地资源库","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"zeppelin.pyspark.python","cname":"ZZJZ引擎pyspark的python脚本","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"zeppelin.spark.concurrentSQL","cname":"ZZJZ的spark当前查询语句","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"zeppelin.spark.maxResult","cname":"ZZJZ的spark返回最大记录数","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"zeppelin.spark.useHiveContext","cname":"ZZJZ是否使用HIVE的集群环境","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"hive.hiveserver2.url","cname":"Hive集群服务地址","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"hive.hiveserver2.password","cname":"Hive集群用户密码","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"hive.hiveserver2.user","cname":"Hive集群用户名称","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"phoenix.jdbc.url","cname":"Phoenix数据库连接JDBC地址","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"phoenix.user","cname":"Phoenix用户名称","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"phoenix.password","cname":"Phoenix密码","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"phoenix.max.result","cname":"Phoenix返回最大记录数","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"phoenix.driver.name","cname":"Phoenix驱动名称","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"tajo.jdbc.url","cname":"Tajo数据库连接地址","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"port","cname":"端口","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"host","cname":"主机地址","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"ignite.peerClassLoadingEnabled","cname":"Ignite是否动态加载类","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"ignite.config.url","cname":"Ignite服务地址","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"ignite.jdbc.url","cname":"Ignite数据库连接地址","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"ignite.clientMode","cname":"Ignite客户端模式","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"ignite.addresses","cname":"Ignite地址","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"lens.client.dbname","cname":"Lens数据库名称","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"lens.query.enable.persistent.resultset","cname":"Lens查询结果是否持久化","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"lens.server.base.url","cname":"Lens服务器地址","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"lens.session.cluster.user","cname":"Lenssession集群用户名","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"zeppelin.lens.maxResults","cname":"ZZJZ在lens返回最大记录数","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"zeppelin.lens.maxThreads","cname":"ZZJZ在lens使用最大线程数","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"zeppelin.lens.run.concurrent","cname":"ZZJZ在Lens同步运行","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"cassandra.cluster","cname":"Cassandra集群地址","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"cassandra.compression.protocol","cname":"Cassandra压缩协议","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"cassandra.credentials.password","cname":"Cassandra认证密码","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"cassandra.credentials.username","cname":"Cassandra认证用户名","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"cassandra.hosts","cname":"Cassandra主机地址","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"cassandra.interpreter.parallelism","cname":"Cassandra解析器平衡器","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"cassandra.keyspace","cname":"Cassandra秘钥","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"cassandra.load.balancing.policy","cname":"Cassandra负载平衡策略","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"cassandra.max.schema.agreement.wait.second","cname":"Cassandra最大等待延长时间","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"cassandra.native.port","cname":"Cassandra本地端口","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"cassandra.pooling.core.connection.per.host.local","cname":"Cassandra内核连接每台主机本地","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"cassandra.pooling.core.connection.per.host.remote","cname":"Cassandra内核连接每台主机远程地址","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"cassandra.pooling.heartbeat.interval.seconds","cname":"Cassandra池的心跳时间","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"cassandra.pooling.idle.timeout.seconds","cname":"Cassandra池钝化的时间","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"cassandra.pooling.pool.timeout.millisecs","cname":"Cassandra池的超时时间","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"cassandra.protocol.version","cname":"Cassandra协议版本","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"cassandra.query.default.consistency","cname":"Cassandra查询默认一致性","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"cassandra.query.default.fetchSize","cname":"Cassandra查询默认提取大小","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"cassandra.query.default.serial.consistency","cname":"Cassandra查询默认序列化一致性","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"cassandra.reconnection.policy","cname":"Cassandra重连策略","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"cassandra.retry.policy","cname":"Cassandra重试策略","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"cassandra.socket.connection.timeout.millisecs","cname":"Cassandra socket连接超时时间","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"cassandra.socket.read.timeout.millisecs","cname":"Cassandra socket读取数据超时时间","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"cassandra.socket.tcp.no_delay","cname":"Cassandra socke tcp协议是否延迟","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"cassandra.speculative.execution.policy","cname":"Cassandra 执行策略","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"cassandra.pooling.new.connection.threshold.remote","cname":"Cassandra 远程连接池的数量","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"cassandra.pooling.max.request.per.connection.remote","cname":"Cassandra 最大请求数量","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"cassandra.pooling.new.connection.threshold.local","cname":"Cassandra 本地连接池的数量","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"postgresql.password","cname":"Postgresql密码","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"postgresql.driver.name","cname":"Postgresql驱动名称","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"postgresql.max.result","cname":"Postgresql返回最大记录数","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"postgresql.url","cname":"Postgresql连接地址","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"postgresql.user","cname":"Postgresql用户名","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"kylin.api.user","cname":"Kylin的接口用户名","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"kylin.query.limit","cname":"Kylin查询限制数","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"kylin.api.password","cname":"Kylin密码","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"kylin.query.offset","cname":"Kylin查询时长","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"kylin.query.project","cname":"Kylin查询工程名称","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"kylin.query.ispartial","cname":"Kylin是否局部查询","isShow":false,"defaultValue":"","isDefault":false},
        {"name":"kylin.api.url","cname":"Kylin访问地址","isShow":false,"defaultValue":"","isDefault":false}
    ],
    //算子库权限配置。add lym 2018/1/27
    ComLibAuthority:{
        "all":16,//所有权限
        "view":16,//可视
        "edit":8,//可编辑
        "delete":4,//可删除
        "add":2,//可添加算子
        "remove":1//可移除算子
    },
    //算子权限配置。add lym 2018/1/27
    ComAuthority:{
        "all":5,//所有权限
        "view":4,//可视
        "edit":2,//可编辑
        "delete":1//可删除
    },
    //分析流权限配置。add lym 2018/1/27
    FlowAuthority:{
        "all":10,//所有权限
        "view":8,//可视
        "edit":4,//可编辑
        "delete":2,//可删除
        "runnable":1//可执行
    }
};