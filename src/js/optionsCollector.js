var retrieveRadioOption = function(cachedOpt) {
	var selectedVal = cachedOpt.panel.selected;
	var settingValue = null;

	for (var i = 0; i < cachedOpt.option.options.length; i++) {
		if (cachedOpt.option.options[i].name == selectedVal) {
			return cachedOpt.option.options[i].optName;
		} 
	}	
}

var retrieveDependantOptions = function(cachedOpt) {
	var depOpts = {};
	//Only include options if master is enabled, else allow server to use defaults
	if (cachedOpt.option.master.on) {
		depOpts[cachedOpt.option.master.value] = true;
		//iterate over dependant options
		for (var i = 0; i < cachedOpt.option.options.bool.length; i++) {
			var curr = cachedOpt.option.options.bool[i];
			depOpts[curr.optName] = curr.on;
		}
		for (var i = 0; i < cachedOpt.option.options.slider.length; i++) {
			var curr = cachedOpt.option.options.slider[i];
			depOpts[curr.optName] = curr.value;
		}

		//iterate over the dependant panels
		for (var i = 0; i < cachedOpt.dependants.length; i++) {
			var curr = cachedOpt.dependants[i];
			switch(curr.type){
				case "radio":
					depOpts[curr.id] = retrieveRadioOption(curr);
					break;
				case "switch":
					for (var j = 0; j < curr.option.options.length; i++) {
						var currSw = curr.option.options[i];
						depOpts[currSw.optName] = currSw.on ? "ON" : "OFF";
					}
					break;
				case "slider":
					depOpts[curr.option.id] = curr.panel.value;
					break;
			}
		}
	}
	return depOpts;
}

/**
 * Helper function to convert Options Panel Creator Helper Object Cache
 * into the flat options structure that the Cloud Compiler Service expects.
 * 
 * Because the Options Creator Object Cache contains references to the UI panels
 * no other arguments are needed to produce the flat options object.
 */
var collectOptions = function(optionPanels) {
	selections = {};
	for (p in optionPanels) {
		var cachedOpt = optionPanels[p];
		switch(cachedOpt.option.type){
			case "radio":
				selections[cachedOpt.option.id] = retrieveRadioOption(cachedOpt);
				break;
			case "switch":
				for (var i = 0; i < cachedOpt.option.options.length; i++) {
					var curr = cachedOpt.option.options[i];
					selections[curr.optName] = curr.on ? "ON" : "OFF";
				}
				break;
			case "slider":
				selections[cachedOpt.option.id] = cachedOpt.panel.value;
				break;
			case "dependant":
				var addOpts = retrieveDependantOptions(cachedOpt);
				for (prop in addOpts) {
					selections[prop] = addOpts[prop];
				}
				break;
		}
	}
	return selections;
}