# webextensions-lib-options

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
    "page": "path/to/options.html",
    "chrome_style": true
  }
}
```

`options.html` is:

```html
<!DOCTYPE html>

<script type="application/javascript" src="path/to/Configs.js"></script>
<script type="application/javascript" src="path/to/Options.js"></script>
<script type="application/javascript">
  var configs = new Configs({
    // define default configurations at here
    enabled:    true,
    advanced:   false,
    attributes: 'alt|title'
  });
  // initialize options UI with this library
  var options = new Options(configs);
</script>

<p<label><input type="checkbox" id="enabled"> Activate basic features</label></p>
<p<label><input type="checkbox" id="advanced"> Activate advanced features</label></p>
<p<label>List of attributes: <input type="text" id="attributes"></label></p>
```

Then the `Options` detects elements which have their own ID same to one of given configs (an instance of [`Cofnigs`](https://github.com/piroor/webextensions-lib-configs), and bind them to configs.
