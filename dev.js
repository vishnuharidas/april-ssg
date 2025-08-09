import { spawn } from "child_process";
import fs from "fs";
import path from "path";

// Run as `$ npm run dev -- content-folder-name` for a specific folder. Defaults to "content" if not specified.
const contentDir = process.argv[2] || "content";

// Get the output and template directories from site config for moinitoring changes
const configPath = path.join(contentDir, "site.config.json");
let outputDir = "public"; // fallback
let templateDir = "template"; // fallback

if (fs.existsSync(configPath)) {
    const siteConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
    outputDir = siteConfig.dirs.output ? path.join(contentDir, siteConfig.dirs.output) : outputDir;
    templateDir = siteConfig.dirs.templates ? path.join(contentDir, siteConfig.dirs.templates) : templateDir;
} else {
    console.error(`‼️ Error: Config file not found at ${configPath}`);
    process.exit(1);
}

// If templateDir doesn't exist, there's no point in running the dev server, exit.
if (!fs.existsSync(templateDir)) {
    console.error(`‼️ Error: Template directory not found at ${templateDir}`);
    process.exit(1);
}

// Commands
const nodemonCmd = `nodemon --watch build.js --watch ${contentDir} --watch ${templateDir} --ext html,md,css,json --exec npm run build -- ${contentDir}`;
const serverCmd = `http-server -p 8080 -c-1 -- ${outputDir}`;

// Use concurrently as a subprocess
const proc = spawn("npx", ["concurrently", `"${nodemonCmd}"`, `"${serverCmd}"`], {
    stdio: "inherit",
    shell: true,
});
