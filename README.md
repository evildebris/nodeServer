###  安装调试器
```cnpm/npm install -g node-inspector```
###  监听调试服务
```node-inspector -p 8000```
###  启动调试程序
``` node --debug-brk app.js```
### node最新版本不需安装调试器v7以上版本
```node --inspect-brk ./bin/server```
### 安装项目环境 svn添加ignorelist 屏蔽node_modules和.idea
```cnpm/npm install --save-dev```

### 项目打包
- linux
```pkg -t linux ./package.json```
- win
 ```pkg -t win ./package.json```
### package.json中配置静态文件config的路径不对齐进行打包