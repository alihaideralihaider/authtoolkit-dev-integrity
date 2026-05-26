import fs from "node:fs";

const packageJsonPath = new URL("../package.json", import.meta.url);
const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
const scripts = pkg.scripts || {};
const disallowed = ["preinstall", "install", "postinstall"].filter(
  (name) => typeof scripts[name] === "string" && scripts[name].trim()
);

if (disallowed.length > 0) {
  console.error(
    `Disallowed package lifecycle script(s) found: ${disallowed.join(", ")}`
  );
  process.exit(1);
}

console.log("No disallowed package install lifecycle scripts found.");
