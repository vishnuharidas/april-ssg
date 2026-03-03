import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import {
    loadConfig, initTemplates, loadCss, initMarked,
    buildPage, buildPost, buildAllPages, buildAllPosts,
    buildIndex, buildRss, buildTags, copyAssets,
} from '../lib/build-helpers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtureContentDir = path.join(__dirname, 'fixtures', 'content');
const fixtureOutputDir = path.join(__dirname, 'fixtures', 'output');

// Helper: create a fresh build context using the test fixture
function createCtx(tmpDir) {
    const ctx = loadConfig(fixtureContentDir);
    ctx.publicDir = tmpDir;
    ctx.publicPostsDir = path.join(tmpDir, 'posts');
    initTemplates(ctx);
    loadCss(ctx);
    initMarked(ctx);
    fs.ensureDirSync(ctx.publicDir);
    fs.ensureDirSync(ctx.publicPostsDir);
    return ctx;
}

function cleanOutput() {
    if (fs.existsSync(fixtureOutputDir)) {
        fs.removeSync(fixtureOutputDir);
    }
}

// ── Unit Tests ──────────────────────────────────────────────────────

describe('loadConfig', () => {
    it('returns all required paths', () => {
        const ctx = loadConfig(fixtureContentDir);
        assert.ok(ctx.siteConfig);
        assert.ok(ctx.postsDir);
        assert.ok(ctx.pagesDir);
        assert.ok(ctx.templateDir);
        assert.ok(ctx.cssFile);
        assert.ok(ctx.publicDir);
        assert.ok(ctx.publicPostsDir);
    });

    it('prepends basePath to local menu links', () => {
        const tmpContent = path.join(__dirname, 'fixtures', '_tmp_menu_test');
        const fixtureConfig = JSON.parse(fs.readFileSync(path.join(fixtureContentDir, 'site.config.json'), 'utf-8'));

        fs.ensureDirSync(tmpContent);
        try {
            const config = { ...fixtureConfig, basePath: 'blog' };
            fs.writeFileSync(path.join(tmpContent, 'site.config.json'), JSON.stringify(config));
            const ctx = loadConfig(tmpContent);

            const aboutItem = ctx.siteConfig.menu.find(m => m.title === 'About');
            assert.equal(aboutItem.path, '/blog/about');
        } finally {
            fs.removeSync(tmpContent);
        }
    });

    it('leaves external menu links unchanged', () => {
        const tmpContent = path.join(__dirname, 'fixtures', '_tmp_menu_test');
        const fixtureConfig = JSON.parse(fs.readFileSync(path.join(fixtureContentDir, 'site.config.json'), 'utf-8'));

        fs.ensureDirSync(tmpContent);
        try {
            const config = { ...fixtureConfig, basePath: 'blog' };
            fs.writeFileSync(path.join(tmpContent, 'site.config.json'), JSON.stringify(config));
            const ctx = loadConfig(tmpContent);

            const externalItem = ctx.siteConfig.menu.find(m => m.title === 'External');
            assert.equal(externalItem.path, 'https://example.com');
        } finally {
            fs.removeSync(tmpContent);
        }
    });

    it('normalizes basePath to start with / and have no trailing slash', () => {
        // Use a temporary content dir with modified configs to test real loadConfig
        const tmpContent = path.join(__dirname, 'fixtures', '_tmp_basepath_test');
        const fixtureConfig = JSON.parse(fs.readFileSync(path.join(fixtureContentDir, 'site.config.json'), 'utf-8'));

        fs.ensureDirSync(tmpContent);

        try {
            const cases = [
                ['', ''],
                ['/', ''],
                ['///', ''],
                ['public', '/public'],
                ['/public/', '/public'],
                ['///public///', '/public'],
                ['/blog/site/', '/blog/site'],
            ];
            for (const [input, expected] of cases) {
                const config = { ...fixtureConfig, basePath: input };
                fs.writeFileSync(path.join(tmpContent, 'site.config.json'), JSON.stringify(config));
                const ctx = loadConfig(tmpContent);
                assert.equal(ctx.siteConfig.basePath, expected, `basePath "${input}" should normalize to "${expected}"`);
            }
        } finally {
            fs.removeSync(tmpContent);
        }
    });
});

