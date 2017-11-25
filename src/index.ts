import { Declaration } from "shady-css-parser/dist/shady-css/common";

export interface Stylesheet {
    type: "stylesheet";
    stylesheet: {
        rules: Rule[];
        parsingErrors: string[];
    };
}
export type Rule = QualifiedRule | AtRule | StyleRule;

export interface AtRule {
    type: "at-rule";
    name: string;
    prelude: InputToken[];
    block: SimpleBlock;
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
    position: Source;
}
export interface Decl {
    type: "declaration";
    property: string;
    value: string;
    position: Source;
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
const nameRegEx = /-?(?:(?:[a-zA-Z_]|[^\x00-\x7F]|\\(?:\$|\n|[0-9a-fA-F]{1,6}\s?))(?:[a-zA-Z_0-9\-]*|\\(?:\$|\n|[0-9a-fA-F]{1,6}\s?))*)/gym;
const nonQuoteURLRegEx = /(:?[^\)\s\t\n\r\f\'\"\(]|\\(?:\$|\n|[0-9a-fA-F]{1,6}\s?))*/gym; // TODO: non-printable code points omitted

type SimpleTokens = "(" | ")" | "{" | "}" | "[" | "]" | ":" | ";" | "," | " " | "^=" | "|=" | "$=" | "*=" | "~=" | "<!--" | "-->";
type ObjectTokens = StringToken | DelimToken | NumberToken | Percentage | DimensionToken | IdentToken | URLToken | FunctionToken | SimpleBlock | Comment | AtKeywordToken | HashToken | FunctionObject | UnicodeRangeToken;

type InputToken = SimpleTokens | ObjectTokens;

const endianTokenMap = {
    "[": "]" as "]",
    "{": "}" as "}",
    "(": ")" as ")",
};

const toCompressedStringMap: { [key: number]: (inputToken: InputToken) => string } = {
    [undefined as any](token: SimpleTokens) { return token; },
    [TokenType.string](token: StringToken) { return "'" + token.text + "'"; },
    [TokenType.delim](token: DelimToken) { return token.text; },
    [TokenType.number](token: NumberToken) { return token.text; },
    [TokenType.percentage](token: Percentage) { return token.text + "%"; },
    [TokenType.dimension](token: DimensionToken) { return token.text; },
    [TokenType.ident](token: URLToken) { return token.text; },
    [TokenType.functionToken](token: FunctionToken) { return token.text + "("; },
    [TokenType.simpleBlock](token: SimpleBlock) {
        return token.associatedToken + token.values.map(toString).join("") + endianTokenMap[token.associatedToken];
    },
    [TokenType.comment](token: Comment) { return "/**/"; },
    [TokenType.atKeyword](token: AtKeywordToken) { return "@" + token.text; },
    [TokenType.hash](token: HashToken) { return "#" + token.text; },
    [TokenType.functionObject](token: FunctionObject) {
        return token.name + "(" + token.components.map(toString).join("") + ")";
    },
    [TokenType.unicodeRange](token: UnicodeRangeToken): never {
        throw new Error("Not implemented");
    },
};

export function toString(token: InputToken): string {
    return toCompressedStringMap[(token as any).type](token);
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
    text: string;
}
interface DelimToken {
    type: TokenType.delim;
    text: string;
}
interface NumberToken {
    type: TokenType.number;
    text: string;
}
interface Percentage {
    type: TokenType.percentage;
    text: string;
}
interface DimensionToken {
    type: TokenType.dimension;
    text: string;
}
interface IdentToken {
    type: TokenType.ident;
    text: string;
}
interface URLToken {
    type: TokenType.url;
    text: string;
}
/**
 * This is an "<ident>(" token.
 */
interface FunctionToken {
    type: TokenType.functionToken;
    text: string;
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
    text: string;
}
interface AtKeywordToken {
    type: TokenType.atKeyword;
    text: string;
}
interface HashToken {
    type: TokenType.hash;
    text: string;
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
        return text.replace(/\\[a-fA-F0-9]{1,6}\s?/g, (s) => {
                const code = "0x" + s.substr(1);
                const char = String.fromCharCode(parseInt(code, 16));
                return char;
            })
            .replace(/\\(?:.|\n)/g, (s) => {
                if (s[1] === "\n") { return ""; }
                return s[1];
            });
    }

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

    protected reset(text: string) {
        this.text = text;
        this.nextInputCodePointIndex = 0;

        this.lineStartIndex = 0;
        this.lineEndIndex = -1;
        this.line = 1;
    }

    protected start(): Position {
        return this.readNextLine(this.prevInputCodePointIndex);
    }

    protected end(): Position {
        return this.readNextLine(this.nextInputCodePointIndex);
    }

    /**
     * 4.3.1. Consume a token
     * https://www.w3.org/TR/css-syntax-3/#consume-a-token
     */
    protected consumeAToken(): InputToken {
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
                return { type: TokenType.delim, text: "\\" };
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
        return { type: TokenType.delim, text: this.text[this.nextInputCodePointIndex++] };
    }

    private consumeAWhitespace(): InputToken {
        whitespaceRegEx.lastIndex = this.nextInputCodePointIndex;
        const result = whitespaceRegEx.exec(this.text);
        this.nextInputCodePointIndex = whitespaceRegEx.lastIndex;
        return " ";
    }

    private consumeAHashToken(): HashToken {
        this.nextInputCodePointIndex++;
        const hashName = this.consumeAName();
        if (hashName) {
            return { type: TokenType.hash, text: hashName.text };
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
        numberRegEx.lastIndex = this.nextInputCodePointIndex;
        const result = numberRegEx.exec(this.text);
        if (!result) {
            return null;
        }
        this.nextInputCodePointIndex = numberRegEx.lastIndex;
        if (this.text[this.nextInputCodePointIndex] === "%") {
            this.nextInputCodePointIndex++;
            return { type: TokenType.percentage, text: result[0] };
        }

        const name = this.consumeAName();
        if (name) {
            return { type: TokenType.dimension, text: result[0] + name.text };
        }

        return { type: TokenType.number, text: result[0] };
    }

    /**
     * 4.3.3. Consume an ident-like token
     * https://www.w3.org/TR/css-syntax-3/#consume-an-ident-like-token
     */
    private consumeAnIdentLikeToken(): InputToken {
        const name = this.consumeAName();
        if (!name) {
            return null;
        }
        if (this.text[this.nextInputCodePointIndex] === "(") {
            this.nextInputCodePointIndex++;
            if (name.text.toLowerCase() === "url") {
                return this.consumeAURLToken();
            }
            return { type: TokenType.functionToken, text: name.text } as FunctionToken;
        }
        return name;
    }

    /**
     * 4.3.4. Consume a string token
     * https://www.w3.org/TR/css-syntax-3/#consume-a-string-token
     */
    private consumeAStringToken(): StringToken {
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
        return { type: TokenType.string, text };
    }

    /**
     * 4.3.5. Consume a url token
     * https://www.w3.org/TR/css-syntax-3/#consume-a-url-token
     */
    private consumeAURLToken(): InputToken {
        this.consumeAWhitespace();
        if (this.nextInputCodePointIndex >= this.text.length) {
            return { type: TokenType.url, text: "" };
        }
        const nextInputCodePoint = this.text[this.nextInputCodePointIndex];
        if (nextInputCodePoint === "\"" || nextInputCodePoint === "'") {
            const stringToken = this.consumeAStringToken();
            // TODO: Handle bad-string.
            this.consumeAWhitespace();
            if (this.text[this.nextInputCodePointIndex] === ")" || this.nextInputCodePointIndex >= this.text.length) {
                this.nextInputCodePointIndex++;
                return { type: TokenType.url, text: stringToken.text };
            } else {
                // TODO: Handle bad-url.
                return null;
            }
        }

        let text = "";
        while (this.nextInputCodePointIndex < this.text.length) {
            const char = this.text[this.nextInputCodePointIndex++];
            switch (char) {
                case ")": return { type: TokenType.url, text };
                case " ":
                case "\t":
                case "\n":
                case "\r":
                case "\f":
                    this.consumeAWhitespace();
                    if (this.text[this.nextInputCodePointIndex] === ")") {
                        this.nextInputCodePointIndex++;
                        return { type: TokenType.url, text };
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
                    text += char;
            }
        }
        return { type: TokenType.url, text };
    }

    /**
     * 4.3.6. Consume a unicode-range token
     * https://www.w3.org/TR/css-syntax-3/#consume-a-unicode-range-token
     */
    private consumeAUnicodeRangeToken(): UnicodeRangeToken {
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
            return { type: TokenType.unicodeRange, start, end };
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
                return { type: TokenType.unicodeRange, start, end };
            }

            return { type: TokenType.unicodeRange, start, end: start };
        }
    }

    /**
     * 4.3.11. Consume a name
     * https://www.w3.org/TR/css-syntax-3/#consume-a-name
     */
    private consumeAName(): IdentToken {
        nameRegEx.lastIndex = this.nextInputCodePointIndex;
        const result = nameRegEx.exec(this.text);
        if (!result) {
            return null;
        }
        this.nextInputCodePointIndex = nameRegEx.lastIndex;
        const text = Tokenizer.escape(result[0]);
        return { type: TokenType.ident, text };
    }

    private consumeAtKeyword(): AtKeywordToken {
        this.nextInputCodePointIndex++;
        const name = this.consumeAName();
        if (name) {
            return { type: TokenType.atKeyword, text: name.text };
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

/**
 * 5. Parsing
 * https://www.w3.org/TR/css-syntax-3/#parsing
 */
export class Parser extends Tokenizer {

    protected parsingCSS: boolean;
    protected topLevelFlag: boolean;
    protected parseState: ParseState;

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
                // TODO: Better typechecking...
                const atRule = this.consumeAnAtRule(inputToken as AtKeywordToken);
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
        const atRule: AtRule = {
            type: "at-rule",
            name: reconsumedInputToken.text, // TODO: What if it is not an @whatever?
            prelude: [],
            block: undefined,
        };
        let inputToken: InputToken;
        while (inputToken = this.consumeAToken()) {
            if (inputToken === ";") {
                return atRule;
            } else if (inputToken === "{") {
                atRule.block = this.consumeASimpleBlock(inputToken);
                return atRule;
            } else if (typeof inputToken === "object" && inputToken.type === TokenType.simpleBlock && inputToken.associatedToken === "{") {
                atRule.block = inputToken as SimpleBlock;
                return atRule;
            }
            const component = this.consumeAComponentValue(inputToken);
            if (component) {
                atRule.prelude.push(component);
            }
        }
        return atRule;
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
        const start = this.start();
        const property = reconsumedInputToken.text;
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

        const end = this.start();
        // TODO: If the last non-whitespace tokens are delim "!" and ident "important",
        // delete them and set the declaration's "important" flag.
        return { type: "declaration", property, value: value as any, position: { start, end } };
    }

    /**
     * 5.4.6. Consume a component value
     * https://www.w3.org/TR/css-syntax-3/#consume-a-component-value
     */
    protected consumeAComponentValue(reconsumedInputToken: InputToken): InputToken {
        switch (reconsumedInputToken) {
            case "{":
            case "[":
            case "(":
                return this.consumeASimpleBlock(reconsumedInputToken);
        }
        if (typeof reconsumedInputToken === "object" && reconsumedInputToken.type === TokenType.functionToken) {
            return this.consumeAFunction((reconsumedInputToken as FunctionToken).text);
        }
        return reconsumedInputToken;
    }

    /**
     * 5.4.7. Consume a simple block
     * https://www.w3.org/TR/css-syntax-3/#consume-a-simple-block
     */
    protected consumeASimpleBlock(associatedToken: "[" | "{" | "("): SimpleBlock {
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

    protected consumeAToken(): InputToken {
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
     * 8.1. Style rules
     * https://www.w3.org/TR/css-syntax-3/#style-rules
     */
    protected consumeAStyleRule(reconsumedInputToken: InputToken): Rule {
        const start = this.start();
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
                const end = this.end();
                return { type: "rule", selectors, declarations, position: { start, end } };
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
