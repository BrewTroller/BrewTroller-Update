application = function() {

    var clientPaths = {
        "darwin": {
            "x64": "/client/mac/BTClient-x64",
            "ia32": "/client/mac/BTClient"
        },
        "win32": {
            "x64": "/client/win/BTClient-x64.exe",
            "ia32": "/client/win/BTClient.exe"
        },
        "linux": {
            "x64": "/client/linux/BTClient-x64",
            "ia32": "/client/linux/BTClient"
        }
    };

    var loadingOpts = false;
    var waitingOnBoards = false;
    

    var opts = null;
    var verPanel = null;
    var optPanels = {};
    var installPanel = null;
    var versionSelection = function(e) {
        var targetVer = e.detail.newVal;

        //remove all options panels, except info panel and version panel
        var pushPages = document.getElementsByTagName("push-pages")[0];
        for (p in optPanels) {
            Polymer.dom(pushPages).removeChild(optPanels[p].wrapper);
            delete optPanels[p];
        }
        //remove install panel to make inserting option panels easier
        if (installPanel.parentNode) {
            Polymer.dom(pushPages).removeChild(installPanel);
        }

        //Create new option panels
        optPanels = createOptionPanels(opts[targetVer]);
        //insert each option panel
        for (p in optPanels) {
            Polymer.dom(pushPages).appendChild(optPanels[p].wrapper);
            if (optPanels[p].hasOwnProperty("dependants")) {
                Polymer.dom.flush();
                optPanels[p].setup();
            }
        }
        // add the install panel
        Polymer.dom(pushPages).appendChild(installPanel);
    }

    var loadOptions = function(options) {
        opts = options;
        loadingOpts = false;
        var pushPages = document.getElementsByTagName("push-pages")[0];
        //setup verion option
        verPanel = createVersionsPanel(options);
        //setup listener to create rest of options panels
        verPanel.panel.addEventListener("selectionChange", versionSelection)
        Polymer.dom(pushPages).appendChild(verPanel.wrapper);
        
        //add the installer panel 
        var ip = document.createElement('install-panel');
        installPanel = document.createElement('neon-animatable');
        installPanel.appendChild(ip);
        ip.addEventListener("beginFirmwareUpload", installHandler);
    }

    var installHandler = function() {
        //iterate over option panels and get user selcted values
        var options = collectOptions(optPanels);
        //Add build version
        options["BuildVersion"] = verPanel.panel.selected;

        //Get build from server
        var installPanel = document.getElementsByTagName('install-panel')[0];
        installPanel.requestingBuild = true;
        //Get build from server
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "http://build.brewtroller.net:8080/build", true);
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
        overlay.refit();
    }

    var handleClientError = function(err) {
        var overlay = document.getElementById("loadingBackdrop");
        var spinner = document.getElementById("loadingSpinner");
        if (spinner != null) {
            overlay.removeChild(spinner);
        }
        overlay.querySelector("span").innerHTML = err
        //reset the overlay sizing
        overlay.refit();
    }

    var device = null;
    var handleClientMessage = function(m) {
        //Handle boards return
        if (m instanceof Array) {
            if (m.length == 0) {
                //Got no boards, show error
                var overlay = document.getElementById("loadingBackdrop");
                var spinner = document.getElementById("loadingSpinner");
                if (spinner.active ) {
                    spinner.active = false;
                    spinner.style.display = "none";

                }
                overlay.querySelector("span").innerHTML = "No BrewTrollers Dectected.<br/>Check connections, and board power.<br/>Search will automatically retry."
                //reset the overlay sizing
                overlay.refit();
                //Check for more boards in 5 seconds
                Polymer.Base.async(function() {
                    scanForBoards.call(app);   
                }, 5000);
            }
            else {
                //use first board
                waitingOnBoards = false;
                var info = document.getElementsByTagName('info-panel')[0];
                var statusParts = m[0].Status.split("\t");
                info.port = m[0].Port;
                info.board = "Unable to detect board version";
                info.firmware = statusParts[3] + (statusParts[4] == "0" ? "" : ("." + statusParts[4]));
                document.getElementById("loadingBackdrop").close();
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
        //If the socket isn't open, do nothing
        if (!this.socket || !this.socket.OPEN) { 
            return;
        }
        var spinner = document.getElementById("loadingSpinner");
        var overlay = document.getElementById("loadingBackdrop");
        
        //Ensure that we have the display setup correctly to show that we are scanning
        overlay.querySelector("span").innerHTML = "Searching for BrewTrollers...";            
        spinner.style.display = "";
        overlay.refit();
        spinner.reset();
        spinner.active = true;
        waitingOnBoards = true;

        //call timeout on scan after 3 seconds,
        //  we do this because the scan happens so fast the user can't actually
        //  see that anything is happening
        var sendScanMessage = function() {
            var message = {"type": "1"};
            this.socket.send(JSON.stringify(message));
        }
        var self = this;
        Polymer.Base.async(function() {
            sendScanMessage.call(self);
        }, 3000);   
    }

    this.socket = null;
    var handleClientSpawn = function(port) {
        app.socket = new WebSocket("ws://127.0.0.1:" + port);
        app.socket.onmessage = function(e) {
            handleClientMessage(JSON.parse(e.data));
        }
        app.socket.onopen = function(){
            //Scan for boards
            scanForBoards.call(app);
        }
    }

    var clientPort = null;

    //kickoff options pull from server
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "http://build.brewtroller.net:8080/options", true);
    
    //Use this file for testing!
    //xhr.open("GET", "../../options.json.example", true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            if (xhr.status == 200 || xhr.status == 0) {
                loadOptions(JSON.parse(xhr.responseText));
            }
            else {
                handleServerError(JSON.parse(xhr.responseText), xhr.status);
            }
        }
    }
    //Timeout the request after 10s, as the server maybe down
    xhr.timeout = 10000;
    xhr.ontimeout = function() {
        handleServerError();
    }
    xhr.send();
    loadingOpts = true;
    
    
    this.client = null;
    waitingOnBoards = true;
    
    //If we are running in the Node.js environment
    if (typeof process != "undefined") {
        //Ensure that the executables have permission to execute
        var cwd = process.cwd();
        var executable =  cwd + clientPaths[process.platform][process.arch];
        var fs = require('fs');
        fs.chmodSync(executable, 0777);

        var spawn = require('child_process').spawn;
        //spawn a client instance
        this.client = spawn(executable);
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