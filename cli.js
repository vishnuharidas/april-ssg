#!/usr/bin/env node
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Usage:
//   april-ssg [contentDir]
//   april-ssg preview [contentDir]

const [maybeCmd, maybeArg] = process.argv.slice(2);

const isPreview = maybeCmd === 'preview' || maybeCmd === '--preview' || maybeCmd === '-p';
const contentArg = isPreview ? maybeArg : maybeCmd; // undefined falls back inside scripts

const script = isPreview ? 'dev.js' : 'build.js';
const scriptPath = path.join(__dirname, script);

const args = [scriptPath];
if (contentArg) args.push(contentArg);

const child = spawn(process.execPath, args, { stdio: 'inherit' });

child.on('exit', (code) => process.exit(code ?? 0));
