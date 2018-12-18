const $q=require("../common/$q");
const $http=require("../common/$http");

function testPost(action,data) {
    $http.post('http://192.169.11.102:4000/rest/'+action,data).then((res)=>{
        console.log(res);
    });
}

//testPost("getAppByUserName",{userName:"liaocai"});
//testPost("runApp",{userName:"tanglvshuang",appId:"165"});
testPost("runApp",{userName:"liaocai",appId:"165"});
//console.log(process.cwd());y