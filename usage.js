const fs = require('fs');
const path = require('path');
const remark = require("remark");
const html = require('remark-html')
const externalPreview = require("./index");

const Handlebars = require("handlebars");
const previewTemplate = fs.readFileSync(path.resolve("./templates/github.hbs"), 'utf8')
const template = Handlebars.compile(previewTemplate);

const preview = template(
    {
        config: {
            container: {
                class_prefix: "external-preview",
                class1: "flex flex-align-top",
                class2: "frame",
                add_header: true,
                header: {
                    class: "header flex hide-for-small",
                    add_dots: true,
                    dots: {
                        class: "buttons",
                        count: [1, 2, 3]
                    },
                    add_title: true,
                    title: {
                        add_link: true,
                        class: "header-title"
                    }
                },
                code: {
                    use_prism: true,
                    class: "code",
                }
            },
            github: {
                only_selected_lines: true,
                replacement_host: "raw.githubusercontent.com"
            }
        },
        data: {
            content: "Test",
            language: "yml",
            link: "https://adapttive.com"
        }
    }
);
//console.log(preview)

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