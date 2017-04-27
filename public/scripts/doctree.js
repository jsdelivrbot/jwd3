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
        tableText += '<th>Ссылка</th>';
        tableText += '<th>Дата загрузки</th>';
        tableText += '<th>Добавил</th>';
        tableText += '<th style="display: none">Имя файла в базе</th>';
        tableText += '</tr></thead>';

        var bodytext = '<tbody>';
        var tmp = '';
        var currentDoc;

        for (var x = 0; x < doc.length; x++) {
            currentDoc = doc[x];
            bodytext += '<tr data-tt-id="' + currentDoc._id +
                '" data-tt-parent-id="' + currentDoc.parent +
                '" data-originalname="' + currentDoc.originalFileName +
                '" data-is-folder="' + currentDoc.isFolder +
                '">';

            tmp = (currentDoc['isFolder'] === true) ? '<span class="folder"></span>' : '<span class="file"></span>';

            bodytext += '<td>' + tmp + currentDoc.name + '</span>' + '</td>';

            tmp = (currentDoc.fileName === undefined) ? "" : ' href="' + currentDoc.fileName + '"'; //filename
            tmp += '>';
            tmp += (currentDoc.fileName === undefined) ? "" : currentDoc.fileName;
            bodytext += '<td><a style="color: #b03b0f"' + tmp + '</a></td>';

            tmp = (currentDoc.createDate === undefined) ? "" : convertDate(new Date(currentDoc.createDate)); //create_date
            bodytext += '<td><p>' + tmp + '</p></td>';

            tmp = (currentDoc.user === undefined || currentDoc.user === null) ? "" : currentDoc.user['email'];
            bodytext += '<td><p class="text-primary">' + tmp + '</p></td>';


            bodytext += '<td class="fileName" style="display: none">' + currentDoc.fileName + '</td>';
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
            var name = $(this).find('td.fileName').html(); //attr('data-is-folder'); // find('td.fileName').html();
            var isFolder = $(this).attr('data-is-folder');

            console.info(isFolder, ', ', name);
            if (isFolder == 'false')//name != "undefined" && name !== "")
                docView(name); //utils.js
        });

    };

    //DOC
    //upload(add file)
    $('#addDoc').bind('click', function () {
        var $tr = $('#docTree tr.selected');

        if ($tr.length == 0) {
            swal("Выберите ветку, куда добавлять файл");
            console.info('not selected');
            return;
        }

        var id = $tr.attr('data-tt-id');
        var isFolder = $tr.attr('data-is-folder');

        if (isFolder === "false") {
            swal('Выберите папку');
            return;
        }

        $('#parentId').val(id);
        $('#hiddenSelectFile').click();
    });

    //add folder
    $('#addFolderDoc').bind('click', function () {
        //TODO recursive del?
        var $tr = $('#docTree tr.selected');
        var isFolder = $tr.attr('data-is-folder');

        if (isFolder === "false") {
            swal('Выберите папку');
            return;
        }

        var addFolder = function (parent_id, name) {
            $.ajax({
                type: "POST",
                dataType: "JSON",
                data: {
                    parent_id: parent_id,
                    name: name
                },
                url: "/api/protected/journal/add_folder",
                success: function (data, textStatus, jqXHR) {
                    //$("#status").empty().text(data.message);
                    $("#message").html(data.message);

                    $('#docTree').remove();
                    loadDocData();
                },
                error: function (jqXHR, textStatus, error) {
                    console.info("err", error);
                }
            });
        }

        if ($tr.length == 0) {
            console.info('not selected');
            swal("Выберите куда добавлять");
            return;
        };

        swal({
            title: "Название папки",
            //text: "Write something interesting:",
            type: "input",
            showCancelButton: true,
            closeOnConfirm: true,
            animation: "slide-from-top",
            inputPlaceholder: "Название папки"
        },
        function (inputValue) {
            if (inputValue === false)
                return false;

            if (inputValue === "") {
                swal.showInputError("Введите название папки");
                return false;
            };

            var parent_id = $tr.attr('data-tt-id');
            addFolder(parent_id, inputValue);
        });

        return false;
    });

    //delete file
    $('#delDoc').bind('click', function () {
        var $tr = $('#docTree tr.selected');

        if ($tr.length == 0) {
            console.info('not selected');
            swal("Выберите файл");
            return;
        }

        var id = $tr.attr('data-tt-id');
        var fileName = $tr.find('td.fileName').html();

        var children = $('#docTree').find('tr[data-tt-parent-id="' + id + '"]');
        if (children.length !== 0) {
            swal('Сначала удалите все вложенные файлы');
            return;
        }

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
                    $("#message").html(data.message);
                    //$("#status").empty().text(data.message);

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

    //download
    $('#downloadDoc').bind('click', function () {
        var $tr = $('#docTree tr.selected');

        if ($tr.length == 0) {
            console.info('not selected');
            swal("Выберите файл");
            return;
        }

        var originalname = $tr.attr('data-originalname');

        var fileName = $tr.find('td.fileName').html();

        $.fileDownload('/uploads/' + fileName);

        return false;
        //window.location.href = '/uploads/' + fileName;
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