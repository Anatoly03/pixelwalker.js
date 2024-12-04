import * as fs from "node:fs";
import { assert, expect, test } from "vitest";

/**
 * Test if all relative imports end with `.js` extension.
 */
test("relative imports should contain `.js` extension", async () => {
    const files = await fs.promises.readdir("src", { recursive: true });
    const problems = files
        .filter((file) => file.endsWith(".ts"))
        .map((file) => ["src/" + file, fs.readFileSync("src/" + file).toString("utf-8")])
        .map(
            ([name, file]) =>
                [
                    name,
                    file
                        .split("\n")
                        .filter((line) => line.startsWith("import"))
                        .filter((line) => line.match(/from\s+('|")(\..*?)('|")/gm))
                        .filter((line) => !line.includes("js")),
                ] as const
        )
        .flatMap(([name, lines]) => lines.map((l) => `${name}: ${l}`));

    expect(problems.length == 0, '\n' + problems.join('\n') + 'files above do not follow import convention.\n').toBe(true);
});
