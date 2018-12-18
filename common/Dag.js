const Utility = require('./Utility');
//全局函数定义
/**
 * 根据节点Id获取节点对象
 * @param dag 流程DAG对象
 * @param nodeid 节点ID
 * @returns {*} 如果找到，返回节点对象，否则返回空
 */
function getNodeById (dag, nodeid) {
    var nd = null;
    dag.nodes.some(function (x) {
        if (x.id == nodeid) {
            nd = x;
            return true;
        } else return false;
    });
    return nd;
}

/**
 * 根据节点ID列表，查找对应的节点对象
 * @param dag DAG对象
 * @param idList 节点ID列表，数组
 * @returns {Array} 节点对象列表，数组
 */
function getNodesByIds(dag,idList){
    var result=[];
    var ids=angular.copy(idList);
    for(var j=0;j<dag.nodes.length;j++){
        for(var i=0;i<ids.length;i++){
            if(dag.nodes[j].id==ids[i]){
                result.push(dag.nodes[j]);
                ids.splice(i,1);
                break;
            }
        }
        if(ids.length==0){
            break;
        }
    }
    return result;
}

/**
 * 查找当前节点的上一步节点
 * @param dag DAG图对象
 * @param nd 被查找的节点
 * @returns {*} 上一步节点ID的数组
 */
function findPreNodeIds (dag, nd) {
    return dag.edges.filter(function (x) {
        return x.target === nd.id;
    }).map(function (x) {
        return x.source;
    });
}

/**
 * 查找当前节点的下一步节点
 * @param dag DAG图对象
 * @param nd 被查找的节点
 * @returns {*} 下一步节点ID的数组
 */
function findPostNodeIds  (dag, nd) {
    return dag.edges.filter(function (x) {
        return x.source === nd.id;
    }).map(function (x) {
        return x.target;
    });
}

/**
 * 查找当前节点的上一步节点
 * @param dag DAG图对象
 * @param nd 被查找的节点
 * @returns {*} 上一步节点的数组
 */
function findPreNodes (dag, nd) {
    var ids= dag.edges.filter(function (x) {
        return x.target === nd.id;
    }).map(function (x) {
        return x.source;
    });
    return getNodesByIds(dag,ids);
}

/**
 * 查找当前节点的下一步节点
 * @param dag DAG图对象
 * @param nd 被查找的节点
 * @returns {*} 下一步节点的数组
 */
function findPostNodes  (dag, nd) {
    var ids= dag.edges.filter(function (x) {
        return x.source === nd.id;
    }).map(function (x) {
        return x.target;
    });
    return getNodesByIds(dag,ids);
}

/**
 * 查找DAG中的首节点
 * @param dag DAG对象
 * @returns {Array} 首节点的列表，数组
 */
function findHeadNodes(dag){
    var result=[];
    dag.nodes.forEach(function (x) {
        if(!dag.edges.some(function (y) {
                return y.target===x.id;
            })){
            result.push(x);
        }
    });
    return result;
}

/**
 * 查找DAG中的尾节点
 * @param dag DAG对象
 * @returns {Array} 尾节点的列表，数组
 */
function findTailNodes(dag){
    var result=[];
    dag.nodes.forEach(function (x) {
        if(!dag.edges.some(function (y) {
                return y.source===x.id;
            })){
            result.push(x);
        }
    });
    return result;
}

/**
 * 将DAG中各节点按连线先后顺序拉直，返回按顺序的节点数组
 * @param dag DAG
 * @param head 拉直的首节点，该节点的前序节点不会出现在返回的结果中。如果不指定首节点，则拉直所有节点
 * @returns {*} 按顺序的节点数组
 */
function straightenDag (dag, head) {
    if (!dag)
        return undefined;
    //计算联通子图
    var stage = [];
    //备份原DAG
    var connectedGraphs = findConnectedGraphs(dag);
    for (var i = 0; i < connectedGraphs.length; i++) {
        if(head){
            //检查连通图中是否包含该节点
            if(Utility.some(connectedGraphs.nodes,function(nd){
                    return nd.id==head.id;
                })){
                straightenConnectedGraph(connectedGraphs[i], head, stage);
            }
        }else {
            straightenConnectedGraph(connectedGraphs[i], null, stage);
        }
    }
    return stage;
}

/**
 * 拉直单个连通图
 * @param dagcopy DAG
 * @param head 拉直的首节点，如果为空，则为整个图
 * @param stage 返回的节点执行顺序
 * @param recursive 是否递归的状态，调用时不输入此参数
 * @return {*} 返回的节点执行顺序
 */
