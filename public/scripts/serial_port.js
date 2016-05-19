$(document).ready(function () {
    ( function () { 
        var WCF_ADDRESS = $("#wcfAddress").val();//http://localhost:45558
        

        //*************FUNCTIONS


        //***GET PORTS
        var refreshPorts = function(successCallback){
            var $portMessage = $("#statusMessage");

            $.ajax({
                type: 'GET',
                url: WCF_ADDRESS + "/Service.svc/GetPorts",
                dataType: "json",
                contentType: 'application/javascript',
                crossDomain: true,
                //cache: false,
                async: true,
                success: function (result) {
                    var ports = result['PortNames'];

                    if (!ports || ports.length == 0) {
                        $portMessage.html('no ports found');
                        return;
                    }

                    $portMessage.html("(" + ports.length + ") port(s) found");

                    var txt = "";
                    var chd
                    ports.forEach(function(item, i, arr){
                        chd = (i==0) ? "checked" : "";
                        txt += 
                        "<label>" +
                            "<input type='radio' name='serialport' value='" + item + "' " + chd +  " class='port-setting'/>" + 
                            item +
                        "</label> <br/>";
                    });
                    $("#serialPorts").empty();
                    $("#serialPorts").append(txt);

                    if(typeof successCallback === 'function') {
                        successCallback();
                    }
                },
                error: function (e) {
                    console.info('err in upl ', e);
                }
            });
        };
        var getPortsInt;
        var refreshPortsInt = function() {
            getPortsInt = setInterval(function(){
                refreshPorts();    
            }, 500);
        };

        //***GET CONNECTION STATUS
        var refreshConnStatus = function(){
            $.ajax({
                type: 'GET',
                url: WCF_ADDRESS + "/Service.svc/GetStatus",
                //data: {},
                dataType: 'json',
                contentType: 'application/javascript',
                crossDomain: true,
                //cache: false,
                async: true,
                success: function (result) {
                    console.info($.cache);

                    var isopen = result['IsPortOpen'];
                    setPortStatusCaption(isopen);
                    setSettingsEnable(isopen);
                },
                error: function (e) {
                    console.info('err in upl ', e);
                }
            });
        };
        var getConnStatusInt;
        var refreshStatusInt = function() {
            getConnStatusInt = setInterval(function(){
                refreshConnStatus();    
            }, 500);
        };

        //***GET PORT STATUS CAPTION
        var setPortStatusCaption = function(status){
            var $spopen = $('#spIsOpen');
            (status == true) ? $spopen.html('port is open') : $spopen.html('port is closed');
        };

        //***SET SETTINGS ENABLE
        var setSettingsEnable = function($el, status) {
            if(status == true) {
                $el.attr('disabled', true);
            } else {
                $el.attr('disabled', false);
            }
        };
        setSettingsEnable($('.port-setting, .cnc-setting'), false);

        //***CONNECT TO PORT
        var connectToPort = function(data) {
            $.ajax({
                type: 'POST',
                url: WCF_ADDRESS + "/Service.svc/Init",
                data: data,
                dataType: "json",
                contentType: 'application/javascript',
                crossDomain: true,
                cache: false,
                async: true,
                success: function (result) {
                    var isopen = result['IsPortOpen'];
                    setPortStatusCaption(isopen);

                    //setSettingsEnable($('#portSettings').find('input[type=radio]'), isopen);
                    setSettingsEnable($('.port-setting'), isopen);
                    setSettingsEnable($("#wcfAddress"), isopen);
                },
                error: function (e) {
                    console.info('err in upl ', e);
                }
            });
        };

        //***CONVERT IMAGE
        var $inpFile = $('#chooseFile');
        var $imageConvertValue = $('#imageConvertValue');
        $inpFile.removeAttr('value');
    
        function loadHtmlFile(input) {
            if (input.files && input.files[0]) {
                var reader = new FileReader();

                reader.onload = function (e) {
                    var img = new Image();
                    img.src = e.target.result;

                    //save image
                    if (supportHtml5Storage()) {
                        var obj = {
                            originalImage: e.target.result
                        };
                        localStorage.setItem('originalImage', JSON.stringify(obj));
                    }

                    img.onload = function() {
                        $('#originalImagePreview').attr('src', this.src);
                        $('#imageCharacteristics').html('width=' + this.width + ', height=' + this.height);
                    }
                }

                reader.readAsDataURL(input.files[0]);
            }
        }

        var ajaxLoadImage = function() {
            var imageConvertValue = $imageConvertValue.val();
            var fd = new FormData();
            var files = $inpFile[0].files;


            if (files.length > 0) {
                fd.append("OriginalImage", files[0]);
                fd.append("imageConvertValue", imageConvertValue);

                $.ajax({
                    url: WCF_ADDRESS + "/Service.svc/ConvertImage",
                    type: 'POST',
                    crossDomain: true,
                    cache: false,
                    data: fd,
                    contentType: false,
                    processData: false,
                    async: true,
                    success: function (data ) { 
                        var $bitmapImg = $('#bitmapImagePreview');
                        $bitmapImg.attr('src', 'data:image/png;base64,' + data);

                        //save converted image
                        if (supportHtml5Storage()) {
                            var obj = {
                                imageConvertValue: imageConvertValue,
                                convertedImageData: data
                            };
                            localStorage.setItem('convertedImage', JSON.stringify(obj));
                        }

                        //draw to canvas
                        drawImageToCanvas();
                    },
                    error: function (e) {
                        console.info('err in upl ', e);
                    }
                });
            }
        };

        //draw to canvas
        var drawImageToCanvas = function() {
            var bitmapImg = $('#bitmapImagePreview')[0];
            var w = bitmapImg.width;
            var h = bitmapImg.height;

            var canvas = $('#canvasImagePreview')[0];// document.getElementById('canvasImagePreview');
            var context = canvas.getContext('2d');
            canvas.width = w;
            canvas.height = h;

            context.drawImage(bitmapImg, 0, 0, w, h);//img
        };

        //draw made pixel
        var drawMadePixel = function(data) {
            var curX = data.X;
            var curY = data.Y;
            var curF = data.F;

            var canvas = document.getElementById('canvasImagePreview');
            var context = canvas.getContext('2d');

            //

            if (curF == 1)
                context.fillStyle = '#ff0000';
            else
                context.fillStyle = '#00ff00';

            context.fillRect(curX, curY, 1, 1);
        }
        
        //***INIT FROM STORAGE
        if (supportHtml5Storage()) {
            var portSettings = localStorage.getItem('portSettings');
            if (portSettings !== null) {
                try {
                    var data = JSON.parse(portSettings);

                    refreshPorts(function() {
                        connectToPort(data);    
                    });
                } catch(e) {
                    console.err(e);
                }
            }
        }
        
        //***SIGNALR
        $.getScript(WCF_ADDRESS + '/Scripts/jquery.signalR-2.2.0.js', function() {
            $.getScript(WCF_ADDRESS + '/signalr/hubs', function(d) {
                //$.connection.hub.logging = true;

                $.connection.hub.url = WCF_ADDRESS + '/signalr';
                var answerHub = $.connection.answerHub;

                //get CNC answer
                answerHub.client.sendAnswer = function(answer) {
                    drawMadePixel(answer);
                    console.info(JSON.stringify(answer));
                };

                //get port answer
                answerHub.client.sendPortAnswer = function(answer) {
                    console.info("port answer: ", answer);
                };

                //on user connected
                answerHub.client.onConnected = function(id) {
                    console.info('on connected, id=', id);
                };

                //on user disconnected
                answerHub.client.onDisconnected = function(id) {
                    console.info('on disconnected, id=', id);
                };

                //start
                $.connection.hub.start()
                .done(function() {
                    //console.info('connected');
                }).fail(function(err) {
                    console.info('err, ', err);
                });
            });
        });


        //***************EVENTS

        //***SHOW/HIDE LOGGING
        $('#setVisibleLogging').bind('click', function() {
            $('#logging').animate({
                'height': 'toggle'
            }, 500);
        });

        //***SET WCF ADDRESS ENABLE
        $("#setAddressEnable").bind("click", function () {
            $addr = $("#wcfAddress");

            if($addr.attr("readonly") == "readonly") {
                $addr.removeAttr("readonly");
            } else {
                $addr.attr("readonly", true);
            }

            $addr.focus();
        });


        //***REFRESH SERIAL PORTS
        $("#spRefresh").bind("click", function () {
            refreshPortsInt();
        });

        //***STOP REFRESH SERIAL PORTS
        $("#spStopRefresh").bind("click", function () {
            clearInterval(getPortsInt);
            clearInterval(getConnStatusInt);
        });

        //***CONNECT PORT
        $("#spConnect").bind("click", function () {
            var portType = $("input[name=porttype]:checked").val();
            var baundrate = $("input[name=baundrate]:checked").val();
            var parity = $("input[name=parity]:checked").val();
            var stopbits = $("input[name=stopbits]:checked").val();
            var databits = $("input[name=databits]:checked").val();
            var portName = $("input[name=serialport]:checked").val();

            if (portName == undefined || portName == "") {
                return;
            }

            var data = {
                portType: portType,
                portName: portName,
                baundrate: baundrate,
                parity: parity,
                stopbits: stopbits,
                databits: databits
            };

            //save port settings
            if (supportHtml5Storage()) {
                localStorage.setItem('portSettings', JSON.stringify(data));
            }

            //go
            connectToPort(data);
        });

        //***CLOSE PORT
        $("#spDisconnect").bind("click", function () {
            //remove port settings
            if (supportHtml5Storage()) {
                localStorage.removeItem('portSettings');
            }

            $.ajax({
                type: 'POST',
                url: WCF_ADDRESS + "/Service.svc/SetActive",
                dataType: "json",
                data: { status: false },
                crossDomain: true,
                //cache: false,
                async: true,
                success: function (result) {
                    var isopen = result['IsPortOpen'];

                    setPortStatusCaption(isopen);
                    setSettingsEnable($('.port-setting'), isopen);
                    setSettingsEnable($('.cnc-setting'), isopen);
                    //console.log("data sp2: ", result);
                },
                error: function (e) {
                    console.info('err in upl ', e);
                }
            });
        });

        //***SEND BYTES TO PORT
        $("#spSend").bind("click", function () {
            //var ar = [];

            val = $('#spSendData').val();
            //var arv = val.split(',');
            //ar.push(val);

            var obj = {
                data: val
            };

            $.ajax({
                type: 'POST',
                url: WCF_ADDRESS + "/Service.svc/Transmit",
                data: obj,
                dataType: "json",
                contentType: 'application/javascript',
                crossDomain: true,
                //cache: false,
                async: true,
                success: function (result) {
                    //console.log("data sp2: ", result);
                },
                error: function (e) {
                    console.info('err in upl ', e);
                }
            });

            //$.ajax({
            //    type: 'GET',
            //    url: WCF_ADDRESS + "/Subscribe",
            //    data: {id: 2},
            //    dataType: "json",
            //    contentType: 'application/javascript',
            //    crossDomain: true,
            //    cache: false,
            //    async: true,
            //    success: function (result) {
            //        //console.log("data sp2: ", result);
            //    },
            //    error: function (e) {
            //        console.info('err in upl ', e);
            //    }
            //});
        });

        //***SELECT IMAGE
        $inpFile.bind('change', function (event) {
            loadHtmlFile(this);

            ajaxLoadImage();
        });

        $imageConvertValue.bind('change', function(event) {
            var val = $(event.target).val();

            if (isNum(val)) {
                ajaxLoadImage();
            }
        });

        //***START CNC
        $("#spStartCnc").bind("click", function () {
            var movieMethod = $("input[name=cncMovier]:checked").val();
            var movingDelay = $('#movingDelay').val();

            if (!isNum(movingDelay))
                return;

            var obj = {
                movieMethod: movieMethod,
                movingDelay: movingDelay
            };

            $('#cncStatusMessage').html('CNC started');

            setSettingsEnable($('.cnc-setting'), true);

            $.ajax({
                url: WCF_ADDRESS + "/Service.svc/StartCNC",
                type: 'GET',
                crossDomain: true,
                //cache: false,
                data: obj,
                dataType: 'json',
                contentType: 'application/javascript',
                async: true,
                success: function (result ) {
                    $('#cncResponseMessage').html(result.Message);
                    //var isPortOpen = result['IsPortOpen'];
                    //var isCncWork = result['isCncWork'];
                    setSettingsEnable($('.cnc-setting'), false);
                },
                error: function (e) {
                    console.info('err in start cnc ', e);
                }
            });
        });

        //***PAUSE CNC
        $("#spPauseCnc").bind("click", function () {
            setSettingsEnable($('.cnc-setting'), false);

            $.ajax({
                type: 'GET',
                url: WCF_ADDRESS + "/Service.svc/PauseCNC",
                dataType: "json",
                contentType: 'application/json',
                crossDomain: true,
                //cache: false,
                async: true,
                success: function (result) {
                    console.info('paused cnc ', result);
                },
                error: function (e) {
                    console.info('err stop cnc ', e);
                }
            });
        });

        //***STOP CNC
        $("#spStopCnc").bind("click", function () {
            setSettingsEnable($('.cnc-setting'), false);

            $.ajax({
                type: 'GET',
                url: WCF_ADDRESS + "/Service.svc/StopCNC",
                dataType: "json",
                contentType: 'application/json',
                crossDomain: true,
                //cache: false,
                async: true,
                success: function (result) {
                    //var isPortOpen = result['IsPortOpen'];
                    //var isCncWork = result['isCncWork'];
                    setSettingsEnable($('.cnc-setting'), false);
                },
                error: function (e) {
                    console.info('err stop cnc ', e);
                }
            });
        });
    }) ();
});