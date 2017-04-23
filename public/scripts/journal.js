$(document).ready(function () {
    var noteGridName = 'noteGrid';
    var rowidBuf;
    var docContainerName = 'docContainer';

    //LOAD DATA TO TREE
    var reloadTree = function (settings) {

    };

    var loadDocData = function () {
        $.ajax({
            type: "POST",
            dataType: "JSON",
            url: "/api/doc",
            success: function (data, textStatus, jqXHR) {
                var doc = data.doc;
                treeSettings(doc);
                //fillTree(doc);
            },
            error: function (jqXHR, textStatus, error) {
                console.info("err", error);
            }
        });
    };

    //treeSettings(doc);
    loadDocData();

    var fillTree = function (doc) {
        var text = '<tbody>';

        text += '<tr data-tt-id="000000000000000000000001">';
        text += '<td>root</td>';
        text += '<td></td>';
        text += '<td></td>';
        text += '</tr>';

        for (var x = 0; x < doc.length; x++) {
            text += '<tr data-tt-id="' + doc[x]._id + '" data-tt-parent-id="' + doc[x].parent_id + '">';
            text += '<td>' + doc[x].name + '</td>';
            text += '<td>' + doc[x].originalFileName + '</td>';
            text += '<td class="fileName" style="display: none">' + doc[x].fileName + '</td>';
            text += '</tr>'
        }
        text += '</tbody>';
        $('#docTree thead').after(text);
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
    

    function setupAnnotations(page, viewport, canvas, $annotationLayerDiv) {
        var canvasOffset = $(canvas).offset();
        var promise = page.getAnnotations().then(function (annotationsData) {
            viewport = viewport.clone({
            dontFlip: true
        });

        for (var i = 0; i < annotationsData.length; i++) {
            var data = annotationsData[i];
            var annotation = PDFJS.Annotation.fromData(data);
            if (!annotation || !annotation.hasHtml()) {
                continue;
            }

            var element = annotation.getHtmlElement(page.commonObjs);
            data = annotation.getData();
            var rect = data.rect;
            var view = page.view;

            rect = PDFJS.Util.normalizeRect([rect[0], view[3] - rect[1] + view[1], rect[2], view[3] - rect[3] + view[1]]);

            element.style.left = (canvasOffset.left + rect[0]) + 'px';
            element.style.top = (canvasOffset.top + rect[1]) + 'px';
            element.style.position = 'absolute';

            var transform = viewport.transform;
            var transformStr = 'matrix(' + transform.join(',') + ')';

            CustomStyle.setProp('transform', element, transformStr);

            var transformOriginStr = -rect[0] + 'px ' + -rect[1] + 'px';
            CustomStyle.setProp('transformOrigin', element, transformOriginStr);

            if (data.subtype === 'Link' && !data.url) {
            // In this example,  I do not handle the `Link` annotations without url.
            // If you want to handle those annotations, see `web/page_view.js`.
                continue;
            }

            $annotationLayerDiv.append(element);
        }
    });
    return promise;
  }

    //upload(add file)
    $('#addDoc').bind('click', function () {
        var $tr = $('#docTree tr.selected');

        if ($tr.length == 0) {
            console.info('not selected');
            return;
        }
        $('#parentId').val($tr.attr('data-tt-id'));
        $('#hiddenSelectFile').click();
    });

    //delete file
    $('#delDoc').bind('click', function () {
        var id = $('#docTree tr.selected').attr('data-tt-id');

        //var fileName = $('#docTree tr.selected').find('td.fileName').html();
        console.info(', ');

        if (!id || id == "") {
            console.info('not selected');
            return;
        }

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
            }
        });
        return false;
    });


});