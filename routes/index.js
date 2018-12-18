const routeConfig = require('./router.config.js'),
    home = require('./home'),
    getAppByUserName = require('./getAppByUserName'),
    getAppByAppName = require('./getAppByAppName'),
    runApp = require('./runApp'),
    getAppById = require('./getAppById'),
    otherAPI = require('./otherAPI'),
	routes = [];

module.exports = function(app){
    home(app);
    getAppByUserName(app);
    runApp(app);
    getAppByAppName(app);
    getAppById(app);
    otherAPI(app);
};