describe('initTemplates', () => {
    it('populates ctx.templates with all 6 templates', () => {
        const ctx = loadConfig(fixtureContentDir);
        initTemplates(ctx);
        const expected = ['post', 'list', 'tagsList', 'e404', 'page', 'rss'];
        for (const name of expected) {
            assert.equal(typeof ctx.templates[name], 'function', `template "${name}" should be a compiled function`);
        }
    });
});

describe('loadCss', () => {
    let raw;
    let minified;

    before(() => {
        const ctx = loadConfig(fixtureContentDir);
        raw = fs.readFileSync(ctx.cssFile, 'utf-8');
        loadCss(ctx);
        minified = ctx.minifiedCss;
    });

    it('produces a smaller string than the source', () => {
        assert.ok(minified.length > 0);
        assert.ok(minified.length < raw.length, 'minified CSS should be shorter than source');
    });

    it('strips comments', () => {
        assert.ok(!minified.includes('/*'));
    });

    it('preserves CSS custom properties', () => {
        assert.ok(minified.includes('--font-family:'));
        assert.ok(minified.includes('--text-color:'));
        assert.ok(minified.includes('--background-color:'));
        assert.ok(minified.includes('--link-color:'));
    });

    it('preserves key selectors', () => {
        assert.ok(minified.includes('body{'), 'should have body selector');
        assert.ok(minified.includes('blockquote{') || minified.includes('blockquote {'), 'should have blockquote selector');
    });

    it('preserves dark mode media query', () => {
        assert.ok(minified.includes('prefers-color-scheme:dark'));
    });
});

describe('buildPost', () => {
    let ctx;
    let tmpDir;

    before(() => {
        tmpDir = fs.mkdtempSync(path.join(__dirname, '.tmp-test-'));
        ctx = createCtx(tmpDir);
    });

    after(() => {
        fs.removeSync(tmpDir);
        cleanOutput();
    });

    it('returns post metadata with correct fields', () => {
        const result = buildPost('2024-06-01-hello-world.md', ctx);
        assert.ok(result);
        assert.equal(result.title, 'Hello World');
        assert.equal(result.date.shortDate, '2024-06-01');
        assert.equal(result.path, '/posts/hello-world');
        assert.ok(Array.isArray(result.tags));
        assert.ok(result.tags.includes('greeting'));
        assert.ok(result.tags.includes('test'));
        assert.ok(result.content.includes('Welcome to the test site'));
    });

    it('writes HTML file to publicPostsDir', () => {
        buildPost('2024-06-01-hello-world.md', ctx);
        const htmlPath = path.join(tmpDir, 'posts', 'hello-world.html');
        assert.ok(fs.existsSync(htmlPath));
        const html = fs.readFileSync(htmlPath, 'utf-8');
        assert.ok(html.includes('Hello World'));
    });

    it('returns null for invalid filename format', () => {
        const badFile = 'no-date-slug.md';
        fs.writeFileSync(path.join(ctx.postsDir, badFile), '---\ntitle: Bad\n---\nContent');
        const result = buildPost(badFile, ctx);
        assert.equal(result, null);
        fs.removeSync(path.join(ctx.postsDir, badFile));
    });
});

describe('buildPage', () => {
    let ctx;
    let tmpDir;

    before(() => {
        tmpDir = fs.mkdtempSync(path.join(__dirname, '.tmp-test-'));
        ctx = createCtx(tmpDir);
    });

    after(() => {
        fs.removeSync(tmpDir);
        cleanOutput();
    });

    it('writes HTML file for a page', () => {
        buildPage('about.md', ctx);
        const htmlPath = path.join(tmpDir, 'about.html');
        assert.ok(fs.existsSync(htmlPath));
        const html = fs.readFileSync(htmlPath, 'utf-8');
        assert.ok(html.includes('About'));
        assert.ok(html.includes('about page'));
    });
});

