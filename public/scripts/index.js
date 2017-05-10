$(document).ready(function () {
    var docName = $('#docName').val();

    if (docName && docName !== undefined && docName !== "") {
        docView(docName);
    }
});