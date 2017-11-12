// Reference mocha-typescript's global definitions:
/// <reference path="../node_modules/mocha-typescript/globals.d.ts" />

import { assert } from "chai";
import { Parser, Tokenizer, TokenType } from "../src/index";

describe("css", () => {
    let parser: Parser;
    before("create parser", () => parser = new Parser());
    after("dispose parser", () => parser = null);
    describe("tokenize", () => {
        it("Button { background: red; }", () => {
            const tokens = [...new Tokenizer("Button { background: red; }")];
            assert.deepEqual(tokens, [
                { type: TokenType.ident, text: "Button" },
                " ", "{", " ",
                { type: TokenType.ident, text: "background" },
                ":", " ",
                { type: TokenType.ident, text: "red" },
                ";", " ", "}",
            ]);
        });
        it("@import url(~/app.css); Button { color: orange; }", () => {
            const tokens = [...new Tokenizer("@import url(~/app.css); Button { color: orange; }")];
            assert.deepEqual(tokens, [
                { type: TokenType.atKeyword, text: "import" },
                " ",
                { type: TokenType.url, text: "~/app.css" },
                ";", " ",
                { type: TokenType.ident, text: "Button" },
                " ", "{", " ",
                { type: TokenType.ident, text: "color" },
                ":", " ",
                { type: TokenType.ident, text: "orange" },
                ";", " ", "}",
            ]);
        });
        it("some", () => {
            const css = `Button {
                background: rgba(255, 0, 0, 1);
                width: 25%;
            }`;
            const tokens = [...new Tokenizer(css)];
            assert.deepEqual(tokens, [
                { type: TokenType.ident, text: "Button" },
                " ", "{", " ",
                { type: TokenType.ident, text: "background" },
                ":", " ",
                { type: TokenType.functionToken, text: "rgba" },
                { type: TokenType.number, text: "255" },
                ",", " ",
                { type: TokenType.number, text: "0" },
                ",", " ",
                { type: TokenType.number, text: "0" },
                ",", " ",
                { type: TokenType.number, text: "1" },
                ")", ";", " ",
                { type: TokenType.ident, text: "width" },
                ":", " ",
                { type: TokenType.percentage, text: "25%" },
                ";", " ", "}",
            ]);
        });
        it("@keyframes", () => {
            const css = `@keyframes mymove {
                from { top: 0px; }
                to { top: 200px; }
            }`;
            const tokens = [...new Tokenizer(css)];
            assert.deepEqual(tokens, [
                { type: TokenType.atKeyword, text: "keyframes" },
                " ",
                { type: TokenType.ident, text: "mymove" },
                " ", "{", " ",
                { type: TokenType.ident, text: "from" },
                " ", "{", " ",
                { type: TokenType.ident, text: "top" },
                ":", " ",
                { type: TokenType.dimension, text: "0px" },
                ";", " ", "}", " ",
                { type: TokenType.ident, text: "to" },
                " ", "{", " ",
                { type: TokenType.ident, text: "top" },
                ":", " ",
                { type: TokenType.dimension, text: "200px" },
                ";", " ", "}", " ", "}",
            ]);
        });
        it("linear-gradient(rgba(...", () => {
            const css = `Button {
                background: linear-gradient(-90deg, rgba(255, 0, 0, 0), blue, #FFFF00, #00F);
            }`;
            const tokens = [...new Tokenizer(css)];
            assert.deepEqual(tokens, [
                { type: TokenType.ident, text: "Button" },
                " ", "{", " ",
                { type: TokenType.ident, text: "background" },
                ":", " ",
                { type: TokenType.functionToken, text: "linear-gradient" },
                { type: TokenType.dimension, text: "-90deg" },
                ",", " ",
                { type: TokenType.functionToken, text: "rgba" },
                { type: TokenType.number, text: "255" },
                ",", " ",
                { type: TokenType.number, text: "0" },
                ",", " ",
                { type: TokenType.number, text: "0" },
                ",", " ",
                { type: TokenType.number, text: "0" },
                ")", ",", " ",
                { type: TokenType.ident, text: "blue" },
                ",", " ",
                { type: TokenType.hash, text: "FFFF00" },
                ",", " ",
                { type: TokenType.delim, text: "#" },
                { type: TokenType.dimension, text: "00F" },
                ")", ";", " ", "}",
            ]);
        });
        it("string tokens", () => {
            const css = `Button {
                font: "\\54 ah'o\\"ma";
                font: "Taho${"\\\n"}ma";
                font: 'Tahoma"';
            }`;
            const tokens = [...new Tokenizer(css)];
            assert.deepEqual(tokens, [
                { type: TokenType.ident, text: "Button" },
                " ", "{", " ",
                { type: TokenType.ident, text: "font" },
                ":", " ",
                { type: TokenType.string, text: "Tah'o\"ma" },
                ";", " ",
                { type: TokenType.ident, text: "font" },
                ":", " ",
                { type: TokenType.string, text: "Tahoma" },
                ";", " ",
                { type: TokenType.ident, text: "font" },
                ":", " ",
                { type: TokenType.string, text: "Tahoma\"" },
                ";", " ", "}",
            ]);
        });
        it("escaped ident", () => {
            const css = `\\42utton { color: red; }`;
            const tokens = [...new Tokenizer(css)];
            assert.deepEqual(tokens, [
                { type: TokenType.ident, text: "Button" },
                " ", "{", " ",
                { type: TokenType.ident, text: "color" },
                ":", " ",
                { type: TokenType.ident, text: "red" },
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
            const tokens = [...new Tokenizer(css)];
            assert.deepEqual(tokens, [
                " ",
                { type: TokenType.ident, text: "unicode-range" },
                ":", " ",
                { type: TokenType.unicodeRange, start: 38, end: 38 },
                ";", " ", " ",
                { type: TokenType.ident, text: "unicode-range" },
                ":", " ",
                { type: TokenType.unicodeRange, start: 0, end: 127 },
                ";", " ",
                { type: TokenType.ident, text: "unicode-range" },
                ":", " ",
                { type: TokenType.unicodeRange, start: 37, end: 255 },
                ";", " ", " ",
                { type: TokenType.ident, text: "unicode-range" },
                ":", " ",
                { type: TokenType.unicodeRange, start: 1024, end: 1279 },
                ";", " ", " ",
                { type: TokenType.ident, text: "unicode-range" },
                ":", " ",
                { type: TokenType.unicodeRange, start: 37, end: 255 },
                ",", " ",
                { type: TokenType.unicodeRange, start: 1024, end: 1279 },
                ";", " ", " ",
            ]);
        });
        it("match selector", () => {
            const css = `*[title~="flower"] { border: 5px solid yellow; }`;
            const tokens = [...new Tokenizer(css)];
            assert.deepEqual(tokens, [
                { type: TokenType.delim, text: "*" },
                "[",
                { type: TokenType.ident, text: "title" },
                "~=",
                { type: TokenType.string, text: "flower" },
                "]", " ", "{", " ",
                { type: TokenType.ident, text: "border" },
                ":", " ",
                { type: TokenType.dimension, text: "5px" },
                " ",
                { type: TokenType.ident, text: "solid" },
                " ",
                { type: TokenType.ident, text: "yellow" },
                ";", " ", "}",
            ]);
        });
        it("numerics", () => {
            const css = `Button { width: .0; height: 100%; font-size: 10em; }`;
            const tokens = [...new Tokenizer(css)];
            assert.deepEqual(tokens, [
                { type: TokenType.ident, text: "Button" },
                " ", "{", " ",
                { type: TokenType.ident, text: "width" },
                ":", " ",
                { type: TokenType.number, text: ".0" },
                ";", " ",
                { type: TokenType.ident, text: "height" },
                ":", " ",
                { type: TokenType.percentage, text: "100%" },
                ";", " ",
                { type: TokenType.ident, text: "font-size" },
                ":", " ",
                { type: TokenType.dimension, text: "10em" },
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
            const tokens = [...new Tokenizer(css)];
            assert.deepEqual(tokens, [
                " ",
                { type: TokenType.atKeyword, text: "import" },
                " ",
                { type: TokenType.url, text: "~/app.css" },
                ";", " ",
                { type: TokenType.atKeyword, text: "import" },
                " ",
                { type: TokenType.url, text: "~/app.css" },
                ";", " ",
                { type: TokenType.ident, text: "Button" },
                " ", "{", " ",
                { type: TokenType.ident, text: "background" },
                ":", " ",
                { type: TokenType.url, text: "res://img1.jpg" },
                ";", " ", "}", " ",
                { type: TokenType.ident, text: "Label" },
                " ", "{", " ",
                { type: TokenType.ident, text: "background" },
                ":", " ",
                { type: TokenType.url, text: "res://img1.jpg" },
                ";", " ", "}", " ",
                { type: TokenType.ident, text: "TextField" },
                " ", "{", " ",
                { type: TokenType.ident, text: "background" },
                ":", " ",
                { type: TokenType.url, text: "res://img1.jpg" },
                ";", " ", "}", " ",
            ]);
        });
    });
    describe("parse", () => {
        it("Button { background: red; }", () => {
            const stylesheet = parser.parseAStylesheet("Button { background: red; }");
            assert.deepEqual(stylesheet, {
                rules: [
                    {
                        type: "qualified-rule",
                        prelude: [
                            {
                                type: TokenType.ident,
                                text: "Button",
                            },
                            " ",
                        ],
                        block: {
                            type: TokenType.simpleBlock,
                            associatedToken: "{",
                            values: [
                                " ",
                                { type: TokenType.ident, text: "background" },
                                ":", " ",
                                { type: TokenType.ident, text: "red" },
                                ";", " ",
                            ],
                        },
                    },
                ],
            });
        });
        it("@import url(~/app.css); Button { color: orange; }", () => {
            const stylesheet = parser.parseAStylesheet("@import url(~/app.css); Button { color: orange; }");
            assert.deepEqual(stylesheet, {
                rules: [
                    {
                        type: "at-rule",
                        name: "import",
                        prelude: [" ", { type: TokenType.url, text: "~/app.css" }],
                        block: undefined,
                    },
                    {
                        type: "qualified-rule",
                        prelude: [{ type: TokenType.ident, text: "Button" }, " "],
                        block: {
                            type: TokenType.simpleBlock,
                            associatedToken: "{",
                            values: [
                                " ",
                                { type: TokenType.ident, text: "color" },
                                ":", " ",
                                { type: TokenType.ident, text: "orange" },
                                ";", " ",
                            ],
                        },
                    },
                ],
            });
        });
        it("linear-gradient(rgba(...", () => {
            const css = `Button {
                background: linear-gradient(-90deg, rgba(255, 0, 0, 0), blue, #FFFF00, #00F);
            }`;
            const stylesheet = parser.parseAStylesheet(css);
            assert.deepEqual(stylesheet, {
                rules: [
                    {
                        type: "qualified-rule",
                        prelude: [{ type: TokenType.ident, text: "Button" }, " "],
                        block: {
                            associatedToken: "{",
                            type: TokenType.simpleBlock,
                            values: [
                                " ",
                                { type: TokenType.ident, text: "background" },
                                ":", " ",
                                {
                                    type: TokenType.functionTokenObject,
                                    name: "linear-gradient",
                                    components: [
                                        { type: TokenType.dimension, text: "-90deg" },
                                        ",", " ",
                                        {
                                            type: TokenType.functionTokenObject,
                                            name: "rgba",
                                            components: [
                                                { type: TokenType.number, text: "255" },
                                                ",", " ",
                                                { type: TokenType.number, text: "0" },
                                                ",", " ",
                                                { type: TokenType.number, text: "0" },
                                                ",", " ",
                                                { type: TokenType.number, text: "0" },
                                            ],
                                        },
                                        ",", " ",
                                        { type: TokenType.ident, text: "blue" },
                                        ",", " ",
                                        { type: TokenType.hash, text: "FFFF00" },
                                        ",", " ",
                                        { type: TokenType.delim, text: "#" },
                                        { type: TokenType.dimension, text: "00F" },
                                    ],
                                },
                                ";", " ",
                            ],
                        },
                    },
                ],
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
                rules: [
                    {
                        type: "at-rule",
                        name: "keyframes",
                        prelude: [" ", { type: TokenType.ident, text: "example" }, " "],
                        block: {
                            type: TokenType.simpleBlock,
                            associatedToken: "{",
                            values: [
                                " ",
                                { type: TokenType.percentage, text: "0%" },
                                " ",
                                {
                                    type: TokenType.simpleBlock,
                                    associatedToken: "{",
                                    values: [
                                        " ",
                                        { type: TokenType.ident, text: "transform" },
                                        ":", " ",
                                        {
                                            type: TokenType.functionTokenObject,
                                            name: "scale",
                                            components: [
                                                { type: TokenType.number, text: "1" },
                                                ",", " ",
                                                { type: TokenType.number, text: "1" },
                                            ],
                                        },
                                        ";", " ",
                                    ],
                                },
                                " ",
                                { type: TokenType.percentage, text: "100%" },
                                " ",
                                {
                                    type: TokenType.simpleBlock,
                                    associatedToken: "{",
                                    values: [
                                        " ",
                                        { type: TokenType.ident, text: "transform" },
                                        ":", " ",
                                        {
                                            type: TokenType.functionTokenObject,
                                            name: "scale",
                                            components: [
                                                { type: TokenType.number, text: "1" },
                                                ",", " ",
                                                { type: TokenType.number, text: "0" },
                                            ],
                                        },
                                        ";", " ",
                                    ],
                                },
                                " ",
                            ],
                        },
                    },
                    {
                        type: "qualified-rule",
                        prelude: [{ type: TokenType.ident, text: "div" }, " "],
                        block: {
                            associatedToken: "{",
                            type: TokenType.simpleBlock,
                            values: [
                                " ",
                                { type: TokenType.ident, text: "animation" },
                                ":", " ",
                                { type: TokenType.ident, text: "example" },
                                " ",
                                { type: TokenType.dimension, text: "5s" },
                                " ",
                                { type: TokenType.ident, text: "linear" },
                                " ",
                                { type: TokenType.dimension, text: "2s" },
                                " ",
                                { type: TokenType.ident, text: "infinite" },
                                " ",
                                { type: TokenType.ident, text: "alternate" },
                                ";",
                                " ",
                            ],
                        },
                    },
                ],
            });
        });
    });
});
