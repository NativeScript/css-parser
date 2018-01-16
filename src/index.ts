import { Declaration } from "shady-css-parser/dist/shady-css/common";

export interface Stylesheet {
    type: "stylesheet";
    stylesheet: {
        rules: Rule[];
        parsingErrors: string[];
    };
}
export type AtRule = ImportAtRule | AtRuleToken;
export type Rule = QualifiedRule | StyleRule | AtRule;

/**
 * An at-rule generated when no specific parsing can be found for an at-rule.
 * The CSS level 3 spec describes how to parse at-rules in general when more specific rules
 * for e. g. @import, @keyframes etc. are part of separate specs and added as extensions to the CSS parser.
 */
export interface AtRuleToken {
    type: "at-rule";
    name: string;
    prelude: InputToken[];
    block: SimpleBlock;
    position?: Source;
}
export interface ImportAtRule {
    type: "import";
    import: string;
    position?: Source;
}
export interface QualifiedRule {
    type: "qualified-rule";
    prelude: InputToken[];
    block: SimpleBlock;
}
export interface StyleRule {
    type: "rule";
    selectors: string[];
    declarations: Array<Decl | AtRule>;
    position?: Source;
}
export interface Decl {
    type: "declaration";
    property: string;
    value: string;
    position?: Source;
}
export interface Source {
    start: Position;
    end: Position;
}
export interface Position {
    line: number;
    column: number;
}
const whitespaceRegEx = /[\s\t\n\r\f]*/gym;

