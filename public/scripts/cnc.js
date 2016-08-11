$(document).ready(function () {
    var gridName = 'cncGrid';
    var gridPager = 'cncGridPager';

    //GRID
    $('#' + gridName).jqGrid({
        caption: 'CNC projects',
        url: '',// '/api/protected/journal',
        editurl: '/api/protected/journal',
        datatype: 'json',
        colNames: ['id', 'Проект', 'Дата начала', 'Дата окончания', 'Метод обработки', 'Коэф. среза', 'Обработано'],
        colModel: [{ name: 'id', width: 200, editable: false, key: true },
                   { name: 'name', width: 200, editable: true, align: 'right'},
                   { name: 'begin_date', width: 100, editable: false, editoptions: { data: true } },//fixed: true, hidden: false, formatter: editFormatter, cellattr: cellhint },
                   { name: 'end_date', width: 100, editable: false },
                   { name: 'cnc_movie_method', width: 100, editable: true, align: 'right', edittype: 'select', editoptions: {value: {'ByPixel': 'ByPixel', 'ByRow': 'ByRow'}}},
                   { name: 'image_cut_value', width: 100, editable: true, formatter: 'integer', editoptions: { minValue: 0, maxValue: 255, integer: true }},
                   { name: 'project_progress', width: 300, editable: false}],
        rowNum: 10,
        rowList: [10, 20, 30],
        height: 'auto',
        pager: '#' + gridPager,
        viewrecords: true,
        reloadAfterSubmit: true,
        loadComplete: function () {

        },
        loadError: function (jqXHR, textStatus, errorThrown) {
            
        }
    });

    $('#' + gridName).jqGrid('navGrid', '#' + gridPager, { edit: true, add: true, del: true, search: false },
        { height: 'auto', width: 'auto', closeAfterEdit: true, closeOnEscape: false, modal: true },//edit
        { height: 'auto', width: 'auto', closeAfterAdd: true, closeOnEscape: false, modal: true },//add
        { height: 'auto', width: 'auto', closeOnEscape: false, modal: true }//del
    );
});