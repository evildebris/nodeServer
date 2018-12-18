module.exports = function(app){
    app.post('/rest/saveOrUpdateWorkflow', function(req, res, next) {
        console.log(req.body);

        res.json({
            status:'OK'
        });
    });
};