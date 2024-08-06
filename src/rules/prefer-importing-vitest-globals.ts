import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils"
import {
  createEslintRule,
  getAccessorValue,
  isStringNode,
  isSupportedAccessor,
} from "src/utils"
import { getSourceCode } from "src/utils/msc"
import { parseVitestFnCall } from "src/utils/parse-vitest-fn-call"
import { VitestFnType } from "src/utils/types"
import { isIdentifier } from "typescript"

export const RULE_NAME = "prefer-importing-vitest-globals"

type MESSAGE_IDS = "preferImportingVitestGlobals"
type Options = []

const allVitestFnTypes: VitestFnType[] = [
  "suite",
  "test",
  "describe",
  "it",
  "expectTypeOf",
  "assertType",
  "expect",
  "assert",
  "vitest",
  "vi",
  "beforeAll",
  "afterAll",
  "beforeEach",
  "afterEach",
  "onTestFailed",
  "onTestFinished",
]

const createFixerImports = (
  isModule: boolean,
  functionsToImport: Set<string>
) => {
  const allImportsFormatted = Array.from(functionsToImport).sort().join(", ")

  return isModule
    ? `import { ${allImportsFormatted} } from 'vitest';`
    : `const { ${allImportsFormatted} } = require('vitest');`
}

export default createEslintRule<Options, MESSAGE_IDS>({
  name: RULE_NAME,
  meta: {
    docs: {
      description: "require vtest's globals to be explictly imported",
      recommended: false,
    },
    messages: {
      preferImportingVitestGlobals: `Import the following vitest functions from 'vitest': {{ vitestFunctions }}`,
    },
    fixable: "code",
    type: "problem",
    schema: [
      {
        type: "object",
        properties: {
          types: {
            type: "array",
            items: {
              type: "string",
              enum: allVitestFnTypes,
            },
          },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ types: allVitestFnTypes }],
  create(context) {
    const options = context.options[0]
    const { types = allVitestFnTypes } = options || { types: allVitestFnTypes }
    const importedFunctionsWithSource: Record<string, string> = {}
    const functionsToImport = new Set<string>()
    let reportingNode: TSESTree.Node

    return {
      ImportDeclaration(node: TSESTree.ImportDeclaration) {
        node.specifiers.forEach((specifier) => {
          if (specifier.type === AST_NODE_TYPES.ImportSpecifier) {
            importedFunctionsWithSource[specifier.local.name] =
              node.source.value
          }
        })
      },
      CallExpression(node: TSESTree.CallExpression) {
        const vitestFnCall = parseVitestFnCall(node, context)

        if (!vitestFnCall) {
          return
        }

        if (
          vitestFnCall.head.type !== "import" &&
          types.includes(vitestFnCall.type)
        ) {
          functionsToImport.add(vitestFnCall.name)
          reportingNode ||= vitestFnCall.head.node
        }
      },
      "Program:exit"() {
        // this means we found at least one function to import
        if (!reportingNode) {
          return
        }

        const isModule =
          context.languageOptions.parserOptions?.sourceType === "module"

        context.report({
          node: reportingNode,
          messageId: "preferImportingVitestGlobals",
          data: { vitestFunctions: Array.from(functionsToImport).join(", ") },
          fix(fixer) {
            const sourceCode = getSourceCode(context)
            const [firstNode] = sourceCode.ast.body

            // check if "use strict" directive exists
            if (
              firstNode.type === AST_NODE_TYPES.ExpressionStatement &&
              isStringNode(firstNode.expression, "use strict")
            ) {
              return fixer.insertTextAfter(
                firstNode,
                `\n${createFixerImports(isModule, functionsToImport)}`
              )
            }

            const importNode = sourceCode.ast.body.find(
              (node) =>
                node.type === AST_NODE_TYPES.ImportDeclaration &&
                node.source.value === "vitest"
            )

            if (importNode?.type === AST_NODE_TYPES.ImportDeclaration) {
              for (const specifier of importNode.specifiers) {
                if (
                  specifier.type === AST_NODE_TYPES.ImportSpecifier &&
                  specifier.imported?.name
                ) {
                  functionsToImport.add(specifier.imported.name)
                }

                if (specifier.type === AST_NODE_TYPES.ImportDefaultSpecifier) {
                  functionsToImport.add(specifier.local.name)
                }
              }

              return fixer.replaceText(
                importNode,
                createFixerImports(isModule, functionsToImport)
              )
            }

            const requireNode = sourceCode.ast.body.find(
              (node) =>
                node.type === AST_NODE_TYPES.VariableDeclaration &&
                node.declarations.some(
                  (declaration) =>
                    declaration.init?.type === AST_NODE_TYPES.CallExpression &&
                    isIdentifier(declaration.init.callee, "require") &&
                    isStringNode(declaration.init.arguments[0], "vitest") &&
                    (declaration.id.type === AST_NODE_TYPES.Identifier ||
                      declaration.id.type === AST_NODE_TYPES.ObjectPattern)
                )
            )

            if (requireNode?.type !== AST_NODE_TYPES.VariableDeclaration) {
              return fixer.insertTextBefore(
                reportingNode,
                `${createFixerImports(isModule, functionsToImport)}\n`
              )
            }

            if (
              requireNode.declarations[0]?.id.type ===
              AST_NODE_TYPES.ObjectPattern
            ) {
              for (const property of requireNode.declarations[0].id
                .properties) {
                if (
                  property.type === AST_NODE_TYPES.Property &&
                  isSupportedAccessor(property.key)
                ) {
                  functionsToImport.add(getAccessorValue(property.key))
                }
              }
            }

            return fixer.replaceText(
              requireNode,
              `${createFixerImports(isModule, functionsToImport)}`
            )
          },
        })
      },
    }
  },
})
