function(scanerId, beginDateUnix, endDateUnix, compareDiff) {
    var id = (scanerId) ? ObjectId(scanerId) : null;
    var beginDate = (beginDateUnix) ? new Date(beginDateUnix * 1000) : ISODate('2017-07-28T00:00:00.000Z');//if null then minimum date
    var endDate = (endDateUnix) ? new Date(endDateUnix * 1000) : new Date();//if null then maximum date(now)
    var compareDiff = (compareDiff) ? compareDiff : 10*60*1000;
    
    var query = {
        registerDate: { $gte: beginDate, $lte: endDate }
    };
        
    if(id) {
        query['scaner'] = id;
    }
            
    var items = db.getCollection('scanerregistrations').find(query).toArray();
        
    
    var labels = [];
    var series = [];
    var j = 0;


    for (var x=0; x<items.length; x++) {
        if(x === 0) {
            continue;
        }
        
        var diff = items[x].registerDate - items[x-1].registerDate;//ms
        var datePoint = dateFormat(items[x-1].registerDate);
        var val = (diff < compareDiff) ? 1 : 0;
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