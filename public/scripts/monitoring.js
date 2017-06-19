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
        var warningElement = "<div class='monitoring-warning'><b>CRITICAL</b></div>";
        var okElement = "<div class='monitoring-ok'><b>OK</b></div>";

        var warning = (cellvalue > 0) ? okElement : warningElement;
        return warning;
    }

    $('#' + noteGridName).jqGrid({
        caption: 'scaner',
        url: '/api/scaner_data',
        mtype: 'POST',
        datatype: 'json',
        ignoreCase: true,
        colNames: ['_id', 'last register date', 'timeDiff(minutes)', 'status', 'scaner uuid', 'ferry', 'scaner sn', 'ip4', 'mac', 'wifiname'],
        colModel: [{ name: '_id', width: 200, hidden: true, editable: false, key: true },
                   { name: 'registerDate', width: 200, editable: false, align: 'right', formatter: dateFormatter },
                   { name: 'timeDiff', width: 200, editable: false, align: 'right', formatter: timeDiffFormatter },
                   { name: 'status', width: 70, editable: false, align: 'right', formatter: timeWarningFormatter },
                   { name: 'uuid', width: 200, editable: false, align: 'right' },
                   { name: 'ferry', width: 100, editable: false, align: 'right' },
                   { name: 'sn', width: 200, editable: false, align: 'right' },
                   { name: 'ip4', width: 150, editable: false, align: 'right' },
                   { name: 'mac', width: 150, editable: false, align: 'right' },
                   { name: 'wifiname', width: 150, editable: false, align: 'right'}],
        rowNum: 20,
        rowList: [10, 20, 30],
        height: 'auto',
        pager: '#' + noteGridPager
    });

    var reloadGrid = function () {
        //console.info(new Date());
        var grid = $('#' + noteGridName);
        grid.trigger("reloadGrid", [{ current: true}]);
    }

    $('#' + noteGridName).jqGrid('navGrid', '#' + noteGridPager, { edit: false, add: false, del: false, search: false });

    /*socket.on('updatescanerinfo', function (msg) {
    //$('#message').html(convertDate(new Date()));
    //console.info('>>>', msg);

    reloadGrid();
    });*/

    //var relGrid
    setInterval(reloadGrid, 4000);


    //download
    $('#getScanerFile').bind('click', function () {
        var grid = $('#' + noteGridName);
        var selRowId = grid.jqGrid('getGridParam', 'selrow');

        if (selRowId === null) {
            swal("Выберите сканер");
            return false;
        }

        var rowData = grid.getRowData(selRowId);
        var data = {
            uuid: rowData.uuid,
            sn: rowData.sn,
            ferry: rowData.ferry,
            ip4: rowData.ip4,
            mac: rowData.mac
        };

        $.ajax({
            type: "POST",
            //dataType: "JSON",
            data: data,
            url: "/api/dl",
            success: function (data, textStatus, jqXHR) {
                swal('logs downloaded.', data);
            },
            error: function (jqXHR, textStatus, error) {
                console.info("err", error);
            }
        });

        return false;
    });

});


 