import {
    type CustomTransformers,
    type Identifier,
    isCallExpression,
    isNewExpression,
    isSourceFile,
    setSyntheticLeadingComments,
    type SourceFile,
    SyntaxKind,
    type TransformerFactory,
    visitEachChild,
    visitNode,
    type Node,
    type Visitor,
} from 'typescript';
import { pureFunctions } from './utils';

const markPureFunctions = (
    fns: string[],
    before: boolean,
): TransformerFactory<SourceFile> => {
    return (context) => {
        const visit: Visitor<Node, Node> = (node) => {
            if (isCallExpression(node) || isNewExpression(node)) {
                let hasPure;
                if (before) {
                    const functionName = node.expression.getText().trim();
                    hasPure = fns.includes(functionName);
                } else {
                    const identifier = node.expression as Identifier;
                    const helperName = (identifier.escapedText as string) || '';
                    // pos < 0 - нет позиции в изначальном файле - был добавлен после
                    hasPure =
                        identifier.pos < 0 &&
                        helperName &&
                        fns.includes(helperName);
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

const pureTsHelpers = ['___spreadArrays'];

export const pureFunctionMarker = (): CustomTransformers => {
    return {
        before: [markPureFunctions(pureFunctions, true)],
        after: [markPureFunctions(pureTsHelpers, false)],
    };
};
