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
    }
//};