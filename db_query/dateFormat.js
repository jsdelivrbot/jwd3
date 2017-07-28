function(date) {
    var str = date.getDate() + '.' +
              (date.getMonth() + 1) + '.' +
              date.getFullYear() + ' ' +
              date.getHours() + ':' +
              date.getMinutes() + ':' +
              date.getSeconds();

    return str;
}