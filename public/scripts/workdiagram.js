$(document).ready(function () {
    var workDiagram = myparams.workdiagram;

    var showDiagram = function (data) {
        var labels = data['labels'];// ['1', '2', '3', '4', '5', '6', '7', '8'];
        var series = [data['series']];// [[1, 0, 0, 1, 1, 1, 0, 0]];

        var chart = new Chartist.Line('#' + workDiagram, 
            {
                labels: labels,
                series: series
            }, 
            {
                fullWidth: false,
                lineSmooth: Chartist.Interpolation.step(),
                chartPadding: {
                    right: 100
                }
            }
        );
    }

    //show work diagram
    $('#showWorkDiagram').bind('click', function () {
        var grid = $('#' + myparams.noteGridName);

        var selRowId = grid.jqGrid('getGridParam', 'selrow');

        if (selRowId === null) {
            swal("Выберите сканер");
            return false;
        }

        var rowData = grid.getRowData(selRowId);
        var scaner_id = rowData['scaner_id'];

        var data = {
            scaner_id: scaner_id
        };

        $.ajax({
            type: "POST",
            data: data,
            dataType: "JSON",
            url: '/api/workdiagram',
            success: function (data, textStatus, jqXHR) {
                //console.info(data);
                showDiagram(data);
            },
            error: function (jqXHR, textStatus, error) {
                console.info("err", error);
            }
        });
    });

    
});