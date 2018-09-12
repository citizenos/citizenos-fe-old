# Public configuration

All this configuration is public.

* `*.json` - Configuration as per Node config module (https://www.npmjs.com/package/config). Add your `local.json` to override everything.
* `./styles` - Override stylesheets. Add your `local.css` file to override Citizen OS default stylesheets. Good for adding your own branding.
* `./imgs` - Custom images. Add your images that you reference from `local.css` here. For example your own logo. You can use the `mylogo_big.example.png` and `mylogo_small.example.png` as templates for the right format.

## Branding

Customizing Citizen OS FE layout is done by creating a `public/config/styles/local.css` file and overriding existing style definitions. This enables you to change logos and color scheme.

An example `local.css` that changes logos - [local.example.css](styles/local.example.css)

## Hiding and showing authentication methods

Hiding and showing authentication methods is done by adding following section in the configuration:

```
  "features": {
    "authentication": {
      "facebook": true,
      "google": true,
      "smartId": true,
      "mobiilId": true,
      "idCard": true,
      "citizenos": true
    }
  }
```