const singleQuoteStringRegEx = /'((?:[^\n\r\f\\']|\\(?:\$|\n|[0-9a-fA-F]{1,6}\s?|'))*)(?:'|$)/gym; // Besides $n, parse escape
const doubleQuoteStringRegEx = /"((?:[^\n\r\f\\"]|\\(?:\$|\n|[0-9a-fA-F]{1,6}\s?|"))*)(?:"|$)/gym; // Besides $n, parse escape
const commentRegEx = /(\/\*(?:[^\*]|\*[^\/])*\*\/)/gym;
const numberRegEx = /[\+\-]?(?:\d+\.\d+|\d+|\.\d+)(?:[eE][\+\-]?\d+)?/gym;
const nameRegEx = /-?(?:(?:[a-zA-Z_]|[^\x00-\x7F]|\\(?:\$|\n|[0-9a-fA-F]{1,6}\s?))(?:(?:[a-zA-Z_0-9\-]|[^\x00-\x7F])*|\\(?:\$|\n|[0-9a-fA-F]{1,6}\s?))*)/gym;
const nonQuoteURLRegEx = /(:?[^\)\s\t\n\r\f\'\"\(]|\\(?:\$|\n|[0-9a-fA-F]{1,6}\s?))*/gym; // TODO: non-printable code points omitted

type SimpleTokens = "(" | ")" | "{" | "}" | "[" | "]" | ":" | ";" | "," | " " | "^=" | "|=" | "$=" | "*=" | "~=" | "<!--" | "-->";
type ObjectTokens = StringToken | DelimToken | NumberToken | PercentageToken | DimensionToken | IdentToken | URLToken | FunctionToken | SimpleBlock | Comment | AtKeywordToken | HashToken | FunctionObject | UnicodeRangeToken;

type InputToken = SimpleTokens | ObjectTokens;

const endianTokenMap = {
    "[": "]" as "]",
    "{": "}" as "}",
    "(": ")" as ")",
};

export function toString(token: InputToken): string {
    if (typeof token === "string") {
        return token;
    }
    switch (token.type) {
        case TokenType.functionObject: return token.name + "(" + token.components.map(toString).join("") + ")";
        case TokenType.simpleBlock: return token.associatedToken + token.values.map(toString).join("") + endianTokenMap[token.associatedToken];
    }
    return token.source;
}

export const enum TokenType {
    /**
     * <string-token>
     */
    string = 1,
    /**
     * <delim-token>
     */
    delim = 2,
    /**
     * <number-token>
     */
    number = 3,
    /**
     * <percentage-token>
     */
    percentage = 4,
    /**
     * <dimension-token>
     */
    dimension = 5,
    /**
     * <ident-token>
     */
    ident = 6,
    /**
     * <url-token>
     */
    url = 7,
    /**
     * <function-token>
     * This is a token indicating a function's leading: <ident-token>(
     */
    functionToken = 8,
    /**
     * <simple-block>
     */
    simpleBlock = 9,
    /**
     * <comment-token>
     */
    comment = 10,
    /**
     * <at-keyword-token>
     */
    atKeyword = 11,
    /**
     * <hash-token>
     */
    hash = 12,
    /**
     * <function>
     * This is a complete consumed function: <function-token>([<component-value> [, <component-value>]*])")"
     */
    functionObject = 14,
    /**
     * Unicode range token.
     * U+AB00?? or U+FFAA-FFFF like range of unicode tokens.
     */
    unicodeRange = 15,
}

interface StringToken {
    type: TokenType.string;
    source: string;
    text: string;
}
interface DelimToken {
    type: TokenType.delim;
    source: string;
}
interface NumberToken {
    type: TokenType.number;
    source: string;
}
interface PercentageToken {
    type: TokenType.percentage;
    source: string;
}
interface DimensionToken {
    type: TokenType.dimension;
    source: string;
}
interface IdentToken {
    type: TokenType.ident;
    source: string;
    name: string;
}
interface URLToken {
    type: TokenType.url;
    source: string;
    url: string;
}
/**
 * This is an "<ident>(" token.
 */
interface FunctionToken {
    type: TokenType.functionToken;
    source: string;
    name: string;
}
interface SimpleBlock {
    type: TokenType.simpleBlock;
    associatedToken: "(" | "{" | "[";
    values: InputToken[];
}
/**
 * Plese note, the tokenizer filters the comment tokens according to the spec.
 */
interface Comment {
    type: TokenType.comment;
    source: string;
}
interface AtKeywordToken {
    type: TokenType.atKeyword;
    source: string;
    name: string;
}
interface HashToken {
    type: TokenType.hash;
    source: string;
    name: string;
}
/**
 * This is a completely parsed function like "<ident>([component [, component]*])".
 */
interface FunctionObject {
    type: TokenType.functionObject;
    name: string;
    components: any[];
}
interface UnicodeRangeToken {
    type: TokenType.unicodeRange;
    source: string;
    start: number;
    end: number;
}

function isHex(char: string): boolean {
    return (char >= "0" && char <= "9") ||
        (char >= "a" && char <= "f") ||
        (char >= "A" && char <= "F");
}

/**
 * 4. Tokenization
 * https://www.w3.org/TR/css-syntax-3/#tokenization
 */
export class Tokenizer {

    protected static escape(text: string): string {
        if (text.indexOf("\\") === -1) {
            return text;
        }
        return text.replace(Tokenizer.stringEscapeRegex, (_, utf8, char, nl) => {
            if (utf8) {
                const code = "0x" + utf8;
                const charFromCode = String.fromCharCode(parseInt(code, 16));
                return charFromCode;
            } else if (char) {
                return char;
            } else {
                return "";
            }
        });
    }
    private static stringEscapeRegex = /\\(?:([a-fA-F0-9]{1,6})\s?|(.)|(\n))/g;

    private line: number;
    private lineStartIndex: number;
    private lineEndIndex: number;

    private prevInputCodePointIndex: number;
    private nextInputCodePointIndex: number;
    private text: string;

    public tokenize(text: string): InputToken[] {
        this.reset(text);
        const tokens: InputToken[] = [];
        let inputToken: InputToken;
        while (inputToken = this.consumeAToken()) {
            tokens.push(inputToken);
        }
        return tokens;
    }

    public start(): Position {
        return this.readNextLine(this.prevInputCodePointIndex);
    }

    public end(): Position {
        return this.readNextLine(this.nextInputCodePointIndex);
    }

    /**
     * 4.3.1. Consume a token
     * https://www.w3.org/TR/css-syntax-3/#consume-a-token
     */
    public consumeAToken(): InputToken {
        this.prevInputCodePointIndex = this.nextInputCodePointIndex;
        const char = this.text[this.nextInputCodePointIndex];
        switch (char) {
            case "\"": return this.consumeAStringToken();
            case "'": return this.consumeAStringToken();
            case "(":
            case ")":
            case ",":
            case ":":
            case ";":
            case "[":
            case "]":
            case "{":
            case "}":
            this.nextInputCodePointIndex++;
            return char as any;
            case "#": return this.consumeAHashToken() || this.consumeADelimToken();
            case " ":
            case "\t":
            case "\n":
            case "\r":
            case "\f":
            return this.consumeAWhitespace();
            case "@": return this.consumeAtKeyword() || this.consumeADelimToken();
            case "\\":
            if (this.text[this.nextInputCodePointIndex + 1] === "\n") {
                // TODO: Log parse error.
                this.nextInputCodePointIndex++;
                return { type: TokenType.delim, source: "\\" };
            }
            return this.consumeAnIdentLikeToken();
            case "0":
            case "1":
            case "2":
            case "3":
            case "4":
            case "5":
            case "6":
            case "7":
            case "8":
            case "9":
            return this.consumeANumericToken();
            case "u":
            case "U":
            if (this.text[this.nextInputCodePointIndex + 1] === "+") {
                const thirdChar = this.text[this.nextInputCodePointIndex + 2];
                if (isHex(thirdChar) || thirdChar === "?") {
                    this.nextInputCodePointIndex += 2;
                    return this.consumeAUnicodeRangeToken();
                }
            }
            return this.consumeAnIdentLikeToken();
            case "$":
            case "*":
            case "^":
            case "|":
            case "~":
            return this.consumeAMatchToken() || this.consumeADelimToken();
            case "-": return this.consumeANumericToken() || this.consumeAnIdentLikeToken() || this.consumeCDC() || this.consumeADelimToken();
            case "+":
            case ".":
            return this.consumeANumericToken() || this.consumeADelimToken();
            case "/": return this.consumeAComment() || this.consumeADelimToken();
            case "<": return this.consumeCDO() || this.consumeADelimToken();
            case undefined: return undefined;
            default: return this.consumeAnIdentLikeToken() || this.consumeADelimToken();
        }
    }

    protected reset(text: string) {
        this.text = text;
        this.nextInputCodePointIndex = 0;

        this.lineStartIndex = 0;
        this.lineEndIndex = -1;
        this.line = 1;
    }

    private readNextLine(index: number): Position {
        if (this.lineEndIndex === -1) {
            this.lineEndIndex = this.text.indexOf("\n");
            if (this.lineEndIndex === -1) {
                this.lineEndIndex = this.text.length;
            }
        }
        while (index > this.lineEndIndex) {
            this.lineStartIndex = this.lineEndIndex + 1;
            this.lineEndIndex = this.text.indexOf("\n", this.lineEndIndex + 1);
            if (this.lineEndIndex === -1) {
                this.lineEndIndex = this.text.length;
            }
            this.line++;
        }
        const column = index - this.lineStartIndex + 1;
        return { line: this.line, column };
    }

    private consumeADelimToken(): InputToken {
        return { type: TokenType.delim, source: this.text[this.nextInputCodePointIndex++] };
    }

    private consumeAWhitespace(): InputToken {
        whitespaceRegEx.lastIndex = this.nextInputCodePointIndex;
        const result = whitespaceRegEx.exec(this.text);
        this.nextInputCodePointIndex = whitespaceRegEx.lastIndex;
        return " ";
    }

    private consumeAHashToken(): HashToken {
        const startInputCodePointIndex = this.nextInputCodePointIndex++;
        const hashName = this.consumeAName();
        if (hashName) {
            return { type: TokenType.hash, source: this.text.substring(startInputCodePointIndex, this.nextInputCodePointIndex), name: hashName.name };
        }
        this.nextInputCodePointIndex--;
        return null;
    }

    private consumeCDO(): "<!--" | null {
        if (this.text.substr(this.nextInputCodePointIndex, 4) === "<!--") {
            this.nextInputCodePointIndex += 4;
            return "<!--";
        }
        return null;
    }

    private consumeCDC(): "-->" | null {
        if (this.text.substr(this.nextInputCodePointIndex, 3) === "-->") {
            this.nextInputCodePointIndex += 3;
            return "-->";
        }
        return null;
    }

    private consumeAMatchToken(): "*=" | "$=" | "|=" | "~=" | "^=" | null {
        if (this.text[this.nextInputCodePointIndex + 1] === "=") {
            const token = this.text.substr(this.nextInputCodePointIndex, 2);
            this.nextInputCodePointIndex += 2;
            return token as "*=" | "$=" | "|=" | "~=" | "^=";
        }
        return null;
    }

    /**
     * 4.3.2. Consume a numeric token
     * https://www.w3.org/TR/css-syntax-3/#consume-a-numeric-token
     */
    private consumeANumericToken(): InputToken {
        const startInputCodePointIndex = numberRegEx.lastIndex = this.nextInputCodePointIndex;
        const result = numberRegEx.exec(this.text);
        if (!result) {
            return null;
        }
        this.nextInputCodePointIndex = numberRegEx.lastIndex;
        if (this.text[this.nextInputCodePointIndex] === "%") {
            this.nextInputCodePointIndex++;
            // value: parseFloat(result[0])
            return { type: TokenType.percentage, source: this.text.substring(startInputCodePointIndex, this.nextInputCodePointIndex) };
        }

        const name = this.consumeAName();
        if (name) {
            // value: parseFloat(result[0]), unit: name.text
            return { type: TokenType.dimension, source: this.text.substring(startInputCodePointIndex, this.nextInputCodePointIndex) };
        }

        return { type: TokenType.number, source: this.text.substring(startInputCodePointIndex, this.nextInputCodePointIndex) };
    }

    /**
     * 4.3.3. Consume an ident-like token
     * https://www.w3.org/TR/css-syntax-3/#consume-an-ident-like-token
     */
    private consumeAnIdentLikeToken(): IdentToken | URLToken | FunctionToken {
        const startInputCodePointIndex = this.nextInputCodePointIndex;
        const nameToken = this.consumeAName();
        if (!nameToken) {
            return null;
        }
        if (this.text[this.nextInputCodePointIndex] === "(") {
            this.nextInputCodePointIndex++;
            if (nameToken.name.toLowerCase() === "url") {
                return this.consumeAURLToken();
            }
            return { type: TokenType.functionToken, source: this.text.substring(startInputCodePointIndex, this.nextInputCodePointIndex), name: nameToken.name } as FunctionToken;
        }
        return nameToken;
    }

    /**
     * 4.3.4. Consume a string token
     * https://www.w3.org/TR/css-syntax-3/#consume-a-string-token
     */
    private consumeAStringToken(): StringToken {
        const startInputCodePointIndex = this.nextInputCodePointIndex;
        const char = this.text[this.nextInputCodePointIndex];
        let result: RegExpExecArray;

        // TODO: Handle bad-string.
        if (char === "'") {
            singleQuoteStringRegEx.lastIndex = this.nextInputCodePointIndex;
            result = singleQuoteStringRegEx.exec(this.text);
            if (!result) {
                return null;
            }
            this.nextInputCodePointIndex = singleQuoteStringRegEx.lastIndex;
        } else if (char === "\"") {
            doubleQuoteStringRegEx.lastIndex = this.nextInputCodePointIndex;
            result = doubleQuoteStringRegEx.exec(this.text);
            if (!result) {
                return null;
            }
            this.nextInputCodePointIndex = doubleQuoteStringRegEx.lastIndex;
        }
        const text = Tokenizer.escape(result[1]);
        return { type: TokenType.string, source: this.text.substring(startInputCodePointIndex, this.nextInputCodePointIndex), text };
    }

    /**
     * 4.3.5. Consume a url token
     * https://www.w3.org/TR/css-syntax-3/#consume-a-url-token
     */
    private consumeAURLToken(): URLToken {
        const startInputCodePointIndex = this.nextInputCodePointIndex - 4; // The "url(" has been consumed allready
        this.consumeAWhitespace();
        if (this.nextInputCodePointIndex >= this.text.length) {
            return { type: TokenType.url, source: this.text.substring(startInputCodePointIndex, this.nextInputCodePointIndex), url: "" };
        }
        const nextInputCodePoint = this.text[this.nextInputCodePointIndex];
        if (nextInputCodePoint === "\"" || nextInputCodePoint === "'") {
            const stringToken = this.consumeAStringToken();
            // TODO: Handle bad-string.
            this.consumeAWhitespace();
            if (this.text[this.nextInputCodePointIndex] === ")" || this.nextInputCodePointIndex >= this.text.length) {
                this.nextInputCodePointIndex++;
                return { type: TokenType.url, source: this.text.substring(startInputCodePointIndex, this.nextInputCodePointIndex), url: stringToken.text };
            } else {
                // TODO: Handle bad-url.
                return null;
            }
        }

        let url = "";
        while (this.nextInputCodePointIndex < this.text.length) {
            const char = this.text[this.nextInputCodePointIndex++];
            switch (char) {
                case ")": return { type: TokenType.url, source: this.text.substring(startInputCodePointIndex, this.nextInputCodePointIndex), url };
                case " ":
                case "\t":
                case "\n":
                case "\r":
                case "\f":
                    this.consumeAWhitespace();
                    if (this.text[this.nextInputCodePointIndex] === ")") {
                        this.nextInputCodePointIndex++;
                        return { type: TokenType.url, source: this.text.substring(startInputCodePointIndex, this.nextInputCodePointIndex), url };
                    } else {
                        // TODO: Bar url! Consume remnants.
                        return null;
                    }
                case "\"":
                case "\'":
                    // TODO: Parse error! Bar url! Consume remnants.
                    return null;
                case "\\":
                    // TODO: Escape!
                    throw new Error("Escaping not yet supported!");
                default:
                    // TODO: Non-printable chars - error.
                    url += char;
            }
        }
        return { type: TokenType.url, source: this.text.substring(startInputCodePointIndex, this.nextInputCodePointIndex), url };
    }

    /**
     * 4.3.6. Consume a unicode-range token
     * https://www.w3.org/TR/css-syntax-3/#consume-a-unicode-range-token
     */
    private consumeAUnicodeRangeToken(): UnicodeRangeToken {
        const startInputCodePointIndex = this.nextInputCodePointIndex - 2; // "U+"" has been consumed
        let hexStart = this.nextInputCodePointIndex;
        while (this.nextInputCodePointIndex - hexStart < 6 && isHex(this.text[this.nextInputCodePointIndex])) {
            this.nextInputCodePointIndex++;
        }
        let hexEnd = this.nextInputCodePointIndex;
        while (this.nextInputCodePointIndex - hexStart < 6 && this.text[this.nextInputCodePointIndex] === "?") {
            this.nextInputCodePointIndex++;
        }
        const wildcardEnd = this.nextInputCodePointIndex;
        if (wildcardEnd !== hexEnd) {
            // There were question tokens
            const str = this.text.substring(hexStart, wildcardEnd);
            const start = parseInt("0x" + str.replace(/\?/g, "0"), 16);
            const end = parseInt("0x" + str.replace(/\?/g, "F"), 16);
            return { type: TokenType.unicodeRange, source: this.text.substring(startInputCodePointIndex, this.nextInputCodePointIndex), start, end };
        } else {
            const startStr = this.text.substring(hexStart, wildcardEnd);
            const start = parseInt("0x" + startStr, 16);
            if (this.text[this.nextInputCodePointIndex] === "-" && isHex(this.text[this.nextInputCodePointIndex + 1])) {
                this.nextInputCodePointIndex++;
                hexStart = this.nextInputCodePointIndex;
                while (this.nextInputCodePointIndex - hexStart < 6 && isHex(this.text[this.nextInputCodePointIndex])) {
                    this.nextInputCodePointIndex++;
                }
                hexEnd = this.nextInputCodePointIndex;
                const endStr = this.text.substr(hexStart, hexEnd);
                const end = parseInt("0x" + endStr, 16);
                return { type: TokenType.unicodeRange, source: this.text.substring(startInputCodePointIndex, this.nextInputCodePointIndex), start, end };
            }

            return { type: TokenType.unicodeRange, source: this.text.substring(startInputCodePointIndex, this.nextInputCodePointIndex), start, end: start };
        }
    }

    /**
     * 4.3.11. Consume a name
     * https://www.w3.org/TR/css-syntax-3/#consume-a-name
     */
    private consumeAName(): IdentToken {
        const startInputCodePointIndex = this.nextInputCodePointIndex;
        nameRegEx.lastIndex = this.nextInputCodePointIndex;
        const result = nameRegEx.exec(this.text);
        if (!result) {
            return null;
        }
        this.nextInputCodePointIndex = nameRegEx.lastIndex;
        const name = Tokenizer.escape(result[0]);
        return { type: TokenType.ident, source: this.text.substring(startInputCodePointIndex, this.nextInputCodePointIndex), name };
    }

    private consumeAtKeyword(): AtKeywordToken {
        const startInputCodePointIndex = this.nextInputCodePointIndex;
        this.nextInputCodePointIndex++;
        const nameToken = this.consumeAName();
        if (nameToken) {
            return { type: TokenType.atKeyword, source: this.text.substring(startInputCodePointIndex, this.nextInputCodePointIndex), name: nameToken.name };
        }
        this.nextInputCodePointIndex--;
        return null;
    }

    private consumeAComment(): InputToken {
        if (this.text[this.nextInputCodePointIndex + 1] === "*") {
            commentRegEx.lastIndex = this.nextInputCodePointIndex;
            const result = commentRegEx.exec(this.text);
            if (!result) {
                return null; // TODO: Handle <bad-comment>
            }
            this.nextInputCodePointIndex = commentRegEx.lastIndex;
            // The CSS spec tokenizer does not emmit comment tokens
            return this.consumeAToken();
        }
        return null;
    }
}

type TokenMap = (consumeAToken: () => InputToken) => () => InputToken;

const enum ParseState {
    Default = 0,
    ListOfDeclarations = 1,
    Declaration = 2,
}

interface AtRuleParser {
    (this: Parser, reconsumedInputToken: AtKeywordToken): AtRule;
    keyword?: string;
}

const defaultAtRuleParser: AtRuleParser = function(this: Parser, reconsumedInputToken: AtKeywordToken): AtRuleToken {
    const start = this.debug && this.start();
    const atRule: AtRuleToken = {
        type: "at-rule",
        name: reconsumedInputToken.name,
        prelude: [],
        block: undefined,
    };
    let inputToken: InputToken;
    while (inputToken = this.consumeAToken()) {
        if (inputToken === ";") {
            break;
        } else if (inputToken === "{") {
            atRule.block = this.consumeASimpleBlock(inputToken);
            break;
        } else if (typeof inputToken === "object" && inputToken.type === TokenType.simpleBlock && inputToken.associatedToken === "{") {
            atRule.block = inputToken as SimpleBlock;
            break;
        }
        const component = this.consumeAComponentValue(inputToken);
        if (component) {
            atRule.prelude.push(component);
        }
    }
    if (this.debug) {
        const end = this.end();
        atRule.position = { start, end };
    }
    return atRule;
};

/**
 * https://drafts.csswg.org/css-cascade-3/#at-ruledef-import
 * Minimal @import parser to cover rework @import rules parser.
 */
export const importParser: AtRuleParser = function(this: Parser, reconsumedInputToken: AtKeywordToken): ImportAtRule {
    const rule = defaultAtRuleParser.call(this, reconsumedInputToken);
    const type = "import";
    const imp = rule.prelude.map(toString).join("").trim();
    const position = rule.position;
    return position ? { type, import: imp, position } : { type, import: imp };
};
importParser.keyword = "import";

/**
 * https://www.w3.org/TR/css-animations-1/#keyframes
 */
const keyframesParser: AtRuleParser = function(this: Parser, reconsumedInputToken: AtKeywordToken): AtRuleToken {
    return defaultAtRuleParser.call(this, reconsumedInputToken);
};
keyframesParser.keyword = "keyframes";

/**
 * 5. Parsing
 * https://www.w3.org/TR/css-syntax-3/#parsing
 */
export class Parser extends Tokenizer {
    /**
     * Adds line and column infomration about declarations.
     */
    public debug: boolean = true;

    protected parsingCSS: boolean;
    protected topLevelFlag: boolean;
    protected parseState: ParseState;

    private atRuleParsers: { [keyword: string]: AtRuleParser } = {};

    public addAtRuleParser(atRuleParser: AtRuleParser) {
        this.atRuleParsers[atRuleParser.keyword] = atRuleParser;
    }

    public consumeAToken(): InputToken {
        if (this.parseState === ParseState.Default) {
            return super.consumeAToken();
        }
        let inputToken: InputToken;
        while (inputToken = super.consumeAToken()) {
            if (inputToken === "}") {
                this.parseState = ParseState.Default;
                return undefined;
            }
            inputToken = this.consumeAComponentValue(inputToken);
            if (inputToken) {
                break;
            }
        }
        if (this.parseState === ParseState.ListOfDeclarations) {
            return inputToken;
        }
        if (inputToken === ";") {
            this.parseState = ParseState.ListOfDeclarations;
            return undefined;
        }
        return inputToken;
    }

    /**
     * 5.3.1. Parse a stylesheet
     * https://www.w3.org/TR/css-syntax-3/#parse-a-stylesheet
     */
    public parseAStylesheet(text: string): Stylesheet {
        this.reset(text);
        this.parsingCSS = false;
        this.topLevelFlag = true;
        const stylesheet: Stylesheet = {
            type: "stylesheet",
            stylesheet: {
                rules: this.consumeAListOfRules(),
                parsingErrors: [],
            },
        };
        return stylesheet;
    }

    /**
     * 8. CSS stylesheets
     * https://www.w3.org/TR/css-syntax-3/#css-stylesheets
     */
    public parseACSSStylesheet(text: string): Stylesheet {
        this.reset(text);
        this.parsingCSS = true;
        this.topLevelFlag = true;
        this.parseState = ParseState.Default;
        const stylesheet: Stylesheet = {
            type: "stylesheet",
            stylesheet: {
                rules: this.consumeAListOfRules(),
                parsingErrors: [],
            },
        };
        return stylesheet;
    }

    /**
     * 5.4.6. Consume a component value
     * https://www.w3.org/TR/css-syntax-3/#consume-a-component-value
     */
    public consumeAComponentValue(reconsumedInputToken: InputToken): InputToken {
        switch (reconsumedInputToken) {
            case "{":
            case "[":
            case "(":
                return this.consumeASimpleBlock(reconsumedInputToken);
        }
        if (typeof reconsumedInputToken === "object" && reconsumedInputToken.type === TokenType.functionToken) {
            return this.consumeAFunction((reconsumedInputToken as FunctionToken).name);
        }
        return reconsumedInputToken;
    }

    /**
     * 5.4.7. Consume a simple block
     * https://www.w3.org/TR/css-syntax-3/#consume-a-simple-block
     */
    public consumeASimpleBlock(associatedToken: "[" | "{" | "("): SimpleBlock {
        const endianToken = endianTokenMap[associatedToken];
        const block: SimpleBlock = {
            type: TokenType.simpleBlock,
            associatedToken,
            values: [],
        };
        let inputToken: InputToken;
        while (inputToken = this.consumeAToken()) {
            if (inputToken === endianToken) {
                return block;
            }
            const value = this.consumeAComponentValue(inputToken);
            if (value) {
                block.values.push(value);
            }
        }
        return block;
    }

    protected reset(text: string): void {
        super.reset(text);
        this.parseState = ParseState.Default;
    }

    /**
     * 5.4.1. Consume a list of rules
     * https://www.w3.org/TR/css-syntax-3/#consume-a-list-of-rules
     */
    protected consumeAListOfRules(): Rule[] {
        const rules: Rule[] = [];
        let inputToken: InputToken;
        while (inputToken = this.consumeAToken()) {
            switch (inputToken) {
                case " ": continue;
                case "<!--":
                case "-->":
                    if (this.topLevelFlag) {
                        continue;
                    }
                    const atRule = this.consumeAQualifiedRule(inputToken);
                    if (atRule) {
                        rules.push(atRule);
                    }
                    continue;
            }
            if (typeof inputToken === "object" && inputToken.type === TokenType.atKeyword) {
                const atRule = this.consumeAnAtRule(inputToken);
                if (atRule) {
                    rules.push(atRule);
                }
                continue;
            }
            const qualifiedRule = this.consumeAQualifiedRule(inputToken);
            if (qualifiedRule) {
                rules.push(qualifiedRule);
            }
        }
        return rules;
    }

    /**
     * 5.4.2. Consume an at-rule
     * https://www.w3.org/TR/css-syntax-3/#consume-an-at-rule
     */
    protected consumeAnAtRule(reconsumedInputToken: AtKeywordToken): AtRule {
        const atRuleParser = this.atRuleParsers[reconsumedInputToken.name] || defaultAtRuleParser;
        return atRuleParser.call(this, reconsumedInputToken);
    }

    /**
     * 5.4.3. Consume a qualified rule
     * https://www.w3.org/TR/css-syntax-3/#consume-a-qualified-rule
     */
    protected consumeAQualifiedRule(reconsumedInputToken: InputToken): Rule {
        // See 8: https://www.w3.org/TR/css-syntax-3/#css-stylesheets
        if (this.treatQualifiedRulesAsStyleRules()) {
            return this.consumeAStyleRule(reconsumedInputToken);
        }

        const qualifiedRule: QualifiedRule = {
            type: "qualified-rule",
            prelude: [],
            block: undefined,
        };
        let inputToken: InputToken = reconsumedInputToken;
        do {
            if (inputToken === "{") {
                const block = this.consumeASimpleBlock(inputToken);
                qualifiedRule.block = block;
                return qualifiedRule;
            } else if (typeof inputToken === "object" && inputToken.type === TokenType.simpleBlock) {
                const simpleBlock: SimpleBlock = inputToken as SimpleBlock;
                if (simpleBlock.associatedToken === "{") {
                    qualifiedRule.block = simpleBlock;
                    return qualifiedRule;
                }
            }
            const componentValue = this.consumeAComponentValue(inputToken);
            if (componentValue) {
                qualifiedRule.prelude.push(componentValue);
            }
        } while (inputToken = this.consumeAToken());
        // TODO: This is a parse error, log parse errors!
        return null;
    }

    /**
     * 5.4.4. Consume a list of declarations
     * https://www.w3.org/TR/css-syntax-3/#consume-a-list-of-declarations
     */
    protected consumeAListOfDeclarations(): Array<Decl | AtRule> {
        const declarations: Array<Decl | AtRule> = [];
        let inputToken: InputToken;
        // NOTE: We may need to treat the "}" as EOF here...
        while (inputToken = this.consumeAToken()) {
            if (this.parseState === ParseState.Default) { break; }
            if (typeof inputToken === "string") {
                if (inputToken === " " || inputToken === ";") {
                    // Do nothing
                    continue;
                }
            } else if (typeof inputToken === "object") {
                if (inputToken.type === TokenType.atKeyword) {
                    declarations.push(this.consumeAnAtRule(inputToken));
                    continue;
                }
                if (inputToken.type === TokenType.ident) {
                    // While the current input token is anything other than a <semicolon-token> or <EOF-token>,
                    // append it to the temporary list and consume the next input token.
                    // Consume a declaration from the temporary list.
                    this.parseState = ParseState.Declaration;
                    const declaration = this.consumeADeclaration(inputToken as IdentToken);
                    if (declaration) { declarations.push(declaration); }
                    if (this.parseState as ParseState === ParseState.Default) { break; }
                    continue;
                }
            }

            // TODO: Log parse error!
            while ((inputToken = this.consumeAComponentValue(this.consumeAToken())) && inputToken && inputToken !== ";") {
                // Error recovery!
            }
            if (!inputToken) {
                break;
            }
        }
        return declarations;
    }

    /**
     * 5.4.5. Consume a declaration
     * https://www.w3.org/TR/css-syntax-3/#consume-a-declaration
     */
    protected consumeADeclaration(reconsumedInputToken: IdentToken): Decl {
        const start = this.debug && this.start();
        const property = reconsumedInputToken.name;
        let inputToken: InputToken;
        do {
            inputToken = this.consumeAToken();
        } while (inputToken === " ");
        if (inputToken !== ":") {
            return null; // TODO: Parse error!
        }

        let value = "";
        while (inputToken = this.consumeAToken()) {
            value += toString(inputToken);
        }
        value = value.trim();

        const end = this.debug && this.start();
        // TODO: If the last non-whitespace tokens are delim "!" and ident "important",
        // delete them and set the declaration's "important" flag.
        if (this.debug) {
            return { type: "declaration", property, value: value as any, position: { start, end } };
        } else {
            return { type: "declaration", property, value: value as any };
        }
    }

    /**
     * 5.4.8. Consume a function
     * https://www.w3.org/TR/css-syntax-3/#consume-a-function
     */
    protected consumeAFunction(name: string): InputToken {
        const functionToken: FunctionObject = { type: TokenType.functionObject, name, components: [] };
        let inputToken: InputToken;
        while (inputToken = this.consumeAToken()) {
            if (inputToken === ")") {
                return functionToken;
            }
            const component = this.consumeAComponentValue(inputToken);
            if (component) {
                functionToken.components.push(component);
            }
        }
        return functionToken;
    }

    protected treatQualifiedRulesAsStyleRules(): boolean {
        return this.parsingCSS && this.topLevelFlag;
    }

    /**
     * 8.1. Style rules
     * https://www.w3.org/TR/css-syntax-3/#style-rules
     */
    protected consumeAStyleRule(reconsumedInputToken: InputToken): Rule {
        const start = this.debug && this.start();
        const selectors: string[] = [];
        let selector = "";
        let inputToken: InputToken = reconsumedInputToken;
        do {
            if (inputToken === "{") {
                selector = selector.trim();
                if (selector) {
                    selectors.push(selector);
                }
                this.parseState = ParseState.ListOfDeclarations;
                const declarations = this.consumeAListOfDeclarations();
                const end = this.debug && this.end();
                if (this.debug) {
                    return { type: "rule", selectors, declarations, position: { start, end } };
                } else {
                    return { type: "rule", selectors, declarations };
                }
            } else if (typeof inputToken === "object" && inputToken.type === TokenType.simpleBlock) {
                const simpleBlock: SimpleBlock = inputToken as SimpleBlock;
                if (simpleBlock.associatedToken === "{") {
                    // TODO:
                    throw new Error("A simple block was found where just a { token was expected!");
                }
            }
            const componentValue = this.consumeAComponentValue(inputToken);
            if (componentValue) {
                if (componentValue === ",") {
                    selector = selector.trim();
                    if (selector) {
                        selectors.push(selector);
                    }
                    selector = "";
                } else {
                    selector += toString(componentValue);
                }
            }
        } while (inputToken = this.consumeAToken());
        // TODO: This is a parse error, log parse errors!
        return null;
    }
}
