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
			case "dependant":
				panel = createDependantPanelSet(option);
		}

		panels.push(panel);
	}

	return panels;
};