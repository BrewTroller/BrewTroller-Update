var createOptionPanels = function(options) {
	var panels = [];

	for (opt in options) {
		var option = options[opt];

		var panel = null;
		switch(option.type){
			case "radio":
				panel = createRadioPanel(option);
				break;
			case "switch":
				panel = createSwitchPanel(option);
				break;
			case "slider":
				panel = createSliderPanel(option);
				break;
			case "dropdown":
				panel = createDropdownPanel(option);
				break;
			case "dependant":
				panel = createDependantPanelSet(option);
		}

		panels.push(panel);
	}

	return panels;
};

var createVersionsPanel = function(optionsManifest) {
	var versions = [];
	for (ver in optionsManifest) {
		versions.push({"name": ver, "optName": ver});
	}

	var opt = {
		"id": "BuildVersion",
		"title": "Firmware Version",
		"description": "Select the firmware version you want to install to your BrewTroller",
		"options": versions
	}

	return createRadioPanel(opt);
};
