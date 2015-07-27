var createRadioPanel = function(opt) {
        
        //build a radio panel
        var p = Polymer.Base.create('radio-option-panel', {
            "id": opt.id + "Panel",
            "options": opt.options,
            "optionTitle": opt.title || opt.id,
            "optionDescription": opt.description || " "
        });
        p.selected = opt.default

        return p;
    }

    var createSwitchPanel = function(opt) {
         
        //build the switch option panel
        var s = Polymer.Base.create('switch-option-panel', {
            "id": opt.id + "Panel",
            "options": opt.options,
            "optionTitle": opt.title || opt.id,
            "optionDescription": opt.description || " "
        });
        
        return s;
    }

    var createSliderPanel = function(opt) {
        //Build the slider panel
        var s = Polymer.Base.create('slider-option-panel', {
            "id": opt.id + "Panel",
            "value": opt.default,
            "minVal": opt.min,
            "maxVal": opt.max,
            "step": opt.step,
            "optionTitle": opt.title || opt.id,
            "optionDescription": opt.description || " "
        });

        return s;
    }

    var createDepenendantPanelSet = function(optSet) {

        //TODO: Finsh implementing panel build / master listening logic
        throw "INCOMPLETE IMPELEMENTATION";

        //Create the dependant option panel
        var p = Polymer.Base.create('dependant-options-panel', {
            "id": opt.id + "MasterPanel",
            "optionDescription": opt.description,
            "optionTitle": opt.title || opt.id,
            
        });

        //TODO: Create bound functions to handle the firing of the master change event, and the initial insertion of the master
    }