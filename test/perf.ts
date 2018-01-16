/* tslint:disable */
import * as reworkCssParse from 'css-parse';
import * as fs from "fs";
import * as shadyCss from 'shady-css-parser';
import * as nativescriptCss from '../src/index';
import { Tokenizer } from '../src/index';

const themeCoreLightIos = fs.readFileSync(`${__dirname}/assets/core.light.css`).toString();

function trapDuration(action: () => void) {
    const [startSec, startMSec] = process.hrtime();
    action();
    const [endSec, endMSec] = process.hrtime();
    return (endSec - startSec) * 1000 + (endMSec - startMSec) / 1000000;
}
const charCodeByCharCodeDuration = trapDuration(() => {
    let count = 0;
    for (let i = 0; i < themeCoreLightIos.length; i++) {
        count += themeCoreLightIos.charCodeAt(i);
    }
});
const charByCharDuration = trapDuration(() => {
    let char;
    for (let i = 0; i < themeCoreLightIos.length; i++) {
        char = themeCoreLightIos.charAt(i);
    }
});
const compareCharIfDuration = trapDuration(() => {
    let c = 0;
    for (let i = 0; i < themeCoreLightIos.length; i++) {
        const char = themeCoreLightIos[i];
        if ((char >= "a" && char <= "z") || (char >= "A" && char <= "Z") || char === "_") {
            c++;
        }
    }
});
const compareCharRegEx = /[a-zA-Z_]/;
const compareCharRegExDuration = trapDuration(() => {
    let char;
    let c = 0;
    for (let i = 0; i < themeCoreLightIos.length; i++) {
        const char = themeCoreLightIos[i];
        if (compareCharRegEx.test(char)) {
            c++;
        }
    }
});
const indexerDuration = trapDuration(() => {
    let char;
    for (let i = 0; i < themeCoreLightIos.length; i++) {
        char = themeCoreLightIos[i];
    }
});
const reworkDuration = trapDuration(() => {
    const ast = reworkCssParse(themeCoreLightIos, { source: "nativescript-theme-core/css/core.light.css" });
});
const shadyDuration = trapDuration(() => {
    const shadyParser = new shadyCss.Parser();
    const ast = shadyParser.parse(themeCoreLightIos);
});
const nativescriptParseDuration = trapDuration(() => {
    const cssparser = new nativescriptCss.CSSParser();
    // Shaved from 6.2 to 5.5 msecs.
    cssparser.debug = false;
    // TODO: Replace with parseAStylesheet when ready
    const stylesheet = cssparser.parseACSSStylesheet(themeCoreLightIos);
});
console.log(`Baseline perf: .charCodeAt: ${charCodeByCharCodeDuration.toFixed(3)}ms. .charAt: ${charByCharDuration.toFixed(3)}ms. []: ${indexerDuration.toFixed(3)}ms. compareCharIf: ${compareCharIfDuration.toFixed(3)}ms. compareCharRegEx: ${compareCharRegExDuration.toFixed(3)}ms.
Parsers perf: rework: ${reworkDuration.toFixed(3)}ms. shady: ${shadyDuration.toFixed(3)}ms. {N}: ${nativescriptParseDuration.toFixed(3)}ms.
`);
