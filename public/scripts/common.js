$(document).ready(function () {
    $.ajaxSetup({
        xhrFields: {
            withCredentials: true
        },
        complete: function () {
            setLoginName(); //set login name on layout
        }
    });

    var $message = $("#message");

    //register
    $("#registerBtn").bind("click", function () {
        var login = $("#login").val();
        var password = $("#password").val();
        var confirmPassword = $("#confirmPassword").val();
        //var csrftoken = $("#csrftoken").val();

        var data = {
            login: login,
            password: password,
            confirmPassword: confirmPassword
        };

        //setCSRFToken(csrftoken);

        $.ajax({
            type: "POST",
            dataType: "JSON",
            url: "/api/register",
            data: data,
            success: function (data, textStatus, jqXHR) {
                //console.info("success register");
                $message.html(data.message);
                //if (supportHtml5Storage && data.token) {
                //    localStorage.setItem("token", data.token);
                //}
            },
            error: function (jqXHR, textStatus, error) {
                console.info("err", error);
            }
        });
    });

    //login
    $("#loginBtn").bind("click", function () {
        var login = $("#login").val();
        var password = $("#password").val();
        //var csrftoken = $("#csrftoken").val();

        var data = {
            login: login,
            password: password
        };

        //setCSRFToken(csrftoken);

        $.ajax({
            type: "POST",
            dataType: "JSON",
            url: "/api/login",
            data: data,
            success: function (data, textStatus, jqXHR) {
                //console.info("login success");
                $message.html(data.message);
                //if (supportHtml5Storage && data.token) {
                //    localStorage.setItem("token", data.token);
                //}
            },
            error: function (jqXHR, textStatus, error) {
                console.info("err", error);
            }
        });
    });

    $("#password").on("keydown", function (event) {
        if (event.which == 13)
            $("#loginBtn").click();
    });

    //logout
    $("#logoutBtn").bind("click", function () {
        //var csrftoken = $("#csrftoken").val();
        //setCSRFToken(csrftoken);
        $.ajax({
            type: "POST",
            dataType: "JSON",
            url: "/api/logout",
            success: function (data, textStatus, jqXHR) {
                //console.info("logout success");
                $message.html(data.message + "\n" + "redirect after 3 seconds...");
                setTimeout(function () {
                    window.location.href = "/";
                }, 3000);

                //if (supportHtml5Storage && data.token) {
                //    localStorage.removeItem("token");
                //}
            },
            error: function (jqXHR, textStatus, error) {
                console.info("err", error);
            }
        });
    });


    function parseJwt(token) {
        var base64Url = token.split('.')[1];
        var base64 = base64Url.replace('-', '+').replace('_', '/');
        return JSON.parse(window.atob(base64));
    };

    function getCookie(name) {
        var value = "; " + document.cookie;
        var parts = value.split("; " + name + "=");
        if (parts.length == 2)
            return parts.pop().split(";").shift();
    }

    var setLoginName = function () {
        var token = getCookie('token');
        var parsedToken = parseJwt(token);
        var email = parsedToken.email;
        var text = (email === undefined) ? '' : 'Вход выполнен, ' + email;

        $('#loggedUser').html(text);
    };

    //set name
    setLoginName();
});