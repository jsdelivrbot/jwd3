$(document).ready(function () {
    var noteGridName = 'noteGrid';
    var rowidBuf;
    var docContainerName = 'docContainer';

    //SOCKET
    var socket = io();
    socket.on('clients', function (msg) {
        $('#totalUsers').html('Пользователей онлайн: ' + msg.totalClients);
    });

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
        tableText += '<th>Размер(MB)</th>';
        tableText += '<th>Ссылка</th>';
        tableText += '<th>Дата загрузки</th>';
        tableText += '<th>Добавил</th>';
        tableText += '<th>Дом. страница</th>';
        tableText += '<th>operation</th>';
        tableText += '</tr></thead>';

        var bodytext = '<tbody>';
        var tmp = '';
        var currentDoc;

        for (var x = 0; x < doc.length; x++) {
            currentDoc = doc[x];

            bodytext += '<tr data-tt-id="' + currentDoc._id +
                '" data-tt-parent-id="' + currentDoc.parent +
                '" data-originalname="' + currentDoc.originalFileName +
                '" data-isfolder="' + currentDoc.isFolder +
                '" data-filename="' + currentDoc.fileName +
                '" data-journaltype="' + currentDoc.journalType +
                '" data-isreadonly="' + currentDoc.isReadonly +
                '">';

            //filename
            tmp = (currentDoc['isFolder'] === true) ? '<span class="folder"></span>' : '<span class="file"></span>';
            bodytext += '<td>' + tmp + currentDoc.name + '</span>' + '</td>';

            //size
            //console.info('size=', currentDoc.size);
            tmp = (currentDoc.fileName === undefined) ? "" : (parseInt(currentDoc.size) / 1024 / 1024).toFixed(1); //MB
            bodytext += '<td>' + tmp + '</td>';

            //href
            tmp = (currentDoc.fileName === undefined || currentDoc.journalType === 1) ? "" : ' href="' + currentDoc.fileName + '"'; //filename
            tmp += '>';
            tmp += (currentDoc.fileName === undefined || currentDoc.journalType === 1) ? "" : currentDoc.fileName;
            bodytext += '<td><a style="color: #b03b0f"' + tmp + '</a></td>'; //href

            //create date
            tmp = (currentDoc.createDate === undefined) ? "" : convertDate(new Date(currentDoc.createDate));
            bodytext += '<td><p>' + tmp + '</p></td>';

            //email
            tmp = (currentDoc.user === undefined || currentDoc.user === null || currentDoc.user.length === 0) ? "" : currentDoc.user[0]['email'];
            bodytext += '<td><p class="text-danger">' + tmp + '</p></td>';

            //is home
            bodytext += '<td><input type="checkbox" disabled="disabled"' + ((currentDoc.isHome == true) ? ' checked="checked"' : " ") + '/></td>';

            //operation
            tmp = (currentDoc.operations === undefined) ? "" : currentDoc.operations;
            bodytext += '<td><p>' + tmp + '</p></td>';

            //end tr
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
            //initialState: 'collapsed',
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
            var name = $(this).attr('data-fileName');
            var isFolder = $(this).attr('data-isfolder');

            if (isFolder == 'false')
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
        var isFolder = $tr.attr('data-isfolder');
        var isReadonly = $tr.attr('data-isreadonly');

        if (isReadonly === "true") {
            swal('Нельзя добавить');
            return;
        }

        if (isFolder === "false") {
            swal('Выберите папку');
            return;
        }

        $('#parentId').val(id);
        $('#fileName').val('');
        $('#fileOper').val('add');
        $('#hiddenSelectFile').click();
    });

    //add folder
    $('#addFolderDoc').bind('click', function () {
        //TODO recursive del?
        var $tr = $('#docTree tr.selected');
        var isFolder = $tr.attr('data-isfolder');
        var isReadonly = $tr.attr('data-isreadonly');

        if (isReadonly === "true") {
            swal('Нельзя добавить');
            return;
        }

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

    //edit file/folder
    $('#editDoc').bind('click', function () {
        var $tr = $('#docTree tr.selected');

        if ($tr.length == 0) {
            swal("Выберите файл");
            console.info('not selected');
            return;
        }

        var id = $tr.attr('data-tt-id');
        var isFolder = $tr.attr('data-isfolder');
        var isReadonly = $tr.attr('data-isreadonly');
        var fileName = $tr.attr('data-filename');

        //folder
        var editFolder = function (id, newName) {
            $.ajax({
                type: "POST",
                dataType: "JSON",
                data: {
                    id: id,
                    name: newName
                },
                url: "/api/protected/journal/edit_folder",
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
        };

        if (isReadonly === "true") {
            swal('Нельзя редактировать');
            return;
        }

        if (isFolder === "true") {
            swal({
                title: "Название папки",
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
                editFolder(id, inputValue);
            });
            return;
        }

        //file
        $('#parentId').val(id);
        $('#fileOper').val('edit');
        $('#fileName').val(fileName);
        $('#hiddenSelectFile').click();
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
        var fileName = $tr.attr('data-filename');
        var isReadonly = $tr.attr('data-isreadonly');

        //if (isReadonly === 'true') {
        //    swal('Нельзя удалить');
        //    return;
        //}


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
        var isFolder = $tr.attr('data-isfolder');

        if ($tr.length == 0 || isFolder === "true") {
            swal("Выберите файл");
            return;
        }

        var originalname = $tr.attr('data-originalname');
        var fileName = $tr.attr('data-fileName');

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
            headers: {
                oper: $('#fileOper').val(),
                fileName: $('#fileName').val()
            },
            error: function (xhr) {
                status('Error: ' + xhr.status);
            },
            success: function (response) {
                $("#message").empty().text(response.toString());


                $('#docTree').remove();
                loadDocData();
            }
        });
        return false;
    });

    $(function () {
        var elem = $('#pdfPage');
        var rect;

        $(window).scroll(_.throttle(function () {
            rect = document.getElementById('pdfDiv').getBoundingClientRect();

            if (rect.top < 0) {
                elem.css('top', 5);
                elem.css('position', 'fixed');
            } else {
                elem.css('position', 'initial');
            }
        }, 160));
    });
});