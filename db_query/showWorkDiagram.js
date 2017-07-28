function(id) {
    var items = db.getCollection('scanerregistrations').find({scaner: id}).toArray();

    var labels = [];
    var series = [];
    var j = 0;


    for (var x=0; x<items.length; x++) {
        if(x === 0) {
            continue;
        }
        
        var diff = items[x].registerDate - items[x-1].registerDate;//ms
        var datePoint = dateFormat(items[x-1].registerDate);
        var val = (diff < 10*60*1000) ? 1 : 0;
        var len = series.length;
        
        
        if(len === 0) {
            labels.push(datePoint);
            series.push(val);
            continue;
        }
        
        
        if (series[len-1] !== val) {
            labels.push(datePoint);
            series.push(val);
        }
    }

    return {
        labels: labels,
        series: series
    };
}