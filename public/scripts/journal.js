$(document).ready(function () {
    var noteGridName = 'noteGrid';
    var rowidBuf;
    //SOCKET
    var socket = io();

    //GRID
    var $message = $("#message");
    $('#' + noteGridName).jqGrid({
        caption: 'journal',
        url: '/api/protected/journal',
        editurl: '/api/protected/journal',
        datatype: 'json',
        colNames: ['_id', 'note', 'editing_img', 'f_editing'],
        colModel: [{ name: '_id', width: 200, editable: false, key: true },
                   { name: 'note', width: 400, editable: true, align: 'right'},
                   { name: 'editing', width: 70, editable: false, fixed: true, hidden: false, formatter: editFormatter, cellattr: cellhint },
                   { name: 'f_editing', width: 45, editable: false }],
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
        beforeSelectRow: function(rowid) {
            var rowData = $("#" + noteGridName).getRowData(rowid);
            if(rowData['f_editing'] === 'true') {
                $("#edit_" + noteGridName).addClass('ui-state-disabled');
                $("#add_" + noteGridName).addClass('ui-state-disabled');
                $("#del_" + noteGridName).addClass('ui-state-disabled');
            } else {
                $("#edit_" + noteGridName).removeClass('ui-state-disabled');
                $("#add_" + noteGridName).removeClass('ui-state-disabled');
                $("#del_" + noteGridName).removeClass('ui-state-disabled');
            }
            
            return true;
        }
    });

    function reload(result) {
        $("#" + noteGridName).trigger("reloadGrid");
    }

    function editFormatter(cellvalue, options, rowObject) {
        var out = '';

        if(rowObject.f_editing == true) { 
            out = "<img src='/images/important.png'>"; 
        }
        if(rowObject.f_editing == false) { 
            out = "<img src='/images/ready.png'>"; 
        }

        return out;
    }

    function cellhint(cellvalue, options, rowObject){
        if(rowObject.f_editing == true) { out = ' title="cell in editing mode!"';}
        else { out = ' title="ready to editing"'; }

        return out;
    };

    $('#' + noteGridName).jqGrid('navGrid', '#notePager', { edit: true, add: true, del: true, search: false },
    //edit
    {
        height: 'auto', width: 'auto', closeAfterEdit: true, closeOnEscape: false, modal: true,
        afterSubmit: function (resp, postdata) { $message.html(resp.responseText); return [true, "", null]; },
        beforeShowForm: function ($form) { beforeEditingGrid($form, 'edit') },
        onClose: function ($form) { afterEditingGrid($form, 'edit') }
    },
    //add
    {
        height: 'auto', width: 'auto', closeAfterAdd: true, closeOnEscape: false, modal: true,
        afterSubmit: function (resp, postdata) { $message.html(resp.responseText); return [true, "", null]; }
    },
    //del
    {
        height: 'auto', width: 'auto', closeOnEscape: false, modal: true,
        afterSubmit: function (resp, postdata) { $message.html(resp.responseText); return [true, "", null]; },
        beforeShowForm: function ($form) { beforeEditingGrid($form, 'del'); },
        onClose: function ($form) { afterEditingGrid($form, 'del') }
    });


    var beforeEditingGrid = function ($form, oper) {
        var rowid = $("#" + noteGridName).jqGrid('getGridParam', 'selrow');
        rowidBuf = rowid;
        socket.emit('beginNoteEditing', {rowid: rowid, oper: oper});
    }

    var afterEditingGrid = function ($form, oper) {
        //var rowid = $("#" + noteGridName).jqGrid('getGridParam', 'selrow');
        socket.emit('endNoteEditing', {rowid: rowidBuf, oper: oper});

        //if (oper === 'edit') {
        //    console.info('rowidBuf', rowidBuf);
        //    //$('#' + noteGridName).jqGrid('setSelection', rowidBuf, true);
        //    $('#' + noteGridName).jqGrid('setSelection', '56ef72d87519bc0000000001');
        //    
        //}
    }


    //test
    //$('#testBtn').bind('click', function () {
    //    var rowid = $("#" + noteGridName).jqGrid('getGridParam', 'selrow');
    //    socket.emit('beginNoteEditing', rowid);
    //});
    //$('#testBtn2').bind('click', function () {
    //    var rowid = $("#" + noteGridName).jqGrid('getGridParam', 'selrow');
    //    socket.emit('endNoteEditing', rowid);
    //});


    //receive message from server
    socket.on('srvmesBeginNoteEditing', function (msg) {
        $("#" + noteGridName).trigger("reloadGrid");
    });

    socket.on('srvmesEndNoteEditing', function (msg) {
        $("#" + noteGridName).trigger("reloadGrid");

        setTimeout(function(){
            $('#' + noteGridName).jqGrid('setSelection', rowidBuf);
        }, 100);
    });
});