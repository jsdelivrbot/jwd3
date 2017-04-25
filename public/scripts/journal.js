$(document).ready(function () {
    var noteGridName = 'noteGrid';
    var rowidBuf;
    var docContainerName = 'docContainer';

    var loadDocData = function () {
        $.ajax({
            type: "POST",
            dataType: "JSON",
            url: "/api/doc",
            success: function (data, textStatus, jqXHR) {
                var doc = data.doc;
                treeSettings(doc);
            },
            error: function (jqXHR, textStatus, error) {
                console.info("err", error);
            }
        });
    };

    loadDocData();

    var fillTree = function (doc) {
        var tableText = '<table id="docTree">';
        tableText += '<thead><tr>';
        tableText += '<th>Имя</th>';
        tableText += '<th>Файл</th>';
        tableText += '<th style="display: none">Имя файла в базе</th>';
        tableText += '</tr></thead>';

        var bodytext = '<tbody>';
        var tmp = "";

        for (var x = 0; x < doc.length; x++) {
            bodytext += '<tr data-tt-id="' + doc[x]._id + '" data-tt-parent-id="' + doc[x].parent_id + '">';
            bodytext += '<td>' + doc[x].name + '</td>';

            tmp = (doc[x].fileName === undefined) ? "" : ' href="' + doc[x].fileName + '"';

            bodytext += '<td><a' + tmp + '>' + doc[x].originalFileName + '</a></td>';
            bodytext += '<td class="fileName" style="display: none">' + doc[x].fileName + '</td>';
            bodytext += '</tr>'
        }
        bodytext += '</tbody></table>';
        tableText += bodytext;

        $('#doctreeContainer').append(tableText);
    };

    var treeSettings = function (doc) {
        fillTree(doc);

        //tree
        $('#docTree').treetable({
            expandable: true,
            initialState: 'expanded',
            onNodeExpand: function () {
                //
            }
        });

        // highlight selected row
        $('#docTree tbody').on('mousedown', 'tr', function () {
            $('.selected').not(this).removeClass('selected');
            $(this).toggleClass('selected');
        });

        //double click
        $('#docTree tr').dblclick(function () {
            var name = $(this).find('td.fileName').html();
            docView(name); //utils.js
        });

    };

    //DOC
    //upload(add file)
    $('#addDoc').bind('click', function () {
        var $tr = $('#docTree tr.selected');

        if ($tr.length == 0) {
            console.info('not selected');
            return;
        }

        var id = $tr.attr('data-tt-id');

        $('#parentId').val(id);
        $('#hiddenSelectFile').click();
    });

    //delete file
    $('#delDoc').bind('click', function () {
        var $tr = $('#docTree tr.selected');

        if ($tr.length == 0) {
            console.info('not selected');
            return;
        }

        var id = $tr.attr('data-tt-id');
        var fileName = $tr.find('td.fileName').html();

        var ajaxDel = function (cb) {
            $.ajax({
                type: "POST",
                dataType: "JSON",
                data: {
                    id: id,
                    fileName: fileName
                },
                url: "/api/protected/journal/del",
                success: function (data, textStatus, jqXHR) {
                    $("#status").empty().text(data.message);

                    $('#docTree').remove();
                    loadDocData();
                },
                error: function (jqXHR, textStatus, error) {
                    console.info("err", error);
                },
                complete: function () {
                    if (cb) {
                        cb();
                    }
                }
            });
        };

        swal({
            title: "Удалить файл?",
            //text: name,
            type: "info",
            showCancelButton: true,
            closeOnConfirm: false,
            showLoaderOnConfirm: true
        },
        function () {
            setTimeout(function () {
                ajaxDel(function () {
                    swal("Файл удален");
                });
            }, 500);
        });

        return;


    });

    $('#hiddenSelectFile').on('change', function () {
        $('#uploadForm').submit(); //......
        return false;
    });

    $('#uploadForm').submit(function () {
        $("#status").empty().text("File is uploading...");
        $(this).ajaxSubmit({
            error: function (xhr) {
                status('Error: ' + xhr.status);
            },
            success: function (response) {
                $("#status").empty().text(response.toString());

                $('#docTree').remove();
                loadDocData();
            }
        });
        return false;
    });


});