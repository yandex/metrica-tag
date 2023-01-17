import ts from 'typescript';

export const markPureFunctions = <T extends ts.Node>(
    pureFunctions: string[],
    before: boolean,
): ts.TransformerFactory<T> => {
    return (context) => {
        const visit: ts.Visitor = (node) => {
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

        return (node) => ts.visitNode(node, visit);
    };
};

export const pureFunctions = [
    'curry',
    'memo',
    'pipe',
    'noop',
    'Construct',
    'AsyncMap',
    'ctxPath',
    'ctxMap',
    'cMap',
    'ctxFilter',
    'cFilter',
    'ctxIncludes',
    'ctxIndexOf',
    'ctxJoin',
    'ctxErrorLogger',
    'bindThisForMethod',
    'bindThisForMethodTest',
    'isNativeFunction',
    'firstArg',
    'cSome',
    'cFind',
    'bindArg',
    'isNativeFunction',
    'getNativeFunction',
    'flatMap',
    'arrayJoin',
    'equal',
    'watchSyncFlags',
    'isLengthCorrect',
    'getFieldList',
    'useLegacyEcommerce',
    'toNativeOrFalse',
    'convertToString',
];

export const pureTsHelpers = ['___spreadArrays'];
