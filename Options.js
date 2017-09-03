/*
 license: The MIT License, Copyright (c) 2016-2017 YUKI "Piro" Hiroshi
 original:
   http://github.com/piroor/webextensions-lib-options
*/

function Options(aConfigs) {
	this.configs = aConfigs;
	this.uiNodes = {};

	this.onReady = this.onReady.bind(this);
	this.onConfigChanged = this.onConfigChanged.bind(this)
	document.addEventListener('DOMContentLoaded', this.onReady);
}
Options.prototype = {
	configs : null,

	UI_TYPE_UNKNOWN    : 0,
	UI_TYPE_TEXT_FIELD : 1 << 0,
	UI_TYPE_CHECKBOX   : 1 << 1,
	UI_TYPE_RADIO      : 1 << 2,

	findUIForKey : function(aKey)
	{
		return document.querySelector([
		  '[name="' + aKey + '"]',
		  '#' + aKey
		].join(','));
	},

	detectUIType : function(aKey)
	{
		var node = this.findUIForKey(aKey);
		if (!node)
			return this.UI_MISSING;

		if (node.localName == 'textarea')
			return this.UI_TYPE_TEXT_FIELD;

		if (node.localName != 'input')
			return this.UI_TYPE_UNKNOWN;

		switch (node.type)
		{
			case 'text':
			case 'password':
			case 'number':
				return this.UI_TYPE_TEXT_FIELD;

			case 'checkbox':
				return this.UI_TYPE_CHECKBOX;

			case 'radio':
				return this.UI_TYPE_RADIO;

			default:
				return this.UI_TYPE_UNKNOWN;
		}
	},

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
		var node = this.findUIForKey(aKey);
		node.checked = this.configs[aKey];
		node.addEventListener('change', (function() {
			this.throttledUpdate(aKey, node.checked);
		}).bind(this));
		node.disabled = aKey in this.configs.$locked;
		this.uiNodes[aKey] = node;
	},
	bindToRadio : function(aKey)
	{
		var radios = document.querySelectorAll('input[name="' + aKey + '"]');
		var activated = false;
		Array.slice(radios).forEach((function(aRadio) {
			aRadio.addEventListener('change', (function() {
				if (!activated)
					return;
				if (this.configs[aKey] != aRadio.value)
					this.throttledUpdate(aKey, aRadio.value);
			}).bind(this));
			aRadio.disabled = aKey in this.configs.$locked;
			this.uiNodes[aKey + '-' + aRadio.value] = aRadio;
		}).bind(this));
		var chosen = this.uiNodes[aKey + '-' + this.configs[aKey]];
		if (chosen)
			chosen.checked = true;
		setTimeout(function() {
			activated = true;
		}, 0);
	},
	bindToTextField : function(aKey)
	{
		var node = this.findUIForKey(aKey);
		node.value = this.configs[aKey];
		node.addEventListener('input', (function() {
			this.throttledUpdate(aKey, node.value);
		}).bind(this));
		node.disabled = aKey in this.configs.$locked;
		this.uiNodes[aKey] = node;
	},

	onReady : function()
	{
		document.removeEventListener('DOMContentLoaded', this.onReady);

		if (!this.configs || !this.configs.$loaded)
			throw new Error('you must give configs!');

		this.configs.$addObserver(this.onConfigChanged);
		this.configs.$loaded
			.then((function() {
				Object.keys(this.configs.$default).forEach(function(aKey) {
					switch (this.detectUIType(aKey))
					{
						case this.UI_TYPE_CHECKBOX:
							this.bindToCheckbox(aKey);
							break;

						case this.UI_TYPE_RADIO:
							this.bindToRadio(aKey);
							break;

						case this.UI_TYPE_TEXT_FIELD:
							this.bindToTextField(aKey);
							break;

						case this.UI_MISSING:
							return;

						default:
							throw new Error('unknown type UI element for ' + aKey);
					}
				}, this);
			}).bind(this));
	},

	onConfigChanged : function(aKey) {
		var node = this.uiNodes[aKey];
		if (!node) // possibly radio
			node = this.uiNodes[aKey + '-' + configs[aKey]];
		if (!node)
			return;

		if ('checked' in node) {
			node.checked = !!this.configs[aKey];
		}
		else {
			node.value = this.configs[aKey];
		}
		node.disabled = this.configs.$locked[aKey];
	}
};
