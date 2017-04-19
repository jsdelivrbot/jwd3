$(document).ready(function () {
    var noteGridName = 'noteGrid';
    var rowidBuf;
    var docContainerName = 'docContainer';

    //GRID
    var $message = $("#message");
    $('#' + noteGridName).jqGrid({
        caption: 'journal',
        url: '/api/protected/journal',
        editurl: '/api/protected/journal',
        datatype: 'json',
        colNames: ['_id', 'note'],
        colModel: [{ name: '_id', width: 200, editable: false, key: true, hidden: true },
                   { name: 'note', width: 400, editable: true, align: 'right'}],
        rowNum: 20,
        rowList: [10, 20, 30],
        height: 'auto',
        pager: '#notePager',
        viewrecords: true,
        reloadAfterSubmit: true,
        loadComplete: function () {
            //$message.html('grid load complete');
        },
        loadError: function (jqXHR, textStatus, errorThrown) {
            $message.html('http status code: ' + jqXHR.status + '\n' + 'status: ' + textStatus + '\n' + 'error: ' + errorThrown);
        },
        beforeSelectRow: function (rowid) {
            var rowData = $("#" + noteGridName).getRowData(rowid);
            return true;
        },
        ondblClickRow: function () {
            var rowId = $("#" + noteGridName).getGridParam('selrow');
            gridDoubleClick(rowId);
        }
    });

    $('#' + noteGridName).jqGrid('navGrid', '#notePager', { edit: true, add: true, del: true, search: false });

    //DOC
    var gridDoubleClick = function (rowId) {
        var note = $("#" + noteGridName).jqGrid('getCell', rowId, 'note');

        $.ajax({
            type: "GET",
            dataType: "JSON",
            url: "/api/protected/journal_data",
            data: rowId,
            success: function (answer, textStatus, jqXHR) {
                $('#docName').html('Показан элемент: ' + note);
                $('#' + docContainerName).html(answer[0].data);
            },
            error: function (jqXHR, textStatus, error) {
                console.info("err", error);
            }
        });

        
    };
});