function() {
    var queue = [];
    //--
    var searchDoc = function(query){
        return db.journals
                 .aggregate([
                    {$match: query},
                    {$lookup: { from: "users",
                                localField: "user",
                                foreignField: "_id",
                                as: "user" }},
                    {$project: { "_id": 1, "name": 1, "fileName": 1, 
                                 "originalFileName": 1, "parent": 1, "createDate": 1,
                                 "size": 1, "operations": 1,
                                 "isFolder": 1, "journalType": 1, "isReadonly": 1,
                                 "user.email": 1
                                }}
        ]);
    };
    //--
    var getRecursive = function (id) {        
        var children = getChildren(id);
        
        children.forEach(function(child){
            queue.push(child);
            getRecursive(child._id);
        });
    };
    
    //--
    var getChildren = function (id) {
        return searchDoc({ "parent": id,
                           "operations": {$elemMatch: { $eq: "view" }} });
    };
    
    //----------------MAIN----------------
    var roots = searchDoc({ "parent": null,
                            "isFolder": true,
                            "operations": {$elemMatch: { $eq: "view" }} });
                           
    roots.forEach(function(rootItem){
        queue.push(rootItem);
        getRecursive(rootItem._id);
    });
        
    return queue;
}