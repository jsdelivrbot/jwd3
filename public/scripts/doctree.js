$(document).ready(function () {
    var noteGridName = 'noteGrid';
    var rowidBuf;
    var docContainerName = 'docContainer';

    //SOCKET
    /*var socket = io();
    socket.on('clients', function (msg) {
        $('#totalUsers').html('Пользователей онлайн: ' + msg.totalClients);
    });*/

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
        tableText += '<th>Доп.</th>';
        tableText += '<th>operations</th>';
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
                '" data-operations="' + currentDoc.operations +
                '">';

            //filename
            tmp = (currentDoc['isFolder'] === true) ? '<span class="folder"></span>' : 
                  (currentDoc['journalType'] == 0) ? '<span class="file"></span>' : 
                  (currentDoc['journalType'] == 1) ? '<span class="archive"></span>' : '';
            bodytext += '<td>' + tmp + currentDoc.name + '</span>' + '</td>';

            //size
            tmp = (currentDoc.fileName === undefined) ? "" : (parseInt(currentDoc.size) / 1024 / 1024).toFixed(2); //MB
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

            //note
            tmp = (currentDoc.note === undefined) ? "" : currentDoc.note;
            bodytext += '<td><p>' + tmp + '</p></td>';

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
            var journalType = $(this).attr('data-journaltype');

            if (isFolder == 'true' || journalType == 1)//journalType(0-doc, 1-log)
                return;

            docView(name); //utils.js
        });
    };

    //DOC
    //upload(add file)
    $('#addDoc').bind('click', function () {
        var $tr = $('#docTree tr.selected');

        if ($tr.length == 0) {
            console.info('not selected');
            swal("Выберите ветку, куда добавлять файл");
            return;
        }

        var id = $tr.attr('data-tt-id');
        var isFolder = $tr.attr('data-isfolder');
        var operations = $tr.attr('data-operations');
        var opers = operations.split(',');

        if (opers.indexOf('add') === -1) {
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
        var operations = $tr.attr('data-operations');
        var opers = operations.split(',');

        if (opers.indexOf('add') === -1) {
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
                    $("#message").html(data.message);

                    if (!data.success) {
                        return;
                    }

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
            //text: "",
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
        var fileName = $tr.attr('data-filename');
        var operations = $tr.attr('data-operations');
        var opers = operations.split(',');


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
                    $("#message").html(data.message);

                    if (!data.success) {
                        return;
                    }

                    //reload tree
                    $('#docTree').remove();
                    loadDocData();
                },
                error: function (jqXHR, textStatus, error) {
                    console.info("err", error);
                }
            });
        };

        if (opers.indexOf('edit') === -1) {
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
        var operations = $tr.attr('data-operations');
        var opers = operations.split(',');

        if (opers.indexOf('del') === -1) {
            swal('Нельзя удалить');
            return;
        }


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
                    if (!data.success) {
                        return;
                    }

                    $('#docTree').remove();
                    loadDocData();

                    if (cb) {
                        cb();
                    }
                },
                error: function (jqXHR, textStatus, error) {
                    console.info("err", error);
                    swal("Произошла ошибка при удалении");
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
            }, 200);
        });
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
        $(this).ajaxSubmit({
            headers: {
                oper: $('#fileOper').val(),
                fileName: $('#fileName').val()
            },
            error: function (xhr) {
                status('Error: ' + xhr.status);
            },
            success: function (data) {
                $("#message").html(data.message);

                if (!data.success) {
                    return;
                }

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