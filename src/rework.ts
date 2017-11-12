interface Position {
    line: number;
    column: number;
}
interface Span {
    start: Position;
    end: Position;
}
interface Rule {
    type: "rule";
    selectors: string[];
    declarations: Declaration[];
    position: Span;
}
interface Declaration {
    type: "declaration";
    property: "string";
    value: "strong";
    position: Span;
}
interface Stylesheet {
    type: "stylesheet";
    stylesheet: {
        rules: Rule[];
        parsingErrors: Error[];
    };
}

export function parse(css: string): Stylesheet {
    throw new Error("Not implemented!");
}
