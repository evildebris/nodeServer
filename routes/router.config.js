/**
 * 路由配置
 */
const configConst = [
	"home",
	"saveOrUpdateWorkflow",//根据分析流ID保存分析流 POST
	"getAppByUserName",//根据userName获取app POST
	"runApp",//根据appId username查询和运行app POST
]
module.exports = configConst;