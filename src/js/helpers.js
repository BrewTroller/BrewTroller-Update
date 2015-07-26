String.prototype.pretty = function() {
    return this.replace(/_/g, " ").replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

String.prototype.ugly = function() {
    return this.replace(/ /g, "_").toUpperCase();
}