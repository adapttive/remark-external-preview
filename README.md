# remark-external-preview
External Preview Plugin for Remark

## Installation

`npm install @adapttive/remark-external-preview` or

`yarn add @adapttive/remark-external-preview`

## Usage

```js

const remark = require("remark");
const html = require('remark-html');
const externalPreview = require('@adapttive/remark-external-preview');

remark()
    .use(html)
    .use(externalPreview)
    .process(
        "# Hi" +
        "\n[@external:code:github](https://github.com/milindsingh/magento2-grumphp/blob/2d9be8cf5c9da07256af5194370e9a9326e30881/module/grumphp.yml#L1-L134)",
        function(err, output) {
            console.log(String(output))
            console.error(err)
        }
    );
```
