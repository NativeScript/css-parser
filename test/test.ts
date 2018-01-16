// Reference mocha-typescript's global definitions:
/// <reference path="../node_modules/mocha-typescript/globals.d.ts" />

import * as fs from "fs";

import { assert } from "chai";
import * as cssParse from "css-parse";
import { CSSParser, importParser, keyframesParser, Parser, TokenType } from "../src/index";

describe("css", () => {
    let parser: Parser;
    before("create parser", () => parser = new Parser());
    after("dispose parser", () => parser = null);
    describe("tokenize", () => {
        it("Button { background: red; }", () => {
            const tokens = parser.tokenize("Button { background: red; }");
            assert.deepEqual(tokens, [
                { type: TokenType.ident, source: "Button", name: "Button" },
                " ", "{", " ",
                { type: TokenType.ident, source: "background", name: "background" },
                ":", " ",
                { type: TokenType.ident, source: "red", name: "red" },
                ";", " ", "}",
            ]);
        });
        it("@import url(~/app.css); Button { color: orange; }", () => {
            const tokens = parser.tokenize("@import url(~/app.css); Button { color: orange; }");
            assert.deepEqual(tokens, [
                { type: TokenType.atKeyword, source: "@import", name: "import" },
                " ",
                { type: TokenType.url, source: "url(~/app.css)", url: "~/app.css" },
                ";", " ",
                { type: TokenType.ident, source: "Button", name: "Button" },
                " ", "{", " ",
                { type: TokenType.ident, source: "color", name: "color" },
                ":", " ",
                { type: TokenType.ident, source: "orange", name: "orange" },
                ";", " ", "}",
            ]);
        });
        it("some", () => {
            const css = `Button {
                background: rgba(255, 0, 0, 1);
                width: 25%;
            }`;
            const tokens = parser.tokenize(css);
            assert.deepEqual(tokens, [
                { type: TokenType.ident, source: "Button", name: "Button" },
                " ", "{", " ",
                { type: TokenType.ident, source: "background", name: "background" },
                ":", " ",
                { type: TokenType.functionToken, source: "rgba(", name: "rgba" },
                { type: TokenType.number, source: "255" },
                ",", " ",
                { type: TokenType.number, source: "0" },
                ",", " ",
                { type: TokenType.number, source: "0" },
                ",", " ",
                { type: TokenType.number, source: "1" },
                ")", ";", " ",
                { type: TokenType.ident, source: "width", name: "width" },
                ":", " ",
                { type: TokenType.percentage, source: "25%" },
                ";", " ", "}",
            ]);
        });
        it("@keyframes", () => {
            const css = `@keyframes mymove {
                from { top: 0px; }
                to { top: 200px; }
            }`;
            const tokens = parser.tokenize(css);
            assert.deepEqual(tokens, [
                { type: TokenType.atKeyword, source: "@keyframes", name: "keyframes" },
                " ",
                { type: TokenType.ident, source: "mymove", name: "mymove" },
                " ", "{", " ",
                { type: TokenType.ident, source: "from", name: "from" },
                " ", "{", " ",
                { type: TokenType.ident, source: "top", name: "top" },
                ":", " ",
                { type: TokenType.dimension, source: "0px" },
                ";", " ", "}", " ",
                { type: TokenType.ident, source: "to", name: "to" },
                " ", "{", " ",
                { type: TokenType.ident, source: "top", name: "top" },
                ":", " ",
                { type: TokenType.dimension, source: "200px" },
                ";", " ", "}", " ", "}",
            ]);
        });
        it("linear-gradient(rgba(...", () => {
            const css = `Button {
                background: linear-gradient(-90deg, rgba(255, 0, 0, 0), blue, #FFFF00, #00F);
            }`;
            const tokens = parser.tokenize(css);
            assert.deepEqual(tokens, [
                { type: TokenType.ident, source: "Button", name: "Button" },
                " ", "{", " ",
                { type: TokenType.ident, source: "background", name: "background" },
                ":", " ",
                { type: TokenType.functionToken, source: "linear-gradient(", name: "linear-gradient" },
                { type: TokenType.dimension, source: "-90deg" },
                ",", " ",
                { type: TokenType.functionToken, source: "rgba(", name: "rgba" },
                { type: TokenType.number, source: "255" },
                ",", " ",
                { type: TokenType.number, source: "0" },
                ",", " ",
                { type: TokenType.number, source: "0" },
                ",", " ",
                { type: TokenType.number, source: "0" },
                ")", ",", " ",
                { type: TokenType.ident, source: "blue", name: "blue" },
                ",", " ",
                { type: TokenType.hash, source: "#FFFF00", name: "FFFF00" },
                ",", " ",
                { type: TokenType.delim, source: "#" },
                { type: TokenType.dimension, source: "00F" },
                ")", ";", " ", "}",
            ]);
        });
        it("string tokens", () => {
            const css = `Button {
                font: "\\54 ah'o\\"ma";
                font: "Taho${"\\\n"}ma";
                font: 'Tahoma"';
            }`;
            const tokens = parser.tokenize(css);
            assert.deepEqual(tokens, [
                { type: TokenType.ident, source: "Button", name: "Button" },
                " ", "{", " ",
                { type: TokenType.ident, source: "font", name: "font" },
                ":", " ",
                { type: TokenType.string, source: `"\\54 ah'o\\"ma"`, text: "Tah'o\"ma" },
                ";", " ",
                { type: TokenType.ident, source: "font", name: "font" },
                ":", " ",
                { type: TokenType.string, source: `"Taho${"\\\n"}ma"`, text: "Tahoma" },
                ";", " ",
                { type: TokenType.ident, source: "font", name: "font" },
                ":", " ",
                { type: TokenType.string, source: `'Tahoma"'`, text: "Tahoma\"" },
                ";", " ", "}",
            ]);
        });
        it("escaped ident", () => {
            const css = `\\42utton { color: red; }`;
            const tokens = parser.tokenize(css);
            assert.deepEqual(tokens, [
                { type: TokenType.ident, source: `\\42utton`, name: "Button" },
                " ", "{", " ",
                { type: TokenType.ident, source: "color", name: "color" },
                ":", " ",
                { type: TokenType.ident, source: "red", name: "red" },
                ";", " ", "}",
            ]);
        });
        it("unicode range", () => {
            const css = `
                unicode-range: U+26;               /* single codepoint */
                unicode-range: U+0-7F;
                unicode-range: U+0025-00FF;        /* codepoint range */
                unicode-range: U+4??;              /* wildcard range */
                unicode-range: U+0025-00FF, U+4??; /* multiple values */
            `;
            const tokens = parser.tokenize(css);
            assert.deepEqual(tokens, [
                " ",
                { type: TokenType.ident, source: "unicode-range", name: "unicode-range" },
                ":", " ",
                { type: TokenType.unicodeRange, source: "U+26", start: 38, end: 38 },
                ";", " ", " ",
                { type: TokenType.ident, source: "unicode-range", name: "unicode-range" },
                ":", " ",
                { type: TokenType.unicodeRange, source: "U+0-7F", start: 0, end: 127 },
                ";", " ",
                { type: TokenType.ident, source: "unicode-range", name: "unicode-range" },
                ":", " ",
                { type: TokenType.unicodeRange, source: "U+0025-00FF", start: 37, end: 255 },
                ";", " ", " ",
                { type: TokenType.ident, source: "unicode-range", name: "unicode-range" },
                ":", " ",
                { type: TokenType.unicodeRange, source: "U+4??", start: 1024, end: 1279 },
                ";", " ", " ",
                { type: TokenType.ident, source: "unicode-range", name: "unicode-range" },
                ":", " ",
                { type: TokenType.unicodeRange, source: "U+0025-00FF", start: 37, end: 255 },
                ",", " ",
                { type: TokenType.unicodeRange, source: "U+4??", start: 1024, end: 1279 },
                ";", " ", " ",
            ]);
        });
        it("match selector", () => {
            const css = `*[title~="flower"] { border: 5px solid yellow; }`;
            const tokens = parser.tokenize(css);
            assert.deepEqual(tokens, [
                { type: TokenType.delim, source: "*" },
                "[",
                { type: TokenType.ident, source: "title", name: "title" },
                "~=",
                { type: TokenType.string, source: `"flower"`, text: "flower" },
                "]", " ", "{", " ",
                { type: TokenType.ident, source: "border", name: "border" },
                ":", " ",
                { type: TokenType.dimension, source: "5px" },
                " ",
                { type: TokenType.ident, source: "solid", name: "solid" },
                " ",
                { type: TokenType.ident, source: "yellow", name: "yellow" },
                ";", " ", "}",
            ]);
        });
        it("numerics", () => {
            const css = `Button { width: .0; height: 100%; font-size: 10em; }`;
            const tokens = parser.tokenize(css);
            assert.deepEqual(tokens, [
                { type: TokenType.ident, source: "Button", name: "Button" },
                " ", "{", " ",
                { type: TokenType.ident, source: "width", name: "width" },
                ":", " ",
                { type: TokenType.number, source: ".0" },
                ";", " ",
                { type: TokenType.ident, source: "height", name: "height" },
                ":", " ",
                { type: TokenType.percentage, source: "100%" },
                ";", " ",
                { type: TokenType.ident, source: "font-size", name: "font-size" },
                ":", " ",
                { type: TokenType.dimension, source: "10em" },
                ";", " ", "}",
            ]);
        });
        it("urls", () => {
            const css = `
                @import url( ~/app.css );
                @import url(~/app.css);
                Button { background: url("res://img1.jpg"); }
                Label { background: url('res://img1.jpg'); }
                TextField { background: url(res://img1.jpg); }
            `;
            const tokens = parser.tokenize(css);
            assert.deepEqual(tokens, [
                " ",
                { type: TokenType.atKeyword, source: "@import", name: "import" },
                " ",
                { type: TokenType.url, source: "url( ~/app.css )", url: "~/app.css" },
                ";", " ",
                { type: TokenType.atKeyword, source: "@import", name: "import" },
                " ",
                { type: TokenType.url, source: "url(~/app.css)", url: "~/app.css" },
                ";", " ",
                { type: TokenType.ident, source: "Button", name: "Button" },
                " ", "{", " ",
                { type: TokenType.ident, source: "background", name: "background" },
                ":", " ",
                { type: TokenType.url, source: `url("res://img1.jpg")`, url: "res://img1.jpg" },
                ";", " ", "}", " ",
                { type: TokenType.ident, source: "Label", name: "Label" },
                " ", "{", " ",
                { type: TokenType.ident, source: "background", name: "background" },
                ":", " ",
                { type: TokenType.url, source: `url('res://img1.jpg')`, url: "res://img1.jpg" },
                ";", " ", "}", " ",
                { type: TokenType.ident, source: "TextField", name: "TextField" },
                " ", "{", " ",
                { type: TokenType.ident, source: "background", name: "background" },
                ":", " ",
                { type: TokenType.url, source: `url(res://img1.jpg)`, url: "res://img1.jpg" },
                ";", " ", "}", " ",
            ]);
        });
    });
    describe("parse", () => {
        it("Button { background: red; }", () => {
            const stylesheet = parser.parseAStylesheet("Button { background: red; }");
            assert.deepEqual(stylesheet, {
                type: "stylesheet",
                stylesheet: {
                    rules: [
                        {
                            type: "qualified-rule",
                            prelude: [
                                { type: TokenType.ident, source: "Button", name: "Button" },
                                " ",
                            ],
                            block: {
                                type: TokenType.simpleBlock,
                                associatedToken: "{",
                                values: [
                                    " ",
                                    { type: TokenType.ident, source: "background", name: "background" },
                                    ":", " ",
                                    { type: TokenType.ident, source: "red", name: "red" },
                                    ";", " ",
                                ],
                            },
                        },
                    ],
                    parsingErrors: [],
                },
            });
        });
        it("@import url(~/app.css); Button { color: orange; }", () => {
            const stylesheet = parser.parseAStylesheet("@import url(~/app.css); Button { color: orange; }");
            assert.deepEqual(stylesheet, {
                type: "stylesheet",
                stylesheet: {
                    rules: [
                        {
                            type: "at-rule",
                            name: "import",
                            prelude: [" ", { type: TokenType.url, source: `url(~/app.css)`, url: "~/app.css" }],
                            block: undefined,
                            position: {
                                start: { line: 1, column: 1 },
                                end: { column: 24, line: 1 },
                            },
                        },
                        {
                            type: "qualified-rule",
                            prelude: [{ type: TokenType.ident, source: "Button", name: "Button" }, " "],
                            block: {
                                type: TokenType.simpleBlock,
                                associatedToken: "{",
                                values: [
                                    " ",
                                    { type: TokenType.ident, source: "color", name: "color" },
                                    ":", " ",
                                    { type: TokenType.ident, source: "orange", name: "orange" },
                                    ";", " ",
                                ],
                            },
                        },
                    ],
                    parsingErrors: [],
                },
            });
        });
        it("linear-gradient(rgba(...", () => {
            const css = `Button {
                background: linear-gradient(-90deg, rgba(255, 0, 0, 0), blue, #FFFF00, #00F);
            }`;
            const stylesheet = parser.parseAStylesheet(css);
            assert.deepEqual(stylesheet, {
                type: "stylesheet",
                stylesheet: {
                    rules: [
                        {
                            type: "qualified-rule",
                            prelude: [{ type: TokenType.ident, source: "Button", name: "Button" }, " "],
                            block: {
                                associatedToken: "{",
                                type: TokenType.simpleBlock,
                                values: [
                                    " ",
                                    { type: TokenType.ident, source: "background", name: "background" },
                                    ":", " ",
                                    {
                                        type: TokenType.functionObject,
                                        name: "linear-gradient",
                                        components: [
                                            { type: TokenType.dimension, source: "-90deg" },
                                            ",", " ",
                                            {
                                                type: TokenType.functionObject,
                                                name: "rgba",
                                                components: [
                                                    { type: TokenType.number, source: "255" },
                                                    ",", " ",
                                                    { type: TokenType.number, source: "0" },
                                                    ",", " ",
                                                    { type: TokenType.number, source: "0" },
                                                    ",", " ",
                                                    { type: TokenType.number, source: "0" },
                                                ],
                                            },
                                            ",", " ",
                                            { type: TokenType.ident, source: "blue", name: "blue" },
                                            ",", " ",
                                            { type: TokenType.hash, source: "#FFFF00", name: "FFFF00" },
                                            ",", " ",
                                            { type: TokenType.delim, source: "#" },
                                            { type: TokenType.dimension, source: "00F" },
                                        ],
                                    },
                                    ";", " ",
                                ],
                            },
                        },
                    ],
                    parsingErrors: [],
                },
            });
        });
        it("@keyframe", () => {
            const css = `
                @keyframes example {
                    0% { transform: scale(1, 1); }
                    100% { transform: scale(1, 0); }
                }
                div {
                    animation: example 5s linear 2s infinite alternate;
                }
            `;
            const stylesheet = parser.parseAStylesheet(css);
            assert.deepEqual(stylesheet, {
                type: "stylesheet",
                stylesheet: {
                    rules: [
                        {
                            type: "at-rule",
                            name: "keyframes",
                            prelude: [" ", { type: TokenType.ident, source: "example", name: "example" }, " "],
                            block: {
                                type: TokenType.simpleBlock,
                                associatedToken: "{",
                                values: [
                                    " ",
                                    { type: TokenType.percentage, source: "0%" },
                                    " ",
                                    {
                                        type: TokenType.simpleBlock,
                                        associatedToken: "{",
                                        values: [
                                            " ",
                                            { type: TokenType.ident, source: "transform", name: "transform" },
                                            ":", " ",
                                            {
                                                type: TokenType.functionObject,
                                                name: "scale",
                                                components: [
                                                    { type: TokenType.number, source: "1" },
                                                    ",", " ",
                                                    { type: TokenType.number, source: "1" },
                                                ],
                                            },
                                            ";", " ",
                                        ],
                                    },
                                    " ",
                                    { type: TokenType.percentage, source: "100%" },
                                    " ",
                                    {
                                        type: TokenType.simpleBlock,
                                        associatedToken: "{",
                                        values: [
                                            " ",
                                            { type: TokenType.ident, source: "transform", name: "transform" },
                                            ":", " ",
                                            {
                                                type: TokenType.functionObject,
                                                name: "scale",
                                                components: [
                                                    { type: TokenType.number, source: "1" },
                                                    ",", " ",
                                                    { type: TokenType.number, source: "0" },
                                                ],
                                            },
                                            ";", " ",
                                        ],
                                    },
                                    " ",
                                ],
                            },
                            position: {
                                start: { line: 2, column: 17 },
                                end: { line: 5, column: 18 },
                            },
                        },
                        {
                            type: "qualified-rule",
                            prelude: [{ type: TokenType.ident, source: "div", name: "div" }, " "],
                            block: {
                                associatedToken: "{",
                                type: TokenType.simpleBlock,
                                values: [
                                    " ",
                                    { type: TokenType.ident, source: "animation", name: "animation" },
                                    ":", " ",
                                    { type: TokenType.ident, source: "example", name: "example" },
                                    " ",
                                    { type: TokenType.dimension, source: "5s" },
                                    " ",
                                    { type: TokenType.ident, source: "linear", name: "linear" },
                                    " ",
                                    { type: TokenType.dimension, source: "2s" },
                                    " ",
                                    { type: TokenType.ident, source: "infinite", name: "infinite" },
                                    " ",
                                    { type: TokenType.ident, source: "alternate", name: "alternate" },
                                    ";",
                                    " ",
                                ],
                            },
                        },
                    ],
                    parsingErrors: [],
                },
            });
        });
    });
});