describe('buildAllPosts', () => {
    let ctx;
    let tmpDir;

    before(() => {
        tmpDir = fs.mkdtempSync(path.join(__dirname, '.tmp-test-'));
        ctx = createCtx(tmpDir);
    });

    after(() => {
        fs.removeSync(tmpDir);
        cleanOutput();
    });

    it('returns sorted allPosts and allTags', () => {
        const { allPosts, allTags } = buildAllPosts(ctx);

        assert.equal(allPosts.length, 8);

        // Verify sorted descending by date
        assert.equal(allPosts[0].title, 'HTML Escape Test');
        // 4 image-test posts share the same date (2025-01-01), then the original 3
        assert.equal(allPosts[5].title, 'Markdown Kitchen Sink');
        assert.equal(allPosts[6].title, 'Second Post');
        assert.equal(allPosts[7].title, 'Hello World');

        // Verify allTags
        assert.ok(allTags['test']);
        assert.equal(allTags['test'].length, 8, '"test" tag should have 8 posts');
        assert.ok(allTags['greeting']);
        assert.equal(allTags['greeting'].length, 1);
        assert.ok(allTags['coding']);
        assert.equal(allTags['coding'].length, 1);
        assert.ok(allTags['markdown']);
        assert.equal(allTags['markdown'].length, 1);
    });
});

// ── Integration Test ────────────────────────────────────────────────

describe('full build integration', () => {
    let tmpDir;

    before(() => {
        tmpDir = fs.mkdtempSync(path.join(__dirname, '.tmp-test-'));
        const ctx = createCtx(tmpDir);

        buildAllPages(ctx);
        const { allPosts, allTags } = buildAllPosts(ctx);
        buildIndex(allPosts, ctx);
        buildRss(allPosts, ctx);
        buildTags(allPosts, allTags, ctx);
        copyAssets(ctx);
    });

    after(() => {
        fs.removeSync(tmpDir);
        cleanOutput();
    });

    it('generates index.html with post titles', () => {
        const html = fs.readFileSync(path.join(tmpDir, 'index.html'), 'utf-8');
        assert.ok(html.includes('Hello World'));
        assert.ok(html.includes('Second Post'));
    });

    it('generates 404.html', () => {
        assert.ok(fs.existsSync(path.join(tmpDir, '404.html')));
    });

    it('generates post HTML files', () => {
        const postFiles = fs.readdirSync(path.join(tmpDir, 'posts'));
        assert.equal(postFiles.length, 8);
        assert.ok(postFiles.includes('hello-world.html'));
        assert.ok(postFiles.includes('second-post.html'));
        assert.ok(postFiles.includes('markdown-kitchen-sink.html'));
        assert.ok(postFiles.includes('image-test-fm-and-content.html'));
        assert.ok(postFiles.includes('image-test-fm-no-content.html'));
        assert.ok(postFiles.includes('image-test-no-fm-content.html'));
        assert.ok(postFiles.includes('image-test-no-fm-no-content.html'));
        assert.ok(postFiles.includes('html-escape-test.html'));

        const html = fs.readFileSync(path.join(tmpDir, 'posts', 'hello-world.html'), 'utf-8');
        assert.ok(html.includes('Hello World'));
        assert.ok(html.includes('Section One'));
    });

    it('generates page HTML files', () => {
        assert.ok(fs.existsSync(path.join(tmpDir, 'about.html')));
    });

    it('generates valid RSS feed', () => {
        const rss = fs.readFileSync(path.join(tmpDir, 'rss.xml'), 'utf-8');
        assert.ok(rss.includes('<rss version="2.0"'));
        assert.ok(rss.includes('<channel>'));
        assert.ok(rss.includes('<item>'));
        assert.ok(rss.includes('<title>Hello World</title>'));
        assert.ok(rss.includes('<title>Second Post</title>'));
        assert.ok(rss.includes('<guid isPermaLink="true">'));
        assert.ok(rss.includes('https://test.example.com'));
    });

    it('generates tag pages with correct posts', () => {
        const tagDir = path.join(tmpDir, 'tags');
        assert.ok(fs.existsSync(path.join(tagDir, 'index.html')));
        assert.ok(fs.existsSync(path.join(tagDir, 'test', 'index.html')));
        assert.ok(fs.existsSync(path.join(tagDir, 'greeting', 'index.html')));
        assert.ok(fs.existsSync(path.join(tagDir, 'coding', 'index.html')));

        // "test" tag page should list all 7 posts
        const testTagHtml = fs.readFileSync(path.join(tagDir, 'test', 'index.html'), 'utf-8');
        assert.ok(testTagHtml.includes('Hello World'));
        assert.ok(testTagHtml.includes('Second Post'));
        assert.ok(testTagHtml.includes('Markdown Kitchen Sink'));
        assert.ok(testTagHtml.includes('Image Test: FM and Content'));
        assert.ok(testTagHtml.includes('Image Test: No FM No Content'));

        // "greeting" tag page should only list first post
        const greetingTagHtml = fs.readFileSync(path.join(tagDir, 'greeting', 'index.html'), 'utf-8');
        assert.ok(greetingTagHtml.includes('Hello World'));
        assert.ok(!greetingTagHtml.includes('Second Post'));
    });

    it('copies images directory', () => {
        assert.ok(fs.existsSync(path.join(tmpDir, 'images')));
        assert.ok(fs.existsSync(path.join(tmpDir, 'images', 'og.png')));
    });
});

