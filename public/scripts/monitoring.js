$(document).ready(function () {
    var noteGridName = 'scanerGrid';
    var noteGridPager = 'scanerPager';

    var rowidBuf;
    //SOCKET
    var socket = io();

    //GRID
    var dateFormatter = function (cellvalue, options, rowObject) {
        var fmtDate = new Date(cellvalue);
        return "<p class='text-danger'>" + convertDate(fmtDate) + "</p>";
    }

    var uuidFormatter = function (cellvalue, options, rowObject) {
        console.info(cellvalue);
        return cellvalue['ferry'];
    }

    var timeDiffFormatter = function (cellvalue, options, rowObject) {
        var diffInMinutes = Math.ceil(cellvalue);
        return diffInMinutes;
    }

    var timeWarningFormatter = function (cellvalue, options, rowObject) {
        var diffInMinutes = Math.ceil(cellvalue);
        var warning = (cellvalue > 0) ? 'ok ' : 'bad ';
        return warning + diffInMinutes;
    }

    $('#' + noteGridName).jqGrid({
        caption: 'scaner',
        url: '/api/scaner_data',
        mtype: 'POST',
        datatype: 'json',
        ignoreCase: true,
        colNames: ['_id', 'registerDate', 'timeDiff(minutes)', 'timeWarningMinutes', 'uuid', 'ferry', 'sn'],
        colModel: [{ name: '_id', width: 200, hidden: true, editable: false, key: true },
                   { name: 'registerDate', width: 200, editable: false, align: 'right', formatter: dateFormatter },
                   { name: 'timeDiff', width: 200, editable: false, align: 'right', formatter: timeDiffFormatter },
                   { name: 'timeDiffIsWarning', width: 200, editable: false, align: 'right', formatter: timeWarningFormatter },
                   { name: 'uuid', width: 200, editable: false, align: 'right' },
                   { name: 'ferry', width: 200, editable: false, align: 'right' },
                   { name: 'sn', width: 200, editable: false, align: 'right'}],
        rowNum: 20,
        rowList: [10, 20, 30],
        height: 'auto',
        pager: '#' + noteGridPager
    });

    function reloadGrid() {
        var grid = $('#' + noteGridName);

        grid.trigger("reloadGrid", [{ current: true}]);
    }

    $('#' + noteGridName).jqGrid('navGrid', '#' + noteGridPager, { edit: false, add: false, del: false, search: false });

    socket.on('updatescanerinfo', function (msg) {
        $('#message').html(convertDate(new Date()));

        reloadGrid();

        //console.info('>>>', msg);
    });


});


 