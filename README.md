# CSS Parser
[https://www.w3.org/TR/css-syntax-3](https://www.w3.org/TR/css-syntax-3)

The parser is implemented following the spec but may have slight variations.
Parse error handling was not priority, while performance and Apache 2.0 was.
[Parsing reasoning about performance is based on some baseline tests, you can read more here](https://panayotcankov.github.io/nativescript-3.3.0-css-parser/).

## Contributions
Yes plsease,

To compile and run the tests:
```bash
npm i
npm test
```
This will also generate test coverage in the `coverage/lcov-report/index.html`.
There are coverage goals, try not to break them.

During development, there is a typescript watcher that will rerun tests upon .ts save:
```
npm run test
```

Debugging should be available in VSCode via the "Mocha Tests" configuration.

Style rules follow tslint settings, linter executes upon `npm test` you can also:
```
npm run tslint
npm run tslint-fix
```
