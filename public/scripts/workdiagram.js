$(document).ready(function () {
    //datetimepicker
    jQuery.datetimepicker.setLocale('ru');

    $('#beginDate').datetimepicker({
        format: 'd.m.Y H:i',
        mask: true,
        value: new Date()
        //onShow: function (ct) {
        //    this.setOptions({
        //        maxDate: $('#endDate').val() ? $('#endDate').val() : false
        //    })
        //}
    }); //.val('12.01.2006 12:33');

    $('#endDate').datetimepicker({
        format: 'd.m.Y H:i',
        mask: true,
        value: new Date()
        //onShow: function (ct) {
        //    this.setOptions({
        //        minDate: $('#beginDate').val() ? $('#beginDate').val() : false
        //    })
        //}
    });

    //show work diagram
    var workDiagram = myparams.workdiagram;

    var showDiagram = function (data) {
        if (!data) {
            console.log('data is null');
            return;
        }

        var labels = data['labels']; // ['1', '2', '3', '4', '5', '6', '7', '8'];
        var series = [data['series']]; // [[1, 0, 0, 1, 1, 1, 0, 0]];

        var chart = new Chartist.Line('#' + workDiagram,
            {
                labels: labels,
                series: series
            },
            {
                fullWidth: false,
                showArea: true,
                lineSmooth: Chartist.Interpolation.step(),
                chartPadding: {
                    right: 100
                }
            }
        );
    };

    $('#showWorkDiagram').bind('click', function () {
        var grid = $('#' + myparams.noteGridName);

        var selRowId = grid.jqGrid('getGridParam', 'selrow');

        //if (selRowId === null) {
        //    swal("Выберите сканер");
        //    return false;
        //}

        var rowData = grid.getRowData(selRowId);
        var scaner_id = rowData['scaner_id'];
        var beginDate = $('#beginDate').datetimepicker('getValue');
        var endDate = $('#endDate').datetimepicker('getValue');
        var compareDiff = $('#compareDiff').val();

        //date - unix time
        var data = {
            scaner_id: scaner_id,
            beginDateUnix: (Date.parse(beginDate) / 1000),
            endDateUnix: (Date.parse(endDate) / 1000),
            compareDiff: parseInt(compareDiff) * 1000 * 60
        };

        $.ajax({
            type: "POST",
            data: data,
            dataType: "JSON",
            url: '/api/workdiagram',
            success: function (data, textStatus, jqXHR) {
                //console.info('income data=', data);
                showDiagram(data);
            },
            error: function (jqXHR, textStatus, error) {
                console.info("err", error);
            }
        });

        return false;
    });



    var $tooltip = $('<div class="tooltip tooltip-hidden"></div>').appendTo($('#' + workDiagram));
});