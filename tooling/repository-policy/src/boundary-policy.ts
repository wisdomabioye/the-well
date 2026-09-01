import { readFile } from "node:fs/promises";
import { relative, sep } from "node:path";
import ts from "typescript";

function moduleSpecifiers(
  contents: string,
  filename: string,
): readonly string[] {
  const source = ts.createSourceFile(
    filename,
    contents,
    ts.ScriptTarget.Latest,
    true,
  );
  const specifiers: string[] = [];
  function visit(node: ts.Node): void {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      specifiers.push(node.moduleSpecifier.text);
    }
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length === 1 &&
      node.arguments[0] &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      specifiers.push(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return specifiers;
}

function isSharedSource(relativePath: string): boolean {
  return relativePath.startsWith(["packages", "shared", "src", ""].join(sep));
}

export async function findBoundaryViolations(
  root: string,
  files: readonly string[],
): Promise<readonly string[]> {
  const violations: string[] = [];
  for (const file of files.filter((path) => /\.[cm]?[jt]sx?$/.test(path))) {
    const path = relative(root, file);
    const imports = moduleSpecifiers(await readFile(file, "utf8"), file);
    for (const imported of imports) {
      if (
        !imported.startsWith(".") &&
        (imported.includes("/src/") || imported.includes("/test/"))
      ) {
        violations.push(`${path} imports private module ${imported}.`);
      }
      if (
        isSharedSource(path) &&
        !imported.startsWith(".") &&
        imported !== "zod" &&
        !imported.startsWith("@ador/shared/")
      ) {
        violations.push(
          `${path} imports runtime-specific dependency ${imported}.`,
        );
      }
    }
  }
  return violations;
}
