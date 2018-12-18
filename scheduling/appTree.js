const Dag = require('../common/Dag');

function initTreeNode(_this,node,canRun,head) {
    var isStop = node.originalParam&&node.originalParam.isStop;
    if(isStop||node.isStop) {
        node.isStop = true;
        if(node.canRun===undefined){
            node.canRun = []
        }
        if(!node.heads){
            node.heads=[];
        }
        node.canRun.push &&node.canRun.push(canRun);
        node.heads.push(head);
        canRun = false;
    }
    node.prev = Dag.findPreNodes(_this.diagram,node);
    node.next= Dag.findPostNodes(_this.diagram,node);
    node.next.forEach(function (e) {
        initTreeNode(_this,e,canRun,head);
    });
}

function initTreeData(_this) {
    _this.heads.forEach(function (node) {
        node.next= Dag.findPostNodes(_this.diagram,node);
        node.prev = null;
        if(node.isStop){
            node.canRun = true;
        }
        node.next.forEach(function (e) {
            initTreeNode(_this,e,true,node);
        });
    });

    _this.diagram.nodes.forEach(function (e,i) {
        if(e.isStop&&angular.isArray(e.canRun)){
            var runStatus = e.canRun,run=true;
            runStatus.forEach(function (status) {
                e.canRun = e.canRun&&status;
            })
        }
    });
}

function refreshNode(_this,node,canRun) {
    if(node.isStop) {
        if(canRun){
            $("#"+node.id+"_stop").removeClass("disable");
        }
        node.canRun = canRun;
        canRun = false;
    }
    var next= Dag.findPostNodes(_this.diagram,node);
    next.forEach(function (e) {
        refreshNode(_this,e,canRun);
    });
}

//查找运行的最上级的节点
function getNoRunHead(node,arr) {
    if(!arr){
        arr = [];
    }
    if(node.prev){
        node.prev.forEach(function (n) {
            if(!n.prev){
                arr.push(n);
            }else if(n.isStop){
                arr.push(node);
            } else {
                getNoRunHead(n,arr);
            }
        })
    }
    return arr;
}

//查找改图元需要执行的所有算子
function getRunPart(_this,node,arr,map) {
    if(!arr){
        arr = [];
        map={};
    }
    if(!map[node.id]) {
        arr.unshift(node);
        map[node.id] = true;
    }
    if(node.prev){
        node.prev.forEach(function (n) {
            if(!n.prev){
                !map[n.id]&& arr.unshift(n);
                map[n.id] = true;
            }else if(!n.isStop){
                getRunPart(_this,n,arr,map);
            }
        })
    }
    return arr;
}

//获取上一次stop后一个节点
function getLastStopPrev(node) {
    var len=this.diagram.nodes.length-1,findNode=false,curNode;
    for (var i=len;i>=0;i--){
        curNode = this.diagram.nodes[i];
        if(findNode&&curNode.isStop){
            return curNode;
        }
        if(curNode.id === node.id){
            findNode =true;
        }
    }
    return curNode;
}

class appTree{
    constructor(diagram,paramSettings) {
        if(!diagram||!paramSettings){
            console.error("appTree 构造参数为空");
            return;
        }
        var _this = this,lastNode;
        _this.$mapNode={};
        _this.$mapEdge={};
        _this.diagram = diagram;
        _this.diagram.nodes.forEach(function (e,i) {
            _this.$mapNode[e.id] = e;
            e.run = false;
            e.runPos = i;
        });
        _this.diagram.edges.forEach(function (e,i) {
            if(!_this.$mapEdge[e.source]){
                _this.$mapEdge[e.source] = [];
            }
            _this.$mapEdge[e.source].push(e.target);
        });
        lastNode = _this.diagram.nodes[_this.diagram.nodes.length-1];
        lastNode.isStop = true;
        paramSettings.forEach(function (e) {
            _this.$mapNode[e.id].originalParam = e;
        });
        _this.heads=Dag.findHeadNodes(_this.diagram);
        initTreeData(_this);
    }
    getNodeRunStartNode (nodeId) {
        var _this = this;
        var node = _this.$mapNode[nodeId],startNode = node,
            _noRunHeads = getNoRunHead(node);
        _noRunHeads.forEach(function (e) {
            if(e.runPos<startNode.runPos){
                startNode = e;
            }
        });
        return startNode;
    }
    getStartNode(nodeId){
        var _this = this;
        var node = _this.$mapNode[nodeId],
            treeHead = this.getNodeRunStartNode(nodeId),lastNodeStart=this.getLastStopPrev(node);
        if(lastNodeStart.runPos<treeHead.runPos){
            treeHead = lastNodeStart;
        }

        return treeHead;
    }
    hasLinkNode (nodeId,linkId) {
        var nextLinks = this.$mapEdge[nodeId],hasLink=false,
            _this = this,
            linkNode = _this.$mapNode[linkId];
        if(nextLinks && nextLinks.length){
            nextLinks.forEach(function (nextLink) {
                if(nextLink === linkId){
                    hasLink = true;
                    return false;
                }
            })
        }
        if(!hasLink&&nextLinks){
            nextLinks.forEach(function (nextLink) {
                var nextNode = _this.$mapNode[nextLink];
                if(nextNode.runPos<linkNode.runPos){
                    if(_this.hasLinkNode(nextLink,linkId)){
                        hasLink = true;
                        return false;
                    }
                }
            })
        }
        return hasLink;
    }
    /**
     * @param {string} nodeId 根据视图节点id获取该分析流中可执行片断
     * @return {Array} result 这次执行的所有node
     * */
    getRunPart (nodeId) {
        var treeHead = this.getStartNode(nodeId),
            curNode,
            node = this.$mapNode[nodeId],
            len = node.runPos+1,
            result=[],headMap={};
        node.heads && node.heads.forEach(function (e) { headMap[e.id]=true; });
        for (var i = treeHead.runPos;i<len;i++) {
            curNode = this.diagram.nodes[i];
            if(curNode.isStop&&curNode!==node){
                /*var hasSameHead = false;
                curNode.heads&&curNode.heads.forEach(function (head) {
                    if(headMap[head.id]){
                        hasSameHead = true;
                    }
                });
                //有相同祖先时查看是否有上下级关系有关系时必须执行
                if(hasSameHead && this.hasLinkNode(curNode.id,node.id)){
                    result.push(curNode);
                }*/
            }else {
                result.push(curNode);
            }
        }
        return result;
    }
    clear () {
        this.diagram.nodes.forEach(function (node) {
            delete node.prev;
            delete node.next;
            delete node.originalParam;
            delete node.heads;
        });
        delete this.$mapEdge;
        delete this.$mapNode;
    }
    getLastStopPrev:getLastStopPrev,
    hasRunNode (node) {
        var _this=this,
            next= Dag.findPostNodes(_this.diagram,node);
        next.forEach(function (e) {
            refreshNode(_this,e,true);
        });
    }
}

module.exports = appTree;