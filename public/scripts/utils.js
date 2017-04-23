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

                //setupAnnotations(page, viewport, canvas, $('.annotationLayer'));
            });
        }, function (reason) {
            // PDF loading error
            console.error(reason);

            var canvas = document.getElementById('pdfCanvas');
            canvas.height = 0;
            canvas.width = 0;
        });
    };
//};