// ── Markdown Rendering Tests ────────────────────────────────────────

describe('markdown rendering', () => {
    let html;

    before(() => {
        const tmpDir = fs.mkdtempSync(path.join(__dirname, '.tmp-test-'));
        const ctx = createCtx(tmpDir);
        const result = buildPost('2024-08-01-markdown-kitchen-sink.md', ctx);
        html = result.content;
        fs.removeSync(tmpDir);
    });

    // Headings
    it('renders h1 through h6', () => {
        assert.ok(html.includes('<h1>Heading One</h1>'));
        assert.ok(html.includes('<h2>Heading Two</h2>'));
        assert.ok(html.includes('<h3>Heading Three</h3>'));
        assert.ok(html.includes('<h4>Heading Four</h4>'));
        assert.ok(html.includes('<h5>Heading Five</h5>'));
        assert.ok(html.includes('<h6>Heading Six</h6>'));
    });

    // Inline formatting
    it('renders bold text', () => {
        assert.ok(html.includes('<strong>bold text</strong>'));
    });

    it('renders italic text', () => {
        assert.ok(html.includes('<em>italic text</em>'));
    });

    it('renders bold italic text', () => {
        assert.ok(html.includes('<strong><em>bold italic</em></strong>') ||
                  html.includes('<em><strong>bold italic</strong></em>'));
    });

    it('renders inline code', () => {
        assert.ok(html.includes('<code>inline code</code>'));
    });

    it('renders strikethrough', () => {
        assert.ok(html.includes('<del>strikethrough</del>'));
    });

    // Block elements
    it('renders horizontal rule', () => {
        assert.ok(html.includes('<hr'));
    });

    it('renders blockquote', () => {
        assert.ok(html.includes('<blockquote>'));
        assert.ok(html.includes('This is a blockquote'));
    });

    // Lists
    it('renders unordered list with nested item', () => {
        assert.ok(html.includes('<ul>'));
        assert.ok(html.includes('<li>Unordered item one</li>'));
        assert.ok(html.includes('Nested item'));
    });

    it('renders ordered list', () => {
        assert.ok(html.includes('<ol>'));
        assert.ok(html.includes('<li>Ordered item one</li>'));
    });

    // Links (custom renderer)
    it('renders internal link without target="_blank"', () => {
        assert.ok(html.includes('<a href="/about">Internal link</a>'));
    });

    it('renders external link with target="_blank" and SVG icon', () => {
        const linkMatch = html.match(/<a[^>]*href="https:\/\/example\.com"[^>]*>External link[\s\S]*?<\/a>/);
        assert.ok(linkMatch, 'should find the external link');
        const tag = linkMatch[0];
        assert.ok(tag.includes('target="_blank"'), 'should have target="_blank"');
        assert.ok(tag.includes('rel="noopener"'), 'should have rel="noopener"');
        assert.ok(tag.includes('<svg'), 'should have SVG external link icon');
    });

    it('renders external link with title attribute', () => {
        const linkMatch = html.match(/<a[^>]*title="Example Site"[^>]*>External link with title[\s\S]*?<\/a>/);
        assert.ok(linkMatch, 'should find the titled external link');
        assert.ok(linkMatch[0].includes('href="https://example.com"'), 'should link to correct URL');
    });

    it('treats same-site link as internal', () => {
        assert.match(html, /href="https:\/\/test\.example\.com\/page"[^>]*>Same-site link<\/a>/);
        // Should NOT have target="_blank"
        const match = html.match(/<a[^>]*href="https:\/\/test\.example\.com\/page"[^>]*>/);
        assert.ok(match);
        assert.ok(!match[0].includes('target="_blank"'));
    });

    // Inline markdown inside links
    it('renders bold text inside link', () => {
        assert.match(html, /<a href="\/about"[^>]*><strong>Bold link<\/strong><\/a>/);
    });

    it('renders italic text inside link', () => {
        assert.match(html, /<a href="\/about"[^>]*><em>Italic link<\/em><\/a>/);
    });

    it('renders inline code inside link', () => {
        assert.match(html, /<a href="\/about"[^>]*><code>Code link<\/code><\/a>/);
    });

    it('renders strikethrough text inside link', () => {
        assert.match(html, /<a href="\/about"[^>]*><del>Strikethrough link<\/del><\/a>/);
    });

    // Images (custom renderer)
    it('renders local image with basePath prefix and dimensions from title', () => {
        const imgTag = html.match(/<img[^>]*alt="Alt text for image"[^>]*>/);
        assert.ok(imgTag, 'should find the image tag');
        const tag = imgTag[0];
        assert.ok(tag.includes('src="/images/og.png"'), 'should have basePath-prefixed src');
        assert.ok(tag.includes('title="A test image"'), 'should extract title without dimensions');
        assert.ok(tag.includes('width="400"'), 'should parse width from title');
        assert.ok(tag.includes('height="300"'), 'should parse height from title');
    });

    it('resolves relative image path to absolute', () => {
        const imgTag = html.match(/<img[^>]*alt="Relative image"[^>]*>/);
        assert.ok(imgTag, 'should find the relative image tag');
        const tag = imgTag[0];
        assert.ok(tag.includes('src="/images/og.png"'), 'should resolve ../images/ to /images/');
        assert.ok(tag.includes('width="200"'), 'should parse width');
        assert.ok(tag.includes('height="100"'), 'should parse height');
    });

    it('renders external image without basePath', () => {
        assert.ok(html.includes('src="https://example.com/photo.jpg"'));
    });

    // Relative links
    it('resolves relative link path to absolute', () => {
        const linkMatch = html.match(/<a[^>]*>Relative link<\/a>/);
        assert.ok(linkMatch, 'should find the relative link');
        assert.ok(linkMatch[0].includes('href="/about"'), 'should resolve ../about to /about');
    });

    it('resolves dot-slash image path', () => {
        const imgMatch = html.match(/<img[^>]*alt="Dot-slash image"[^>]*>/);
        assert.ok(imgMatch, 'should find the dot-slash image');
        assert.ok(imgMatch[0].includes('src="/images/og.png"'), 'should resolve ./images/og.png to /images/og.png');
    });

    // Linked images (image inside a link)
    it('renders image wrapped in link', () => {
        const match = html.match(/<a href="\/images\/og\.png"[^>]*>(<img[^>]*>)<\/a>/);
        assert.ok(match, 'should render <a> wrapping an <img>');
        assert.ok(match[1].includes('alt="Linked image"'), 'inner <img> should have correct alt');
        assert.ok(match[1].includes('width="600"'), 'inner <img> should have width from title');
        assert.ok(match[1].includes('height="400"'), 'inner <img> should have height from title');
    });

    it('renders external image inside internal link', () => {
        const match = html.match(/<a href="\/gallery"[^>]*>(<img[^>]*>)<\/a>/);
        assert.ok(match, 'should render <a> wrapping an external <img>');
        assert.ok(match[1].includes('src="https://example.com/photo.jpg"'), 'inner <img> should keep external src');
    });

    it('renders mixed inline formatting inside link', () => {
        const match = html.match(/<a href="\/about"[^>]*><strong>bold<\/strong> and <em>italic<\/em> together<\/a>/);
        assert.ok(match, 'should render both <strong> and <em> inside a single <a>');
    });

    it('renders formatted text inside external link with SVG icon', () => {
        const match = html.match(/<a href="https:\/\/example\.com"[^>]*><strong>Formatted external link<\/strong><svg/);
        assert.ok(match, 'SVG icon should appear after the <strong>, not inside it');
    });

    it('renders inline HTML inside link', () => {
        const match = html.match(/<a href="\/about"[^>]*>Click here <sup>beta<\/sup><\/a>/);
        assert.ok(match, 'should preserve inline HTML elements inside link');
    });

    // Code blocks
    it('renders fenced code block', () => {
        assert.ok(html.includes('<pre><code'));
        assert.ok(html.includes('function hello()'));
    });

    // Tables
    it('renders table with headers and rows', () => {
        assert.ok(html.includes('<table>'));
        assert.ok(html.includes('<th>Column A</th>'));
        assert.ok(html.includes('<td>Cell 1</td>'));
        assert.ok(html.includes('<td>Cell 6</td>'));
    });
});

