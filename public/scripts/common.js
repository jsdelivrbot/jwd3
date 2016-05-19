$(document).ready(function () {
    $.ajaxSetup({
        xhrFields: {
            withCredentials: true
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


    //set email field
    $("#testBtn").bind("click", function () {

    });
});