describe("css as rework", () => {
    let parser: CSSParser;
    before("create parser", () => {
        parser = new CSSParser();
        parser.debug = false;
        parser.addAtRuleParser(importParser);
        parser.addAtRuleParser(keyframesParser);
    });
    after("dispose parser", () => parser = null);

    function compare(css: string): void {
        const nativescript = parser.parseACSSStylesheet(css);
        // console.log(JSON.stringify(nativescript));
        // Strip type info, undefined properties, positions.
        const rework = JSON.parse(JSON.stringify(cssParse(css), (key, value) => key === "position" ? undefined : value));
        // console.log("REWORK AST:\n" + JSON.stringify(rework, null, "  "));
        // console.log("{N} AST:\n" + JSON.stringify(nativescript, null, "  "));
        assert.deepEqual(nativescript, rework);
    }
    it("div{color:red}p{color:blue}", () => {
        compare("div{color:red}p{color:blue}");
    });
    it("Button, Label { background: red; }", () => {
        compare("Button, Label {\n  background: red;\n}\n");
    });
    it("Label { color: argb(1, 255, 0, 0); }", () => {
        compare("Label { color: argb(1, 255, 0, 0); }");
    });
    it("Div { width: 50%; height: 30px; border-width: 2; }", () => {
        compare("Div { width: 50%; height: 30px; border-width: 2; }");
    });
    it("Div {color:#212121;opacity:.9}", () => {
        compare("Div {color:#212121;opacity:.9}");
    });
    it("core.light.css", () => {
        const css = fs.readFileSync("./test/assets/core.light.css").toString();
        compare(css);
    });
    it("simple keyframe", () => {
        const css = `
            @keyframes example {
                0% { transform: scale(1, 1); }
                100% { transform: scale(1, 0); }
            }
            div {
                animation: example 5s linear 2s infinite alternate;
            }
        `;
        compare(css);
    });
    it("simple import", () => {
        const css = `
            @import url("mycomponent.css");
            @import url("mycomponent-print.css") print;
            div { background: red; }
        `;
        compare(css);
    });
});
