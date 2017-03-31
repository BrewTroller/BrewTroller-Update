application = function() {

    var btflasher = require('btflasher');
    var scanner = btflasher.Scanner();
    var flasher = btflasher.Flasher();

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
        var installWrapper = installPanel.parentNode;
        if (installPanel.parentNode.parentNode) {
            Polymer.dom(pushPages).removeChild(installWrapper);
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
        Polymer.dom(pushPages).appendChild(installWrapper);
    }

    var loadOptions = function(options) {
        opts = options;
        loadingOpts = false;
        //var pushPages = document.getElementsByTagName("push-pages")[0];
        var pushPages = Polymer.dom().querySelector("push-pages")
        //setup verion option
        verPanel = createVersionsPanel(options);
        //setup listener to create rest of options panels
        verPanel.panel.addEventListener("selectionChange", versionSelection)
        Polymer.dom(pushPages).appendChild(verPanel.wrapper);
        
        //add the installer panel 
        installPanel = document.createElement('install-panel');
        var installPanelWrapper = document.createElement('neon-animatable');
        installPanelWrapper.appendChild(installPanel);
        installPanel.addEventListener("beginFirmwareUpload", installHandler);
    }

    var installHandler = function() {
        //iterate over option panels and get user selcted values
        var options = collectOptions(optPanels);
        //Add build version
        options["BuildVersion"] = verPanel.panel.selected;

        //Get build from server
        installPanel.statusText = "Requesting Build...";
        installPanel.indeterminate = true;
        installPanel.progressDisabled = false;

        //Get build from server
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "http://build.brewtroller.net:8080/build", true);
        xhr.responseType = "json";
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    if (xhr.response.hasOwnProperty('binary')) {
                        app.flashBinary(xhr.response.binary);
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
    var scanForBoards = function() {
        var spinner = document.getElementById("loadingSpinner");
        var overlay = document.getElementById("loadingBackdrop");

        //Ensure that we have the display setup correctly to show that we are scanning
        overlay.querySelector("span").innerHTML = "Searching for BrewTrollers...";
        spinner.style.display = "";
        overlay.refit();
        //spinner.reset();
        spinner.active = true;
        waitingOnBoards = true;

        scanner.enumeratePorts(function(results) {
            var targetBoard = null;

            for (r in results) {
                var currentPort = results[r];
                if (currentPort.btInfo.positiveID) {
                    targetBoard = currentPort;
                }
            }

            if (targetBoard == null) {
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
                info.port = targetBoard.name;
                info.board = "Unable to detect board version";
                info.firmware = targetBoard.btInfo.version;
                document.getElementById("loadingBackdrop").close();
                device = targetBoard.name;
            }
        });
    }

    var loadFlasherConfig = function(flasher, localConfig) {
        var tmp = require('tmp');
        var fs = require('fs');
        var path = require('path');

        var tmpConfig = tmp.fileSync({ mode: 0644, prefix: 'avrdude-', postfix: '.config' });
        var localConfigFile = fs.readFileSync(path.join(__dirname, localConfig));

        fs.appendFileSync(tmpConfig.name, localConfigFile);
        flasher.loadConfigFile(tmpConfig.name);
    }

    var setupFlasher = function(hexFile) {
        flasher.serialportName = device;
        flasher.hexFile = hexFile;
        loadFlasherConfig(flasher, "../../avrdude.conf");
    }

    var flashBoard = function(baudRate, retryFunction) {
        flasher.serialBaudRate = baudRate;

        installPanel.statusText = "Flashing...";

        flasher.flash(function(perc, done, success) {
            if (done) {
                if (success) {
                    installPanel.statusText = "Flashing Complete";
                    installPanel.resetProgress();
                }
                else {
                    if (retryFunction) {
                        retryFunction();
                    }
                    else {
                        installPanel.statusText = "Flashing failed.";
                        installPanel.resetProgress();
                        var messages = flasher.getLogMessages()
                        console.log(messages);    
                    }
                }
            }
            else {
                installPanel.indeterminate = false;
                installPanel.progressValue = perc;
            }
        });
    }

    this.flashBinary = function(binaryData) { 

        installPanel.statusText = "Preparing upload...";

        var tmp = require('tmp');
        var fs = require('fs');
        var tmpHex = tmp.fileSync({ mode: 0644, prefix: 'btupdate-', postfix: '.hex' });

        fs.appendFileSync(tmpHex.name, binaryData);

        setupFlasher(tmpHex.name);        

        // Try flash at 115200, if it fails, retry at 57600baud
        flashBoard(115200, function() {
            flashBoard(57600, null);
        });
    }

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
    scanForBoards();
};

var app = null;
window.onload = function() {
    document.getElementById("loadingBackdrop").open();
    app = new application();
}