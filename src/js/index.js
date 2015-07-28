application = function() {

    var clientPaths = {
        "darwin": {
            "x64": "./client/mac/BTClient-x64",
            "ia32": "./client/mac/BTClient"
        },
        "win32": {
            "x64": "./client/win/BTClient-x64.exe",
            "ia32": "./client/win/BTClient.exe"
        },
        "linux": {
            "x64": "./client/linux/BTClient-x64",
            "ia32": "./client/linux/BTClient"
        }
    };

    var loadingOpts = false;
    var waitingOnBoards = false;

    var handleOverlay = function() {
        if (!loadingOpts && !waitingOnBoards) {
            document.getElementById("loadingBackdrop").close();
        }
    }
    

    var opts = null;
    var optPanels = {};
    var loadOptions = function(options) {
        opts = options;
        loadingOpts = false;
        var pushPages = document.getElementsByTagName("push-pages")[0]
        //setup option pages
        optPanels = createOptionPanels(options);
        //insert each panel
        for (p in optPanels) {
            Polymer.dom(pushPages).appendChild(optPanels[p].wrapper);
            if (optPanels[p].hasOwnProperty("dependants")) {
                Polymer.dom.flush();
                optPanels[p].setup();
            }
        }
        //add the installer panel 
        var ip = document.createElement('install-panel');
        var na = document.createElement('neon-animatable');
        na.appendChild(ip);
        ip.addEventListener("beginFirmwareUpload", installHandler);
        Polymer.dom(pushPages).appendChild(na);
        //handle overlay
        handleOverlay();
    }

    var installHandler = function() {
        //iterate over option panels and get user selcted values
        var options = {};

        //TODO: Rebuild this logic to use cleaner option format
        /*for (prop in optPanels) {
            var curr = optPanels[prop];
            if (curr.panel.tagName.toLowerCase() == "radio-option-panel") {
                options[prop] = curr.panel.selected.ugly();
            }
            else if (curr.panel.tagName.toLowerCase() == "slider-option-panel") {
                options[prop] = curr.panel.value;
            } 
            else if (curr.panel.tagName.toLowerCase() == "switch-option-panel") {
                var switches = curr.panel.options;
                for (sw in switches) {
                    var optName = switches[sw].name.ugly();
                    options[optName] = switches[sw].on;
                }
            }
        }*/
        //Get build from server
        var installPanel = document.getElementsByTagName('install-panel')[0];
        installPanel.requestingBuild = true;
        //Get build from server
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "http://build.brewtroller.com:8080/build", true);
        xhr.responseType = "json";
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    if (xhr.response.hasOwnProperty('binary')) {
                        installPanel.uploadingToBoard = true;
                        installPanel.requestingBuild = false;
                        app.socket.send(JSON.stringify({"type": "2", "device": device, "payload": xhr.response.binary})); 
                        return; 
                    }
                }
                handleServerError(xhr.response, xhr.status);
            }
        };
        xhr.send(JSON.stringify(options));
    };

    var handleServerError = function(resp, code) {
        //clear spinner in backdrop and set error message
        var overlay = document.getElementById("loadingBackdrop");
        var spinner = document.getElementById("loadingSpinner");
        overlay.removeChild(spinner);
        overlay.querySelector("span").innerHTML = "Error contacting BrewTroller Build Server.<br/>Check your network connection or try again later."
        //reset the overlay sizing
        overlay.close();
        overlay.open();
    }

    var handleClientError = function(err) {
        var overlay = document.getElementById("loadingBackdrop");
        var spinner = document.getElementById("loadingSpinner");
        if (spinner != null) {
            overlay.removeChild(spinner);
        }
        overlay.querySelector("span").innerHTML = err
        //reset the overlay sizing
        overlay.close();
        overlay.open();
    }

    var device = null;
    var handleClientMessage = function(m) {
        //Handle boards return
        if (m instanceof Array) {
            if (m.length == 0) {
                //Got no boards, show error
                var overlay = document.getElementById("loadingBackdrop");
                var spinner = document.getElementById("loadingSpinner");
                if (spinner != null) {
                    overlay.removeChild(spinner);
                }
                overlay.querySelector("span").innerHTML = "No BrewTrollers Dectected.<br/>Check connections and try again."
                //reset the overlay sizing
                overlay.close();
                overlay.open();
            }
            else {
                //use first board
                waitingOnBoards = false;
                var info = document.getElementsByTagName('info-panel')[0];
                var statusParts = m[0].Status.split("\t");
                info.port = m[0].Port;
                info.board = "Unable to detect board version";
                info.firmware = statusParts[3] + "." + statusParts[4];
                handleOverlay();
                device = m[0].Port;
            }
        } else {
            if (m.hasOwnProperty("flash")) {
                var installPanel = document.getElementsByTagName('install-panel')[0];
                installPanel.uploadingToBoard = false;
                if (m.flash != "complete"){
                    var overlay = document.getElementById('loadingBackdrop');
                    //remove spinner if necessary
                    var loadingSpinner = document.getElementById("loadingSpinner");
                    if (loadingSpinner != null) {
                        overlay.removeChild(loadingSpinner);
                    }
                    overlay.querySelector("span").innerHTML = "Error flashing Board!:<br/>" + m.flash;
                    overlay.open();   
                }
            }
        }
    }

    var scanForBoards = function() {
        var message = {"type": "1"};
        this.socket.send(JSON.stringify(message));
    }

    this.socket = null;
    var handleClientSpawn = function(port) {
        app.socket = new WebSocket("ws://127.0.0.1:" + port);
        app.socket.onmessage = function(e) {
            handleClientMessage(JSON.parse(e.data));
        }
        app.socket.onopen = function(){
            //Scan for boards
            scanForBoards.bind(app)();
        }
    }

    var clientPort = null;

    //kickoff options pull from server
    var xhr = new XMLHttpRequest();
    //xhr.open("GET", "http://build.brewtroller.com:8080/options", true);
    xhr.open("GET", "../../options.json.example", true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                loadOptions(JSON.parse(xhr.responseText));
            }
            else {
                handleServerError(JSON.parse(xhr.responseText), xhr.status);
            }
        }
    }
    xhr.send();
    
    
    this.client = null;
    waitingOnBoards = true;
    
    //If we are running in the Node.js environment
    if (typeof process != "undefined") {
        var spawn = require('child_process').spawn;
        //spawn a client instance
        this.client = spawn(clientPaths[process.platform][process.arch])
        this.client.stdout.on('data', function(data){
            if (clientPort == null) {
                handleClientSpawn(Number(data));
            }
        });
        this.client.stderr.on('data', function(data) {
            console.log("err: " + data); 
            handleClientError(data);
        });
        this.client.on('close', function(code){
            console.log("client closed: " + code);
            this.client = null;
        });
        
        var onClose = function(e) {
            if (app.socket != null) {
                app.socket.close();
                app.socket = null;
            }
            if (app.client != null) {
                app.client.kill();
                app.client = null;
            }
            this.close(true);
        }
        var nw = require('nw.gui');
        var win = nw.Window.get();
        win.on('close', onClose);
    }
    else {
        waitingOnBoards = false;
    }
};

var app = null;
window.onload = function() {
    document.getElementById("loadingBackdrop").open();
    app = new application();
}