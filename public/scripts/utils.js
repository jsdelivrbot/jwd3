//var setCSRFToken = function (securityToken) {
    var csrfHeader = 'X-CSRF-Token';
    $.ajaxPrefilter(function (options, _, xhr) {
        if (!xhr.crossDomain) {
            xhr.setRequestHeader(csrfHeader, $("#csrftoken").val());// securityToken);
        }
    });

    //authorization
    $.ajaxSetup({
        beforeSend: function (xhr) {
            if (supportHtml5Storage()) {
                var token = localStorage.getItem("token");
                if (token) {
                    xhr.setRequestHeader("authorization", token);
                }
            }

            //xhr.withCredentials = true;
        }
    });

    function supportHtml5Storage() { 
        try{
            return "localStorage" in window && window["localStorage"] !== null;
        } catch(err){
            return false;
        }
    };

    function isNum(d) {
        var res = /^\d+$/.test(d);
        return res;
    };

    var docView = function (name) {
        if (!name || name === "") {
            return;
        }

        var url = '/uploads/' + name;
        PDFJS.workerSrc = '/libs/pdfjs/build/pdf.worker.js';
        // Asynchronous download of PDF
        var loadingTask = PDFJS.getDocument(url);
        loadingTask.promise.then(function (pdf) {
            var pageNumber = 1;
            pdf.getPage(pageNumber).then(function (page) {
                var scale = 1.5;
                var viewport = page.getViewport(scale);
                var canvas = document.getElementById('pdfCanvas');
                var context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                $('#docContainer').css("height", canvas.height + "px")
                                  .css("width", canvas.width + "px");

                // Render PDF page into canvas context
                var renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };

                var renderTask = page.render(renderContext);
                renderTask.then(function () {
                    //console.log('Page rendered');
                });

                setupAnnotations(page, viewport, canvas, $('.annotationLayer'));
            });
        }, function (reason) {
            // PDF loading error
            console.error(reason);

            var canvas = document.getElementById('pdfCanvas');
            canvas.height = 0;
            canvas.width = 0;
        });
    };


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
                rect = PDFJS.Util.normalizeRect([
                rect[0],
                view[3] - rect[1] + view[1],
                rect[2],
                view[3] - rect[3] + view[1]]);
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
                    // If you want to handle those links, see `web/page_view.js`.
                    continue;
                }
                $annotationLayerDiv.append(element);
            }
        });
        return promise;
    }
//};