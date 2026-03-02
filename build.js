#!/usr/bin/env node
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import {
    buildAllPages, buildAllPosts,
    buildIndex, buildRss, buildTags, copyAssets,
    initMarked,
    initTemplates,
    loadConfig,
    loadCss,
} from './lib/build-helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Run as `$ npm run build -- content-folder-name` for a specific folder. Defaults to "content" not specified.
const contentDir = path.resolve(__dirname, process.argv[2] || "content");
console.log(`Building site from content folder: ${contentDir}`);

const ctx = loadConfig(contentDir);
initTemplates(ctx);
loadCss(ctx);
initMarked(ctx);

// Ensure public directories exist and are clean
fs.ensureDirSync(ctx.publicDir);
fs.emptyDirSync(ctx.publicDir);
fs.ensureDirSync(ctx.publicPostsDir);

buildAllPages(ctx);
const { allPosts, allTags } = buildAllPosts(ctx);
buildIndex(allPosts, ctx);
buildRss(allPosts, ctx);
buildTags(allPosts, allTags, ctx);
copyAssets(ctx);

console.info('--------------------------------------------------------------------------------------')
console.info('✅ SUCCESS: Build completed.');
console.info('▶ Start preview with `node preview.js contentDir` or `./april-ssg preview contentDir`.')
console.info('--------------------------------------------------------------------------------------')
