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

    //treeSettings(doc);
    loadDocData();

    var fillTree = function (doc) {
        var tableText = '<table id="docTree">';
        tableText += '<thead><tr>';
        tableText += '<th>Имя</th>';
        tableText += '<th>Файл</th>';
        tableText += '<th style="display: none">Имя файла в базе</th>';
        tableText += '</tr></thead>';

        var bodytext = '<tbody>';

        bodytext += '<tr data-tt-id="000000000000000000000001">';
        bodytext += '<td>root</td>';
        bodytext += '<td></td>';
        bodytext += '<td></td>';
        bodytext += '</tr>';

        for (var x = 0; x < doc.length; x++) {
            bodytext += '<tr data-tt-id="' + doc[x]._id + '" data-tt-parent-id="' + doc[x].parent_id + '">';
            bodytext += '<td>' + doc[x].name + '</td>';
            bodytext += '<td>' + doc[x].originalFileName + '</td>';
            bodytext += '<td class="fileName" style="display: none">' + doc[x].fileName + '</td>';
            bodytext += '</tr>'
        }
        bodytext += '</tbody></table>';
        tableText += bodytext;

        $('#doctreeContainer').after(tableText);
        //$('#docTree thead').after(tableText);
    };

    var treeSettings = function (doc) {
        fillTree(doc);

        //tree
        $('#docTree').treetable({
            expandable: true,
            initialState: 'expanded'
        });

        // highlight selected row
        $('#docTree tbody').on('mousedown', 'tr', function () {
            $('.selected').not(this).removeClass('selected');
            $(this).toggleClass('selected');
        });

        //double click
        $('#docTree tr').dblclick(function () {
            var name = $(this).find('td.fileName').html();
            docView(name);
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
        console.info(', ', id, ',   ', fileName);

        /*$.ajax({
        type: "POST",
        dataType: "JSON",
        data: {
        id: id
        },
        url: "/api/protected/journal/del",
        success: function (data, textStatus, jqXHR) {
        console.info('del: ', data);
        },
        error: function (jqXHR, textStatus, error) {
        console.info("err", error);
        }
        });*/

        //$('#docTree tbody').remove();
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

                $('#docTree tbody').remove();
                loadDocData();
            }
        });
        return false;
    });


});