const DeployConst = require('../common/DeployConst');

module.exports ={
    getCookies(){
        return {
            userName:DeployConst.engineUser
        };
    }
};