// ── HTML Escaping Tests ─────────────────────────────────────────────

describe('HTML escaping in renderer', () => {
    let html;

    before(() => {
        const tmpDir = fs.mkdtempSync(path.join(__dirname, '.tmp-test-'));
        const ctx = createCtx(tmpDir);
        const result = buildPost('2025-02-01-html-escape-test.md', ctx);
        html = result.content;
        fs.removeSync(tmpDir);
    });

    it('escapes special characters in image alt attribute', () => {
        const imgMatch = html.match(/<img[^>]*>/);
        assert.ok(imgMatch, 'should find an img tag');
        assert.ok(imgMatch[0].includes('alt="Alt with &quot;quotes&quot; &amp; &lt;angles&gt;"'),
            'alt should have escaped quotes, ampersands, and angle brackets');
    });

    it('escapes special characters in image title attribute', () => {
        const imgMatch = html.match(/<img[^>]*>/);
        assert.ok(imgMatch, 'should find an img tag');
        assert.ok(imgMatch[0].includes('title="Title with &quot;quotes&quot; &amp; &lt;angles&gt;"'),
            'title should have escaped quotes, ampersands, and angle brackets');
    });

    it('escapes special characters in link title attribute', () => {
        const linkMatch = html.match(/<a[^>]*>Link with [\s\S]*?<\/a>/);
        assert.ok(linkMatch, 'should find the link');
        assert.ok(linkMatch[0].includes('title="Tooltip with &quot;quotes&quot; &amp; &lt;angles&gt;"'),
            'link title should have escaped quotes, ampersands, and angle brackets');
    });

    it('escapes special characters in link href attribute', () => {
        // Internal link should still work (no special chars to escape)
        const linkMatch = html.match(/<a[^>]*>Safe internal link<\/a>/);
        assert.ok(linkMatch, 'should find the safe internal link');
        assert.ok(linkMatch[0].includes('href="/about"'));
    });
});

