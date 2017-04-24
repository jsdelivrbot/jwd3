$(document).ready(function () {
    var container = document.getElementById('viewerContainer');
    var docName = $('#docName').val();
    //docView(docName);

/*    $(window).on('hashchange', function () {
        console.info('hash change');
        var page = 1;
        if (window.location.href.indexOf("#") != -1) {
            var pageHash = window.location.href.split('#')[1];
            var patt = /page-\d+$/;

            //setPage(page);
            var res = patt.test(pageHash);
            if (res) {
                page = pageHash.split('-')[1];
            }
        }

        docView(docName, page);
    });*/

    docView(docName, 1);
});
