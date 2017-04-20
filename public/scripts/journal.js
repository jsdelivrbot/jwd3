$(document).ready(function () {
    var noteGridName = 'noteGrid';
    var rowidBuf;
    var docContainerName = 'docContainer';

    //TREE
    $('#docTree').treetable({ expandable: true });

    // Highlight selected row
    $('#docTree tbody').on('mousedown', 'tr', function () {
        $('.selected').not(this).removeClass('selected');
        $(this).toggleClass('selected');
    });


    $('#docTree tr').dblclick(function () {
        var id = $(this).attr('data-tt-id');
        treeDoubleClick(id);
    })

    //GRID
    var $message = $("#message");
    $('#' + noteGridName).jqGrid({
        caption: 'journal',
        url: '/api/protected/journal',
        editurl: '/api/protected/journal',
        datatype: 'json',
        colNames: ['_id', 'note', 'data'],
        colModel: [{ name: '_id', width: 200, editable: false, key: true, hidden: true },
                   { name: 'note', width: 400, editable: true, align: 'center' },
                   { name: 'data', width: 400, editable: true, align: 'right', hidden: true}],
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
    var treeDoubleClick = function (rowId) {
        var note = $("#" + noteGridName).jqGrid('getCell', rowId, 'note');

        //$('#' + docContainerName).html();
        var data = {
            id: rowId
        };

        $.ajax({
            type: "GET",
            dataType: "JSON",
            url: "/api/protected/journal_data",
            data: data,
            success: function (answer, textStatus, jqXHR) {
                //$('#docName').html('Показан документ: ' + note);

                var url = '/uploads/' + answer.data;

                //PDFJS.workerSrc = '//mozilla.github.io/pdf.js/build/pdf.worker.js';
                PDFJS.workerSrc = '/libs/pdfjs/build/pdf.worker.js';

                // Asynchronous download of PDF
                var loadingTask = PDFJS.getDocument(url);
                loadingTask.promise.then(function (pdf) {
                    //console.log('PDF loaded');

                    // Fetch the first page
                    var pageNumber = 1;
                    pdf.getPage(pageNumber).then(function (page) {
                        //console.log('Page loaded');

                        var scale = 1.5;
                        var viewport = page.getViewport(scale);

                        // Prepare canvas using PDF page dimensions
                        var canvas = document.getElementById('pdfCanvas');
                        var context = canvas.getContext('2d');
                        canvas.height = viewport.height;
                        canvas.width = viewport.width;

                        // Render PDF page into canvas context
                        var renderContext = {
                            canvasContext: context,
                            viewport: viewport
                        };

                        var renderTask = page.render(renderContext);
                        renderTask.then(function () {
                            //console.log('Page rendered');
                        });
                    });
                }, function (reason) {
                    // PDF loading error
                    console.error(reason);
                });
            },
            error: function (jqXHR, textStatus, error) {
                console.info("err", error);
            }
        });
    };
});