function straightenConnectedGraph(dagcopy,head,stage,recursive){
    //是否需要添加首节点
    var node=head;
    if (!head) {
        //添加虚拟首节点
        node = {id: "vitualHeadNode"};
        var headIds = [];
        dagcopy.nodes.forEach(function (x) {
            if (!dagcopy.edges.some(function (y) {
                    return y.target === x.id;
                })) {
                headIds.push(x.id);
            }
        });
        dagcopy.nodes.push(node);
        headIds.forEach(function (x) {
            dagcopy.edges.push({source: "vitualHeadNode", target: x});
        });
    }
    stage.push(node);
    var pstNodes = findPostNodes(dagcopy, node);
    pstNodes.forEach(function (x) {
        straightenConnectedGraph(dagcopy, x, stage,true);
    });
    //对节点进行优化：删除重复节点（将靠前的重复节点删除）和虚拟首节点
    if(!recursive) {
        var nindex = stage.length - 1;
        while (nindex > 0) {
            //删除中间的虚拟节点
            if(stage[nindex].id==="vitualHeadNode"){
                stage.splice(nindex,1);
                nindex--;
                continue;
            }
            for (var i = nindex - 1; i >= 0; i--) {
                if (stage[i].id === stage[nindex].id) {
                    //重复节点
                    stage.splice(i, 1);
                    nindex--;
                }
            }
            nindex--;
        }
        //删除虚拟首节点
        if(stage[0].id==="vitualHeadNode"){
            stage.splice(0,1);
        }
    }
    return stage;
}

/**
 * 计算DAG中的连通图，返回包含DAG的数组
 * @param dag
 * @return {Array}
 */
function findConnectedGraphs(dag){
    var result=[];
    if(!dag||!dag.edges||!dag.nodes) return result;
    //备份dag
    var dagcopy={nodes:[],edges:[],ports:[]};
    dag.edges.forEach(function (x) {
        dagcopy.edges.push(x);
    });
    dag.nodes.forEach(function (x) {
        dagcopy.nodes.push(x);
    });
    //开始计算连通图
    while(dagcopy.nodes.length>0){
        var node=dagcopy.nodes[0];
        var connDag={nodes:[],edges:[],ports:[]};
        //待分析节点队列
        var connecting=[node.id];
        while(connecting.length>0){
            var nd=connecting[0];
            var neighbour=findNeighbour(dagcopy,nd);
            //加入connDag边表
            Utility.mergeArrays(connDag.edges,neighbour.edges);
            connecting.splice(0,1);
            //邻接点放入connecting
            neighbour.ids.forEach(function(id){
                if(Utility.contains(connDag.nodes,id)){
                    return;
                }
                if(Utility.contains(connecting,id)){
                    return;
                }
                connecting.push(id);
            });
            connDag.nodes.push(nd);
        }
        RebuildDagNodesAndCut(dagcopy,connDag);
        result.push(connDag);
    }
    return result;
}

/**
 * 查找邻居节点，返回包含节点ID的数组和邻居edges数组
 * @param dag 图对象
 * @param nodeId 待查找的节点ID
 * @param exceptId 返回值中需要排除的节点ID
 * @return {*} 返回节点ID的数组
 */
function findNeighbour(dag, nodeId, exceptId) {
    result= {ids:[],edges:[]};
    if(!dag||!dag.edges||!dag.nodes) return result;
    dag.edges.forEach(function (edge) {
        if(edge.source==nodeId && edge.target!=exceptId){
            result.ids.push(edge.target);
            result.edges.push(edge);
        }
        if(edge.target==nodeId && edge.source!=exceptId){
            result.ids.push(edge.source);
            result.edges.push(edge);
        }
    });
    return result;
}

/**
 * 重构连通图的节点表和边表，并将联通图从原DAG中删除
 * @param sourceDag 原DAG
 * @param targetDag 连通图
 * @constructor
 */
function RebuildDagNodesAndCut(sourceDag,targetDag){
    //重建连通图节点，并删除原图中的相应节点
    for(var i=0;i<targetDag.nodes.length;i++){
        var nodeid=targetDag.nodes[i];
        for(var j=0;j<sourceDag.nodes.length;j++){
            if(sourceDag.nodes[j].id==nodeid){
                //将目标DAG的nodeID替换成node
                targetDag.nodes.splice(i,1,sourceDag.nodes[j]);
                //将原始DAG的node删除
                sourceDag.nodes.splice(j,1);
                break;
            }
        }
    }
    //删除原图中的边
    for(var i=0;i<targetDag.edges.length;i++){
        var edge=targetDag.edges[i];
        for(var j=0;j<sourceDag.edges.length;j++){
            var sedge=sourceDag.edges[j];
            if(sedge.source==edge.source&&sedge.target==edge.target){
                sourceDag.edges.splice(j,1);
                break;
            }
        }
    }
}

//服务代码
this.getNodeById = getNodeById;
this.getNodesByIds = getNodesByIds;
this.findPreNodeIds = findPreNodeIds;
this.findPostNodeIds = findPostNodeIds;
this.findPreNodes = findPreNodes;
this.findPostNodes = findPostNodes;
this.findHeadNodes = findHeadNodes;
this.findTailNodes = findTailNodes;
this.straightenDag=straightenDag;

module.exports =this;
