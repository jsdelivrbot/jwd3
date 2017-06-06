function() {
    //return db.getCollection('journals').find({journalType: obj.journalType});
    var queue = [];
        
    var roots = db.journals
        .aggregate([
             {$match:  { "parent": null,
                         "isFolder": true }}, 
             {$lookup: { from: "users",
                         localField: "user",
                         foreignField: "_id",
                         as: "user" }},
             {$project: { "user":  {"_id": 0, "email": 1} }}
        ]);
           
    /*var getRecursive = function (obj) {
        var children = getChildren(obj);
        for (var x = 0; x < children.length; x++) {
            queue.push(children[x]);
            getRecursive(children[x]._id);
        }
    };
    
    var getChildren = function (obj) {
        return db.getCollection('journal').find({
            'parent': obj._id,
            'journalType': obj.journalType
        });        
    };
    
    //---------------------------------
    roots.forEach(function(item){
        queue.push(item);
    });
        
    return queue;*/
    return roots;
}