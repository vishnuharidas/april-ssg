#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import http from 'http';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputPath = process.argv[2] || 'content';
const contentDir = path.isAbsolute(inputPath) ? inputPath : path.resolve(process.cwd(), inputPath);
const configPath = path.join(contentDir, 'site.config.json');

if (!fs.existsSync(configPath)) {
  console.error(`‼️ Error: Config file not found at ${configPath}`);
  process.exit(1);
}

const siteConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const outputDir = path.isAbsolute(siteConfig.dirs.output)
  ? siteConfig.dirs.output
  : path.join(contentDir, siteConfig.dirs.output);
const templateDir = path.isAbsolute(siteConfig.dirs.templates)
  ? siteConfig.dirs.templates
  : path.join(contentDir, siteConfig.dirs.templates);

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html': return 'text/html; charset=utf-8';
    case '.css': return 'text/css; charset=utf-8';
    case '.js': return 'application/javascript; charset=utf-8';
    case '.json': return 'application/json; charset=utf-8';
    case '.xml': return 'application/xml; charset=utf-8';
    case '.svg': return 'image/svg+xml';
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.gif': return 'image/gif';
    case '.ico': return 'image/x-icon';
    default: return 'application/octet-stream';
  }
}

function serveStatic(dir, port = 8080) {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split('?')[0]);
    let filePath = path.join(dir, urlPath);
    try {
      const stat = fs.existsSync(filePath) && fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }
    } catch {}

    // Clean-URL fallback: if no file found and no extension, try appending .html
    if (!fs.existsSync(filePath) && path.extname(filePath) === '') {
      const htmlCandidate = `${filePath}.html`;
      if (fs.existsSync(htmlCandidate)) {
        filePath = htmlCandidate;
      }
    }

    if (!fs.existsSync(filePath)) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('404 Not Found');
      return;
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', contentTypeFor(filePath));
    fs.createReadStream(filePath).pipe(res);
  });

  server.listen(port, () => {
    console.log(`▶ Preview server running at http://localhost:${port}`);
  });

  return server;
}

let building = false;
let pending = false;

function runBuild() {
  if (building) { pending = true; return; }
  building = true;
  console.log('⌛️ Building...');
  const child = spawn(process.execPath, [path.join(__dirname, 'build.js'), contentDir], { stdio: 'inherit' });
  child.on('exit', (code) => {
    building = false;
    if (pending) {
      pending = false;
      runBuild();
    } else if (code === 0) {
      console.log('✅ Build complete.');
    } else {
      console.error(`‼️ Build failed with code ${code}`);
    }
  });
}

function watchDir(dir) {
  if (!fs.existsSync(dir)) return;
  const exts = new Set(['.md', '.markdown', '.html', '.css', '.json']);
  const debounce = (fn, ms) => {
    let t; return () => { clearTimeout(t); t = setTimeout(fn, ms); };
  };
  const schedule = debounce(runBuild, 150);

  try {
    fs.watch(dir, { recursive: true }, (_event, filename) => {
      if (!filename) return schedule();
      const ext = path.extname(filename.toString()).toLowerCase();
      if (exts.has(ext)) schedule();
    });
  } catch {
    // Fallback non-recursive
    fs.watch(dir, {}, (_event, filename) => {
      if (!filename) return schedule();
      const ext = path.extname(filename.toString()).toLowerCase();
      if (exts.has(ext)) schedule();
    });
  }
}

// Initial build then serve and watch
runBuild();
serveStatic(outputDir, 8080);
watchDir(contentDir);
watchDir(templateDir);