// ── basePath Tests ──────────────────────────────────────────────────

describe('non-empty basePath', () => {
    let tmpDir;
    let postHtml;
    let indexHtml;
    let rss;

    before(() => {
        tmpDir = fs.mkdtempSync(path.join(__dirname, '.tmp-test-'));
        const ctx = loadConfig(fixtureContentDir);
        // Override basePath to simulate subdirectory deployment
        ctx.siteConfig.basePath = '/blog';
        ctx.publicDir = tmpDir;
        ctx.publicPostsDir = path.join(tmpDir, 'posts');
        initTemplates(ctx);
        loadCss(ctx);
        initMarked(ctx);
        fs.ensureDirSync(ctx.publicDir);
        fs.ensureDirSync(ctx.publicPostsDir);

        buildAllPages(ctx);
        const { allPosts, allTags } = buildAllPosts(ctx);
        buildIndex(allPosts, ctx);
        buildRss(allPosts, ctx);
        buildTags(allPosts, allTags, ctx);

        postHtml = fs.readFileSync(path.join(tmpDir, 'posts', 'markdown-kitchen-sink.html'), 'utf-8');
        indexHtml = fs.readFileSync(path.join(tmpDir, 'index.html'), 'utf-8');
        rss = fs.readFileSync(path.join(tmpDir, 'rss.xml'), 'utf-8');
    });

    after(() => {
        fs.removeSync(tmpDir);
    });

    it('prepends basePath to post links in index', () => {
        assert.ok(indexHtml.includes('href="/blog/posts/hello-world"'));
    });

    it('prepends basePath to navigation links', () => {
        assert.ok(indexHtml.includes('href="/blog/"'));
        assert.ok(indexHtml.includes('href="/blog/rss.xml"'));
    });

    it('prepends basePath to images in markdown content', () => {
        assert.ok(postHtml.includes('src="/blog/images/og.png"'));
    });

    it('prepends basePath to relative paths in markdown content', () => {
        const imgTag = postHtml.match(/<img[^>]*alt="Relative image"[^>]*>/);
        assert.ok(imgTag);
        assert.ok(imgTag[0].includes('src="/blog/images/og.png"'));
    });

    it('prepends basePath to internal links in markdown content', () => {
        assert.ok(postHtml.includes('href="/blog/about"'));
    });

    it('prepends basePath in RSS feed URLs', () => {
        assert.ok(rss.includes('https://test.example.com/blog'));
        assert.ok(rss.includes('https://test.example.com/blog/posts/hello-world'));
    });
});

