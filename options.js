/*
 license: The MIT License, Copyright (c) 2016 YUKI "Piro" Hiroshi
 original:
   http://github.com/piroor/webextensions-lib-options
*/

var Options = {
	configs : null,

	throttleTimers : {},
	throttledUpdate : function(aKey, aValue) {
		if (this.throttleTimers[aKey])
			clearTimeout(this.throttleTimers[aKey]);
		this.throttleTimers[aKey] = setTimeout((function() {
			delete this.throttleTimers[aKey];
			this.configs[aKey] = aValue;
		}).bind(this), 250);
	},

	bindToCheckbox : function(aKey)
	{
		var node = document.getElementById(aKey);
		node.checked = this.configs[aKey];
		node.addEventListener('change', (function() {
			this.throttledUpdate(aKey, node.checked);
		}).bind(this));
	},
	bindToTextField : function(aKey)
	{
		var node = document.getElementById(aKey);
		node.value = this.configs[aKey];
		node.addEventListener('input', (function() {
			this.throttledUpdate(aKey, node.value);
		}).bind(this));
	},

	onReady : function()
	{
		if (!this.configs || !this.configs.$loaded)
			throw new Error('you must give configs!');

		this.configs.$loaded
			.then((function() {
				Object.keys(this.configs.$default).forEach(function(aKey) {
					switch (typeof this.configs[aKey])
					{
						case 'boolean':
							this.bindToCheckbox(aKey);
							break;

						default:
							this.bindToTextField('attrList');
					}
				}, this);
			}).bind(this));
	}
}

document.addEventListener('DOMContentLoaded', function onReady() {
	document.removeEventListener('DOMContentLoaded', onReady);
	Options.onReady();
});
