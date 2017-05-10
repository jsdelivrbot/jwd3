$(document).ready(function () {
    var noteGridName = 'noteGrid';
    var rowidBuf;
    var docContainerName = 'docContainer';

    //SOCKET
    var socket = io();
    socket.on('clients', function (msg) {
        $('#totalUsers').html('Пользователей онлайн: ' + msg.totalClients);
    });

    var refreshTree = function () {
        location.reload();
        /*$.ajax({
        type: "GET",
        //dataType: "JSON",
        url: "/doctree",
        success: function (data, textStatus, jqXHR) {
        //var doc = data.doc;
        //treeSettings(doc);
        },
        error: function (jqXHR, textStatus, error) {
        console.info("err", error);
        }
        });*/
    };

    var treeSettings = function () {
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
            var name = $(this).attr('data-fileName');
            var isFolder = $(this).attr('data-is-folder');

            if (isFolder == 'false')
                docView(name); //utils.js
        });

    };

    treeSettings();

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

                    //$('#docTree').remove();
                    refreshTree();
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

                    //$('#docTree').remove();
                    refreshTree();
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
            ajaxDel();

            /*setTimeout(function () {
                ajaxDel(function () {
                    swal("Файл удален");
                    refreshTree();
                });
            }, 500);*/
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
            error: function (xhr) {
                status('Error: ' + xhr.status);
            },
            success: function (response) {
                //$("#status").empty().text(response.toString());
                $("#message").empty().text(response.toString());


                //$('#docTree').remove();
                refreshTree();
            }
        });
        return false;
    });

    var h_hght = 500; //высота шапки
    var h_mrg = 3; //отступ когда шапка уже не видна

    $(function () {
        var elem = $('#pdfPage');
        var top = $(this).scrollTop();

        if (top > h_hght) {
            elem.css('top', h_mrg);
        }

        $(window).scroll(_.throttle(function () {
            //var rect = document.getElementById('pdfDiv').getBoundingClientRect();
            top = $(this).scrollTop();

            if (top + h_mrg < h_hght) {
                elem.css('top', (h_hght - top));
            } else {
                elem.css('top', h_mrg);
            }
        }, 160));
    });
});