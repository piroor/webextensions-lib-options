# webextensions-lib-options

![Build Status](https://github.com/piroor/webextensions-lib-options/actions/workflows/main.yml/badge.svg?branch=trunk)

Provides ability to build options page.

## Required permissions

This does not require any special permission.

## Dependencies

 * [webextensions-lib-configs](https://github.com/piroor/webextensions-lib-configs)

## Usage

Load the file `Options.js` from your options page:

```json
{
  "default_locale": "en_US",
  "options_ui": {
    "page": "path/to/options.html"
  }
}
```

`options.html` is:

```html
<!DOCTYPE html>

<script type="application/javascript" src="path/to/Configs.js"></script>
<script type="application/javascript" src="path/to/Options.js"></script>
<script type="application/javascript">
  const configs = new Configs({
    // define default configurations at here
    enabled:    true,
    advanced:   false,
    attributes: 'alt|title',
    bgColor:    '#ffffff',
    mode:       'compatible'
  });
  // initialize options UI with this library
  const options = new Options(configs);
</script>

<!-- checkbox -->
<p><label><input type="checkbox" id="enabled"> Activate basic features</label></p>
<p><label><input type="checkbox" id="advanced"> Activate advanced features</label></p>

<!-- input field -->
<p><label>List of attributes: <input type="text" id="attributes"></label></p>

<!-- color picker -->
<p><label>Background color: <input type="color" id="bgColor"></label></p>

<!-- radio -->
<p>Mode:</p>
<ul><li><label><input type="radio" name="mode" value="compatible"> Compatible</label></li>
    <li><label><input type="radio" name="mode" value="medium"> Agressive</label></li></ul>
```

Then the `Options` detects an element which has its own ID same to each given config (defined with [`Configs`](https://github.com/piroor/webextensions-lib-configs)), and bind the config to the element. The element is initialized with the current value. If you change the state of the element itself, then it will be synchronized to the value of the related config.

## Auto-build of "All Configs" UI

This library provides ability to build generic UI like `about:config`, for all configs. Please call the method `buildUIForAllConfigs()` with a container DOM element. For example:

```javascript
const options = new Options(configs);
options.buildUIForAllConfigs(document.querySelector('#group-allConfigs'));
```

It will also have three buttons: "Reset", "Import" and "Export".

### Steps for numeric values

The type of an input field for each config key will be automatically detected based on its default value. For example, it will become `<input type="number">` if the value is a numeric.

[Due to the spec of numeric input fields](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/number), a decimal value like `1.75` may be displayed as invalid. We need to specify decimal value like `0.01` as its `step` attribute on such cases. This library guesses suitable `step` value from its default value, moreover you can specify custom values of the `step` attribute for each config via an optional parameter `steps`. For example:

```javascript
const options = new Options(configs, {
  steps: {
    width:       '1',
    height:      '1',
    widthScale:  '0.01',
    heightScale: '0.01'
  }
});
```
