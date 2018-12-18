//常量定义

//变量定义
var _self = {};
var _initiated = false;
var _queueList = {};
// 输入消息队列，数据结构：{msg, body:[]}
var _inbox=[];
var _newmsg=false;
var MAX_INBOX_MESSAGES=1000;

//服务初始化
function init() {
    _queueList = {};
    _initiated = true;
}

//发布消息
function publish() {
    if (arguments.length === 0) {
        return;
    }
    var msg = arguments[0];
    var args = [].slice.call(arguments, 1);
    if (msg && msg.length > 0) {
        var queue = _queueList[msg];
        if (!queue) {
            //如果某个消息没有订阅者，则这个消息将被丢弃
            return;
        }
        // 将消息放入inbox，待后续处理
        if(_inbox.length>MAX_INBOX_MESSAGES) {
            console.warn("JMQ队列超过上限，丢弃消息" + msg);
        }else {
            console.debug("JMQ队列数："+_inbox.length);
            _inbox.push({
                msg: msg,
                body: args
            });
        }
        if(!_newmsg){
            setTimeout(doWork, 0);
            _newmsg=true;
            console.debug("准备启动JMQ处理。JMQ队列数："+_inbox.length);
        }
    }
}

function doWork() {
    console.debug("启动JMQ处理。JMQ队列数："+_inbox.length);
    while (_inbox.length > 0) {
        var message = _inbox.shift();
        if (message) {
            var queue = _queueList[message.msg];
            if (queue) {
                //按订阅时的顺序逐个调用
                for (var i = 0; i < queue.length; i++) {
                    //考虑到某个订阅会在执行后将自己退订，故需要在循环中判断队列是否变化
                    var subscr = queue[i];
                    if (subscr.func && typeof(subscr.func) == "function") {
                        var notNext = true;
                        try {
                            notNext = queue[i].func.apply(queue[i].owner, message.body);
                        } catch (ex) {
                            console.warn("JMQ执行订阅者异常：%s", ex);
                        }
                        if (notNext === true) {
                            break;
                        }
                        if (i < queue.length && queue[i].id !== subscr.id) {
                            i--;
                        }
                    }
                }
            }
        }
    }
    _newmsg=false;
}

/**
 * 订阅消息
 * @param msg 订阅的消息类型，字符串
 * @param callbackFn 消息处理回调函数，如果未指定处理回调函数，则不会订阅该消息。如果回调函数返回true，则不会再将该消息分发给其他订阅者。
 * @param funcOwner 消息处理回调函数的持有对象，即该回掉函数是哪个对象的属性。
 * @returns {*} 订阅号
 */
function subscribe(msg, callbackFn, funcOwner) {
    if (msg && callbackFn && typeof(callbackFn) === "function") {
        var queue = _queueList[msg];
        if (!queue) {
            queue = [];
            _queueList[msg] = queue;
        }
        var sub = {
            id: queue.length + 1,
            func: callbackFn,
            owner:funcOwner
        };
        queue.push(sub);
        return {queue: msg, id: sub.id};
    }
    return undefined;
}

/**
 * 取消订阅
 * @param subscribeId 要取消的订阅号
 * @returns {boolean} 取消订阅是否成功
 */
function unsubscribe(subscribeId) {
    if (!subscribeId || !subscribeId.queue || !subscribeId.id) {
        return false;
    }
    var queue = _queueList[subscribeId.queue];
    if (queue) {
        //查找指定id
        for (var i = 0; i < queue.length; i++) {
            if (queue[i].id === subscribeId.id) {
                queue.splice(i, 1);
                break;
            }
        }
        //如果当前队列已经没有订阅者，则删除该队列
        if (queue.length === 0) {
            _queueList[subscribeId.queue] = undefined;
            delete _queueList[subscribeId.queue];
        }
    }
    return true;
}

//服务代码
_self.init = init;
_self.publish = publish;
_self.subscribe = subscribe;
_self.unsubscribe = unsubscribe;

module.exports = _self;