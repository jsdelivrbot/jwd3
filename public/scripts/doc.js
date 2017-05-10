$(document).ready(function () {
    //var container = document.getElementById('viewerContainer');
    var docName = $('#docName').val();


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

    docView(docName);
});
