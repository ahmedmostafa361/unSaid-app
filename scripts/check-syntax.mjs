import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const roots = ["src", "api", "scripts"];

const collect = (dir) =>
    readdirSync(dir).flatMap((name) => {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) return collect(full);
        return /\.(m?js)$/.test(name) ? [full] : [];
    });

const files = roots.flatMap(collect);
let failed = 0;

for (const file of files) {
    try {
        execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
    } catch (error) {
        failed += 1;
        console.error(`Syntax error in ${file}\n${error.stderr?.toString() ?? error.message}`);
    }
}

if (failed > 0) process.exit(1);

console.log(`Syntax OK in ${files.length} files`);
