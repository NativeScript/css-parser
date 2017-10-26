// Reference mocha-typescript's global definitions:
/// <reference path="../node_modules/mocha-typescript/globals.d.ts" />

import { CSS3Parser, TokenType } from "../src/index";
import { assert } from "chai";

describe("css", () => {
    describe("tokenize", () => {
        it("Button { background: red; }", () => {
            const parser = new CSS3Parser("Button { background: red; }");
            const tokens = parser.tokenize();
            assert.deepEqual(tokens, [
                { type: TokenType.ident, text: "Button" },
                " ", "{", " ",
                { type: TokenType.ident, text: "background" },
                ":", " ",
                { type: TokenType.ident, text: "red" },
                ";", " ", "}"
            ]);
        });
        it("@import url(~/app.css); Button { color: orange; }", () => {
            const parser = new CSS3Parser("@import url(~/app.css); Button { color: orange; }");
            const tokens = parser.tokenize();
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
                ";", " ", "}"
            ]);
        });
        it("@keyframes", () => {
            const css = `@keyframes mymove {
                from { top: 0px; }
                to { top: 200px; }
            }`;
            const parser = new CSS3Parser(css);
            const tokens = parser.tokenize();
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
                ";", " ", "}", " ", "}"
            ]);
        });
    });
});