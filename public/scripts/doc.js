$(document).ready(function () {
    //var container = document.getElementById('viewerContainer');
    var docName = $('#docName').val();


    var h_hght = 200; // высота шапки
    var h_mrg = 10; // отступ когда шапка уже не видна

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

    docView(docName);
});