// ── OG Image Resolution Tests ───────────────────────────────────────

describe('OG image resolution', () => {
    const tmpDirs = [];
    // Posts keyed by slug, each with { noBase, withBase } HTML strings
    const posts = {};

    function buildAllWithBasePath(basePath) {
        const tmpDir = fs.mkdtempSync(path.join(__dirname, '.tmp-test-'));
        tmpDirs.push(tmpDir);
        const ctx = loadConfig(fixtureContentDir);
        ctx.siteConfig.basePath = basePath;
        ctx.publicDir = tmpDir;
        ctx.publicPostsDir = path.join(tmpDir, 'posts');
        initTemplates(ctx);
        loadCss(ctx);
        initMarked(ctx);
        fs.ensureDirSync(ctx.publicPostsDir);
        buildAllPosts(ctx);
        return tmpDir;
    }

    function readPostHtml(tmpDir, slug) {
        return fs.readFileSync(path.join(tmpDir, 'posts', `${slug}.html`), 'utf-8');
    }

    function extractOgImage(html) {
        const match = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/);
        assert.ok(match, 'should have og:image meta tag');
        return match[1];
    }

    const slugs = [
        'image-test-fm-and-content',
        'image-test-fm-no-content',
        'image-test-no-fm-content',
        'image-test-no-fm-no-content',
    ];

    before(() => {
        const noBaseDir = buildAllWithBasePath('');
        const withBaseDir = buildAllWithBasePath('/blog');

        for (const slug of slugs) {
            posts[slug] = {
                noBase: readPostHtml(noBaseDir, slug),
                withBase: readPostHtml(withBaseDir, slug),
            };
        }
    });

    after(() => {
        tmpDirs.forEach(dir => fs.removeSync(dir));
    });

    // ── Empty basePath ──────────────────────────────────────────────

    it('prefers frontmatter image over content image (empty basePath)', () => {
        // Has both fm image (/images/og.png) and content image (content-photo.png)
        assert.equal(extractOgImage(posts['image-test-fm-and-content'].noBase), 'https://test.example.com/images/og.png');
    });

    it('uses frontmatter image when no content image (empty basePath)', () => {
        assert.equal(extractOgImage(posts['image-test-fm-no-content'].noBase), 'https://test.example.com/images/og.png');
    });

    it('extracts content image when no frontmatter image (empty basePath)', () => {
        assert.equal(extractOgImage(posts['image-test-no-fm-content'].noBase), 'https://test.example.com/images/content-photo.png');
    });

    it('falls back to default OG image when no images at all (empty basePath)', () => {
        assert.equal(extractOgImage(posts['image-test-no-fm-no-content'].noBase), 'https://test.example.com/images/og.png');
    });

    // ── With basePath /blog ─────────────────────────────────────────

    it('prefers frontmatter image over content image (with basePath)', () => {
        assert.equal(extractOgImage(posts['image-test-fm-and-content'].withBase), 'https://test.example.com/blog/images/og.png');
    });

    it('uses frontmatter image when no content image (with basePath)', () => {
        assert.equal(extractOgImage(posts['image-test-fm-no-content'].withBase), 'https://test.example.com/blog/images/og.png');
    });

    it('extracts content image without double-prefixing basePath', () => {
        assert.equal(extractOgImage(posts['image-test-no-fm-content'].withBase), 'https://test.example.com/blog/images/content-photo.png');
    });

    it('falls back to default OG image when no images at all (with basePath)', () => {
        assert.equal(extractOgImage(posts['image-test-no-fm-no-content'].withBase), 'https://test.example.com/blog/images/og.png');
    });
});
