import {
    CustomTransformers,
    Identifier,
    isCallExpression,
    isNewExpression,
    isSourceFile,
    setSyntheticLeadingComments,
    SourceFile,
    SyntaxKind,
    TransformerFactory,
    visitEachChild,
    visitNode,
    type Node,
    type Visitor,
} from 'typescript';

const markPureFunctions = (
    pureFunctions: string[],
    before: boolean,
): TransformerFactory<SourceFile> => {
    return (context) => {
        const visit: Visitor<Node, Node> = (node) => {
            if (isCallExpression(node) || isNewExpression(node)) {
                let hasPure;
                if (before) {
                    const functionName = node.expression.getText().trim();
                    hasPure = pureFunctions.includes(functionName);
                } else {
                    const identifier = node.expression as Identifier;
                    const helperName = (identifier.escapedText as string) || '';
                    // pos < 0 - нет позиции в изначальном файле - был добавлен после
                    hasPure =
                        identifier.pos < 0 &&
                        helperName &&
                        pureFunctions.includes(helperName);
                }

                if (hasPure) {
                    setSyntheticLeadingComments(node, [
                        {
                            pos: -1,
                            end: -1,
                            hasTrailingNewLine: false,
                            text: ' @__PURE__ ',
                            kind: SyntaxKind.MultiLineCommentTrivia,
                        },
                    ]);
                }
            }

            return visitEachChild(node, (child) => visit(child), context);
        };

        return (node) => visitNode(node, visit, isSourceFile);
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

export const pureFunctionMarker = (): CustomTransformers => {
    return {
        before: [markPureFunctions(pureFunctions, true)],
        after: [markPureFunctions(pureTsHelpers, false)],
    };
};
