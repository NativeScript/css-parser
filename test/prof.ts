/* tslint:disable */
import * as fs from "fs";
import * as nativescriptCss from '../src/index';
var profiler = require('v8-profiler');

const themeCoreLightIos = fs.readFileSync(`${__dirname}/assets/core.light.css`).toString();

profiler.startProfiling("parse", true);
const cssparser = new nativescriptCss.Parser();
cssparser.parseACSSStylesheet(themeCoreLightIos);
const profile = profiler.stopProfiling("parse");

profile.export(function(error: any, result: any) {
    fs.writeFileSync('profile1.json', result);
    profile.delete();
});
