import ts from 'typescript';

const markPureFunctions = (
    pureFunctions: string[],
    before: boolean,
): ts.TransformerFactory<ts.SourceFile> => {
    return (context) => {
        const visit: ts.Visitor<ts.Node, ts.Node> = (node) => {
            if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
                let hasPure;
                if (before) {
                    const functionName = node.expression.getText().trim();
                    hasPure = pureFunctions.includes(functionName);
                } else {
                    const identifier = node.expression as ts.Identifier;
                    const helperName = (identifier.escapedText as string) || '';
                    // pos < 0 - нет позиции в изначальном файле - был добавлен после
                    hasPure =
                        identifier.pos < 0 &&
                        helperName &&
                        pureFunctions.includes(helperName);
                }

                if (hasPure) {
                    ts.setSyntheticLeadingComments(node, [
                        {
                            pos: -1,
                            end: -1,
                            hasTrailingNewLine: false,
                            text: ' @__PURE__ ',
                            kind: ts.SyntaxKind.MultiLineCommentTrivia,
                        },
                    ]);
                }
            }

            return ts.visitEachChild(node, (child) => visit(child), context);
        };

        return (node) => ts.visitNode(node, visit, ts.isSourceFile);
    };
};

const pureFunctions = [
    'arrayJoin',
    'AsyncMap',
    'bindArg',
    'bindArgs',
    'bindThisForMethod',
    'bindThisForMethodTest',
    'cFilter',
    'cFind',
    'cMap',
    'Construct',
    'convertToString',
    'cReduce',
    'cSome',
    'ctxErrorLogger',
    'ctxFilter',
    'ctxIncludes',
    'ctxIndexOf',
    'ctxJoin',
    'ctxMap',
    'ctxPath',
    'curry2',
    'equal',
    'entries',
    'firstArg',
    'flatMap',
    'getFieldList',
    'getNativeFunction',
    'isLengthCorrect',
    'isNativeFunction',
    'memo',
    'noop',
    'pipe',
    'toNativeOrFalse',
    'useLegacyEcommerce',
    'watchSyncFlags',
];

const pureTsHelpers = ['___spreadArrays'];

export const pureFunctionMarker = (): ts.CustomTransformers => {
    return {
        before: [markPureFunctions(pureFunctions, true)],
        after: [markPureFunctions(pureTsHelpers, false)],
    };
};
