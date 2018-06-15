/*
 license: The MIT License, Copyright (c) 2016-2018 YUKI "Piro" Hiroshi
 original:
   http://github.com/piroor/webextensions-lib-options
*/

class Options {
  constructor(aConfigs) {
  this.configs = aConfigs;
  this.uiNodes = {};
  this.throttleTimers = {};

  this.onReady = this.onReady.bind(this);
  this.onConfigChanged = this.onConfigChanged.bind(this)
  document.addEventListener('DOMContentLoaded', this.onReady);
}

  findUIForKey(aKey) {
    return document.querySelector(`[name="${aKey}"], #${aKey}`);
  }

  detectUIType(aNode) {
    if (!aNode)
      return this.UI_MISSING;

    if (aNode.localName == 'textarea')
      return this.UI_TYPE_TEXT_FIELD;

    if (aNode.localName == 'select')
      return this.UI_TYPE_SELECTBOX;

    if (aNode.localName != 'input')
      return this.UI_TYPE_UNKNOWN;

    switch (aNode.type) {
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
  }

  throttledUpdate(aKey, aUINode, aValue) {
    if (this.throttleTimers[aKey])
      clearTimeout(this.throttleTimers[aKey]);
    aUINode.dataset.configValueUpdating = true;
    this.throttleTimers[aKey] = setTimeout(() => {
      delete this.throttleTimers[aKey];
      this.configs[aKey] = this.UIValueToConfigValue(aKey, aValue);
      setTimeout(() => {
        aUINode.dataset.configValueUpdating = false;
      }, 50);
    }, 250);
  }

  UIValueToConfigValue(aKey, aValue) {
    switch (typeof this.configs.$default[aKey]) {
      case 'string':
        return String(aValue);

      case 'number':
        return Number(aValue);

      case 'boolean':
        if (typeof aValue == 'string')
          return aValue != 'false';
        else
          return Boolean(aValue);

      default: // object
        if (typeof aValue == 'string')
          return JSON.parse(aValue || 'null');
        else
          return aValue;
    }
  }

  configValueToUIValue(aValue) {
    if (typeof aValue == 'object') {
      let value = JSON.stringify(aValue);
      if (value == 'null')
        value = '';
      return value;
    }
    else
      return aValue;
  }

  bindToCheckbox(aKey, aNode) {
    aNode.checked = this.configValueToUIValue(this.configs[aKey]);
    aNode.addEventListener('change', () => {
      this.throttledUpdate(aKey, aNode, aNode.checked);
    });
    aNode.disabled = this.configs.$isLocked(aKey);
    this.addResetMethod(aKey, aNode);
    this.uiNodes[aKey] = this.uiNodes[aKey] || [];
    this.uiNodes[aKey].push(aNode);
  }
  bindToRadio(aKey) {
    const radios = document.querySelectorAll('input[name="' + aKey + '"]');
    let activated = false;
    Array.slice(radios).forEach((aRadio) => {
      aRadio.addEventListener('change', () => {
        if (!activated)
          return;
        const stringifiedValue = this.configs[aKey];
        if (stringifiedValue != aRadio.value)
          this.throttledUpdate(aKey, aRadio, aRadio.value);
      });
      aRadio.disabled = this.configs.$isLocked(aKey);
      const key = aKey + '-' + aRadio.value;
      this.uiNodes[key] = this.uiNodes[key] || [];
      this.uiNodes[key].push(aRadio);
    });
    const chosens = this.uiNodes[aKey + '-' + this.configs[aKey]];
    if (chosens && chosens.length > 0)
      chosens.map(chosen => { chosen.checked = true; });
    setTimeout(() => {
      activated = true;
    }, 0);
  }
  bindToTextField(aKey, aNode) {
    aNode.value = this.configValueToUIValue(this.configs[aKey]);
    aNode.addEventListener('input', () => {
      this.throttledUpdate(aKey, aNode, aNode.value);
    });
    aNode.disabled = this.configs.$isLocked(aKey);
    this.addResetMethod(aKey, aNode);
    this.uiNodes[aKey] = this.uiNodes[aKey] || [];
    this.uiNodes[aKey].push(aNode);
  }
  bindToSelectBox(aKey, aNode) {
    aNode.value = this.configValueToUIValue(this.configs[aKey]);
    aNode.addEventListener('change', () => {
      this.throttledUpdate(aKey, aNode, aNode.value);
    });
    aNode.disabled = this.configs.$isLocked(aKey);
    this.addResetMethod(aKey, aNode);
    this.uiNodes[aKey] = this.uiNodes[aKey] || [];
    this.uiNodes[aKey].push(aNode);
  }
  addResetMethod(aKey, aNode) {
    aNode.$reset = () => {
      const value = this.configs[aKey] =
          this.configs.$default[aKey];
      if (this.detectUIType(aNode) == this.UI_TYPE_CHECKBOX)
        aNode.checked = value;
      else
        aNode.value = value;
    };
  }

  async onReady() {
    document.removeEventListener('DOMContentLoaded', this.onReady);

    if (!this.configs || !this.configs.$loaded)
      throw new Error('you must give configs!');

    this.configs.$addObserver(this.onConfigChanged);
    await this.configs.$loaded;
    Object.keys(this.configs.$default).forEach(aKey => {
      const node = this.findUIForKey(aKey);
      if (!node)
        return;
      switch (this.detectUIType(node)) {
        case this.UI_TYPE_CHECKBOX:
          this.bindToCheckbox(aKey, node);
          break;

        case this.UI_TYPE_RADIO:
          this.bindToRadio(aKey);
          break;

        case this.UI_TYPE_TEXT_FIELD:
          this.bindToTextField(aKey, node);
          break;

        case this.UI_TYPE_SELECTBOX:
          this.bindToSelectBox(aKey, node);
          break;

        case this.UI_MISSING:
          return;

        default:
          throw new Error('unknown type UI element for ' + aKey);
      }
    });
  }

  onConfigChanged(aKey) {
    let nodes = this.uiNodes[aKey];
    if (!nodes) // possibly radio
      nodes = this.uiNodes[aKey + '-' + this.configs[aKey]];
    if (!nodes || !nodes.length)
      return;

    for (const node of nodes) {
      if (node.dataset.configValueUpdating)
        return;
      if ('checked' in node) {
        node.checked = !!this.configs[aKey];
      }
      else {
        node.value = this.configValueToUIValue(this.configs[aKey]);
      }
      node.disabled = this.configs.$isLocked(aKey);
    }
  }

  buildUIForAllConfigs(aParent) {
    const parent = aParent || document.body;
    const range = document.createRange();
    range.selectNodeContents(parent);
    range.collapse(false);
    const rows = [];
    for (const key of Object.keys(this.configs.$default).sort()) {
      const value = this.configs.$default[key];
      const type = typeof value == 'number' ? 'number' :
        typeof value == 'boolean' ? 'checkbox' :
          'text' ;
      rows.push(`
        <tr>
          <td><label for="allconfigs-field-${key}">${key}</label></td>
          <td><input id="allconfigs-field-${key}"
                     type="${type}"></td>
          <td><button id="allconfigs-reset-${key}">Reset</button></td>
        </tr>
      `);
    }
    const fragment = range.createContextualFragment(`<table><tbody>${rows.join('')}</tbody></table>`);
    range.insertNode(fragment);
    range.detach();
    const table = parent.lastChild;
    Array.slice(table.querySelectorAll('input')).forEach(aInput => {
      const key = aInput.id.replace(/^allconfigs-field-/, '');
      switch (this.detectUIType(aInput))
      {
        case this.UI_TYPE_CHECKBOX:
          this.bindToCheckbox(key, aInput);
          break;

        case this.UI_TYPE_TEXT_FIELD:
          this.bindToTextField(key, aInput);
          break;
      }
      const button = table.querySelector(`#allconfigs-reset-${key}`);
      button.addEventListener('click', () => {
        aInput.$reset();
      });
      button.addEventListener('keyup', (aEvent) => {
        if (aEvent.key == 'Enter')
          aInput.$reset();
      });
    });
  }
};

Options.prototype.UI_TYPE_UNKNOWN    = 0;
Options.prototype.UI_TYPE_TEXT_FIELD = 1 << 0;
Options.prototype.UI_TYPE_CHECKBOX   = 1 << 1;
Options.prototype.UI_TYPE_RADIO      = 1 << 2;
Options.prototype.UI_TYPE_SELECTBOX  = 1 << 3;

