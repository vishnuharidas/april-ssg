#!/usr/bin/env node
import fs from 'fs';
import fsExtra from 'fs-extra';
import http from 'http';
import path from 'path';
import {
    buildAllPages,
    buildAllPosts,
    buildIndex,
    buildPage,
    buildPost,
    buildRss, buildTags, copyAssets,
    initMarked,
    initTemplates,
    loadConfig,
    loadCss,
} from './lib/build-helpers.js';


const inputPath = process.argv[2] || 'content';
const contentDir = path.isAbsolute(inputPath) ? inputPath : path.resolve(process.cwd(), inputPath);
const configPath = path.join(contentDir, 'site.config.json');

if (!fs.existsSync(configPath)) {
    console.error(`‼️ Error: Config file not found at ${configPath}`);
    process.exit(1);
}

// --- Build context and in-memory cache ---
let ctx;
let allPosts = [];
let allTags = {};

function fullBuild(clean = false) {
    ctx = loadConfig(contentDir);
    initTemplates(ctx);
    loadCss(ctx);
    initMarked(ctx);

    if (clean) {
        fsExtra.ensureDirSync(ctx.publicDir);
        fsExtra.emptyDirSync(ctx.publicDir);
    }
    fsExtra.ensureDirSync(ctx.publicPostsDir);

    buildAllPages(ctx);
    ({ allPosts, allTags } = buildAllPosts(ctx));
    buildIndex(allPosts, ctx);
    buildRss(allPosts, ctx);
    buildTags(allPosts, allTags, ctx);
    copyAssets(ctx);
}

function rebuildListPages() {
    buildIndex(allPosts, ctx);
    buildRss(allPosts, ctx);
    buildTags(allPosts, allTags, ctx);
}

function updatePostCache(postContent) {
    // Remove old entry for this post (by path) and insert the updated one
    allPosts = allPosts.filter(p => p.path !== postContent.path);
    allPosts.push(postContent);
    allPosts.sort((a, b) => b.date.dateObj - a.date.dateObj);

    // Rebuild allTags from scratch from allPosts
    allTags = {};
    for (const post of allPosts) {
        for (const tag of post.tags) {
            if (!allTags[tag]) allTags[tag] = [];
            allTags[tag].push(post);
        }
    }
    for (const tag in allTags) {
        allTags[tag].sort((a, b) => b.date.dateObj - a.date.dateObj);
    }
}

function incrementalBuild(changedFile) {
    const absPath = path.resolve(changedFile);
    const relToTemplates = path.relative(ctx.templateDir, absPath);

    // Config changed → full rebuild
    if (absPath === path.join(ctx.contentDir, 'site.config.json')) {
        console.log('🔄 Config changed — full rebuild');
        fullBuild();
        return;
    }

    // Template or CSS changed → reload templates/CSS, full re-render
    if (!relToTemplates.startsWith('..')) {
        console.log('🔄 Template/CSS changed — full rebuild');
        initTemplates(ctx);
        loadCss(ctx);
        // Re-render everything with new templates/CSS
        buildAllPages(ctx);
        // Re-render all post HTML files
        fs.readdirSync(ctx.postsDir).forEach(file => buildPost(file, ctx));
        rebuildListPages();
        return;
    }

    // Post changed → rebuild that post + list pages
    const relToPosts = path.relative(ctx.postsDir, absPath);
    if (!relToPosts.startsWith('..')) {
        const file = path.basename(absPath);
        console.log(`🔄 Post changed: ${file}`);
        const postContent = buildPost(file, ctx);
        if (postContent) {
            updatePostCache(postContent);
            rebuildListPages();
        }
        return;
    }

    // Page changed → rebuild just that page
    const relToPages = path.relative(ctx.pagesDir, absPath);
    if (!relToPages.startsWith('..')) {
        const file = path.basename(absPath);
        console.log(`🔄 Page changed: ${file}`);
        buildPage(file, ctx);
        return;
    }

    // Images or extras changed → copy assets
    const relToImages = path.relative(ctx.imagesDir, absPath);
    const relToExtras = path.relative(ctx.extrasDir, absPath);
    if (!relToImages.startsWith('..') || !relToExtras.startsWith('..')) {
        console.log('🔄 Assets changed — copying');
        copyAssets(ctx);
        return;
    }

    // Unknown change — full rebuild as fallback
    console.log('🔄 Unknown change — full rebuild');
    fullBuild();
}

// --- Static file server ---

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
        } catch { }

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

// --- File watcher with debounce ---

let building = false;
let pendingFile = null;

function runIncremental(changedFile) {
    if (building) { pendingFile = changedFile; return; }
    building = true;
    const start = Date.now();
    try {
        if (changedFile) {
            incrementalBuild(changedFile);
        } else {
            fullBuild(true);
        }
        console.log(`✅ Build complete. (${Date.now() - start}ms)`);
    } catch (err) {
        console.error(`‼️ Build failed:`, err.message);
    }
    building = false;
    if (pendingFile) {
        const next = pendingFile;
        pendingFile = null;
        runIncremental(next);
    }
}

function watchDir(dir) {
    if (!fs.existsSync(dir)) return;
    const exts = new Set(['.md', '.markdown', '.html', '.css', '.json', '.xml']);
    const debounce = (fn, ms) => {
        let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
    };
    const schedule = debounce((filename) => runIncremental(filename), 150);

    try {
        fs.watch(dir, { recursive: true }, (_event, filename) => {
            if (!filename) return schedule(null);
            const ext = path.extname(filename.toString()).toLowerCase();
            if (exts.has(ext)) {
                schedule(path.join(dir, filename.toString()));
            }
        });
    } catch {
        fs.watch(dir, {}, (_event, filename) => {
            if (!filename) return schedule(null);
            const ext = path.extname(filename.toString()).toLowerCase();
            if (exts.has(ext)) {
                schedule(path.join(dir, filename.toString()));
            }
        });
    }
}

// --- Initial build, serve, and watch ---
runIncremental(null); // full build on startup

const siteConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const outputDir = path.isAbsolute(siteConfig.dirs.output)
    ? siteConfig.dirs.output
    : path.join(contentDir, siteConfig.dirs.output);

serveStatic(outputDir, 8080);
watchDir(contentDir);
watchDir(ctx.templateDir);
