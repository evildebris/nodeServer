const $q=require("../common/$q");
const $http=require("../common/$http");
//http://192.168.11.101
//http://localhost
function testPost(action,data) {
    $http.post('http://localhost:4000/rest/'+action,data).then((res)=>{
        console.log(res);
    });
}

testPost("getAppByAppName",{userName:"liaocai",appName:"liao2"});