var createRadioPanel = function(opt) {

        //build a radio panel
        var p = Polymer.Base.create('radio-option-panel', {
            "id": opt.id + "Panel",
            "options": opt.options,
            "selected": opt.default,
            "optionTitle": opt.title || opt.id,
            "optionDescription": opt.description || " "
        });
        var na = Polymer.Base.create("neon-animatable", {});
        Polymer.dom(na).appendChild(p);

        return {"panel": p, "wrapper": na, "option": opt};
}

var createSwitchPanel = function(opt) {

        //build the switch option panel
        var s = Polymer.Base.create('switch-option-panel', {
            "id": opt.id + "Panel",
            "options": opt.options,
            "optionTitle": opt.title || opt.id,
            "optionDescription": opt.description || " "
        });
        var na = Polymer.Base.create("neon-animatable", {});
        Polymer.dom(na).appendChild(s);

        return {"panel": s, "wrapper": na, "option": opt};
}

var createSliderPanel = function(opt) {
        //Build the slider panel
        var s = Polymer.Base.create('slider-option-panel', {
            "id": opt.id + "Panel",
            "value": opt.value,
            "minVal": opt.min,
            "maxVal": opt.max,
            "step": opt.step,
            "optionTitle": opt.title || opt.id,
            "optionDescription": opt.description || " "
        });
        var na = Polymer.Base.create("neon-animatable", {});
        Polymer.dom(na).appendChild(s);

        return {"panel": s, "wrapper": na, "option": opt};
}

var createDropdownPanel = function(opt) {
        //Build the slider panel
        var s = Polymer.Base.create('dropdown-option-panel', {
            "id": opt.id + "Panel",
            "optionTitle": opt.title || opt.id,
            "optionDescription": opt.description || " "
        });
        var na = Polymer.Base.create("neon-animatable", {});
        Polymer.dom(na).appendChild(s);

        return {"panel": s, "wrapper": na, "option": opt};
}

var createRGBIOMapPanel = function(opt, boardnum) {
    var s = Polymer.Base.create('rgbio-mapping-panel', {
        "id": "rgbioMapPanel" + boardnum,
        "optionTitle": "RGBIO Board " + (boardnum + 1) + " Mapping",
        "optionDescription": opt.description || " ",
        "availableSelections": opt.availableSelections
    });
    var na = Polymer.Base.create("neon-animatable", {});
    Polymer.dom(na).appendChild(s);

    return {"panel": s, "wrapper": na, "option": opt, "boardnum": boardnum}
}

var createDependantPanelSet = function(opt) {

        var set = {"option": opt,
                   "panel": null,
                   "wrapper": null,
                   "dependants": [],
                   "setup": null,
                   "masterChangeHandler": null
        };

        //Create the dependant option panel
        set.panel = Polymer.Base.create('dependant-options-panel', {
            "id": opt.id + "MasterPanel",
            "optionDescription": opt.description,
            "optionTitle": opt.title || opt.id,
            "masterOption": opt.master,
            "boolOptions": opt.options.bool,
            "rangeOptions": opt.options.slider,
            "enumOptions": []
        });
        set.wrapper = Polymer.Base.create('neon-animatable', {});
        Polymer.dom(set.wrapper).appendChild(set.panel);

        //Create the slave panels
        for (dep in opt.dependants) {
            var dpanel = null;
            switch(opt.dependants[dep].type) {
                case "switch":
                    dpanel = createSwitchPanel(opt.dependants[dep]);
                    break;
                case "slider":
                    dpanel = createSliderPanel(opt.dependants[dep]);
                    break;
                case "radio":
                    dpanel = createRadioPanel(opt.dependants[dep]);
                    break;
            }
            set.dependants.push(dpanel);
        }

        var masterChange = function(e) {
            //ensure all the dependant panels are in the container
            if (e.detail.newVal) {
                var masterWrapper = set.wrapper;
                var container = Polymer.dom(masterWrapper).parentNode;
                var insertFunc = null;
                if (masterWrapper.nextSibling) {
                    insertFunc = function(newNode) {
                        Polymer.dom(container).insertBefore(newNode, masterWrapper.nextSibling);
                    }
                }
                else {
                    insertFunc = Polymer.dom(container).appendChild;
                }

                for (dep in set.dependants) {
                    if (!container.contains(set.dependants[dep].wrapper)) {
                        insertFunc(set.dependants[dep].wrapper);
                    }
                }
            }
            //ensure all the dependant panels have been removed
            else {
                var masterWrapper = set.wrapper;
                var container = Polymer.dom(masterWrapper).parentNode;

                for (dep in set.dependants) {
                    if (container.contains(set.dependants[dep].wrapper)) {
                        Polymer.dom(container).removeChild(set.dependants[dep].wrapper);
                    }
                }
            }
        }

        var setup = function() {
            //If the master is enabled, insert all the dependants after it
            if (set.panel.masterOption.on) {
                var masterWrapper = set.wrapper;
                var container = masterWrapper.parentElement;

                var insertFunc = null;
                if (masterWrapper.nextSibling) {
                    insertFunc = function(newNode) {
                        Polymer.dom(container).insertBefore(newNode, masterWrapper.nextSibling);
                    }
                }
                else {
                    insertFunc = Polymer.dom(container).appendChild;
                }

                //insert each dependant panel
                for (p in set.dependants) {
                    insertFunc(set.dependants[p].wrapper);
                }
            }
            set.masterChangeHandler = masterChange.bind(this);
            set.panel.addEventListener("masterOptionChange", set.masterChangeHandler);
        }
        set.setup = setup.bind(this);

        return set;
}

