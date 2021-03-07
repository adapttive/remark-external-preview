'use strict'
const fs = require('fs');
const path = require('path');
const handlebars = require("handlebars");
const visit = require('unist-util-visit')
const request = require('sync-request');
const buffer = require('buffer');
const bn = require("browser-or-node");

const EXTERNAL_PREVIEW_REGEX = /@external:([a-zA-Z]*):([a-zA-Z]*)/im;
const EXTERNAL_PREVIEW_LINE_NUMBER_REGEX = /(#L(\d*)-L(\d*))|(#L(\d*))/im;
const DEFAULT_SETTINGS = {
    config: {
        container: {
            class_prefix: "external-preview",
            class1: "flex flex-align-top",
            class2: "frame",
            add_header: true,
            header: {
                class: "header flex",
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
                class: "code",
                use_prism: true
            }
        },
        github: {
            only_selected_lines: true,
            replacement_host: "raw.githubusercontent.com"
        }
    },
    data: {
        content: "",
        language: "",
        link: "#"
    }
};

module.exports = externalPreview

function externalPreview(options) {
    const settings = Object.assign({}, DEFAULT_SETTINGS, options);

    function transformer(tree) {
        visit(tree, "text", visitor);
    }

    function visitor(node, index, parent) {
        if (parent.type === "link") {
            const match = EXTERNAL_PREVIEW_REGEX.exec(node.value);
            if (match && match.length === 3) {
                const type = match[1];
                const service = match[2];
                parent.type = 'html'
                parent.value = preview(parent.url, type, service);
            }
        }
    }

    function preview(url, type, service) {
        const previewTemplate = fs.readFileSync(path.resolve(__dirname + `/templates/${service}.hbs`), 'utf8');
        const template = handlebars.compile(previewTemplate);
        if (!settings.data.language) {
            settings.data.language = getLanguage(url);
        }
        let result = load(url, type, service);
        result.content = extract(url, result.content)
        settings.data.link = result.link;
        settings.data.content = result.content;
        return template(settings);
    }

    function getLanguage(url) {
        let extension = url.split(/[#?]/)[0].split('.').pop().trim();
        let language = extension;
        if (extension === "js") {
            language = "javascript";
        }

        if (extension === "yml") {
            language = "yaml";
        }
        return language;
    }

    function load(url, type, service) {
        // replace url for github
        let link = url;
        if (service === "github" && settings['config'][service]['replacement_host']) {
            link = url; //url.replace(/\/blob\/(.*?)\//, '/');
            url = url.replace(/\/\/github\.com/, '//' + settings['config'][service]['replacement_host']).replace(/\/blob\//, '/');
        }
        settings.data.link = link;

        // load external content
        let response = request('GET', url);
        let content = response.getBody();
        if (typeof content !== "string" && buffer.Buffer.isBuffer(content)) {
            content = content.toString();
        }
        content = content.trim();

        if (type === 'code') {
            let language = settings.data.type ? options.data.type : getLanguage(link);
            if (settings.config.container.code.use_prism && bn.isNode) {
                const Prism = require('prismjs');

                // load all grammars
                require("prismjs/components/")();

                // optimize loading of grammar
                // const loadLanguages = require('prismjs/components/index.js');
                // loadLanguages([language]);

                if (Prism.languages[language]) {
                    content = Prism.highlight(content, Prism.languages[language], language);
                } else {
                    content = Prism.util.encode(content);
                }
            }
        }

        return {content: content, link: link};
    }

    function extract(url, content) {
        if (typeof content === "string") {
            const lines = EXTERNAL_PREVIEW_LINE_NUMBER_REGEX.exec(url);
            let start, end;
            if (lines[5] !== undefined) {
                start = parseInt(lines[5]);
                end = parseInt(lines[5]);
            }

            if (lines[2] !== undefined && lines[3] !== undefined) {
                start = parseInt(lines[2]);
                end = parseInt(lines[3]);
            }

            if (start && end && settings.config.github.only_selected_lines) {
                let lines = content.split('\n');
                lines = lines.slice(start-1, end);
                content = lines.join('\n');
            }
        }

        return content;
    }

    return transformer
}