var createDependantCountedPanelSet = function(opt) {
    var set = {"option": opt,
    "panel": null,
    "wrapper": null,
    "dependants": [],
    "setup": null,
    "masterOrCountChangeHandler": null,
    "dependantsCountOption": opt.dependantsCountOption,
    "dependantPanelType": opt.dependantPanelType,
    "dependantPanelOptions": opt.dependantOptions
    };

    //Create the dependant option panel
    set.panel = Polymer.Base.create('dependant-options-panel', {
        "id": opt.id + "MasterPanel",
        "optionDescription": opt.description,
        "optionTitle": opt.title || opt.id,
        "masterOption": opt.master,
        "boolOptions": opt.options.bool,
        "rangeOptions": opt.options.slider,
        "dependantsCountOption": opt.dependantsCountOption,
        "enumOptions": []
    });
    set.wrapper = Polymer.Base.create('neon-animatable', {});
    Polymer.dom(set.wrapper).appendChild(set.panel);

    //Create the slave panels
    for (var i = 0; i < set.dependantsCountOption.max; i++) {
        var dpanel = null;
        switch(set.dependantPanelType) {
            case "switch":
            dpanel = createSwitchPanel(set.dependantPanelOptions);
            break;
            case "slider":
            dpanel = createSliderPanel(set.dependantPanelOptions);
            break;
            case "radio":
            dpanel = createRadioPanel(set.dependantPanelOptions);
            break;
            case "rgbio-map":
            dpanel = createRGBIOMapPanel(set.dependantPanelOptions, i);
            break;
        }
        set.dependants.push(dpanel);
    }

    var masterOrCountChange = function(e) {
        var masterWrapper = set.wrapper;
        var container = Polymer.dom(masterWrapper).parentNode;
        //ensure all the dependant panels are in the container
        if (set.option.master.on) {
            for (index in set.dependants) {
                var lastWrapper = index == 0 ? masterWrapper : set.dependants[index - 1].wrapper;
                if (index < set.dependantsCountOption.value &&
                 !container.contains(set.dependants[index].wrapper)) {
                    Polymer.dom(container).insertBefore(set.dependants[index].wrapper, lastWrapper.nextSibling);
                }

                if (index >= set.dependantsCountOption.value &&
                    container.contains(set.dependants[index].wrapper)) {
                    Polymer.dom(container).removeChild(set.dependants[index].wrapper);
                }
            }
        }
        else {
            for (dep in set.dependants) {
                if (container.contains(set.dependants[dep].wrapper)) {
                    Polymer.dom(container).removeChild(set.dependants[dep].wrapper);
                }
            }
        }
        if (e.detail.newVal) {
            
            
        }
    }

    var setup = function() {
        set.masterOrCountChangeHandler = masterOrCountChange.bind(this);
        set.panel.addEventListener("masterOptionChange", set.masterOrCountChangeHandler);
        set.panel.addEventListener("dependantCountChange", set.masterOrCountChangeHandler)
    }
    set.setup = setup.bind(this);

    return set;
}