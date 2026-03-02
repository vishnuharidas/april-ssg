import CleanCSS from 'clean-css';
import fs from 'fs-extra';
import matter from 'gray-matter';
import Handlebars from 'handlebars';
import { marked } from 'marked';
import path from 'path';

export function loadConfig(contentDir) {
    const configFullPath = path.join(contentDir, 'site.config.json');

    if (!fs.existsSync(configFullPath)) {
        console.error(`‼️ Error: Config file not found at ${configFullPath}`);
        process.exit(1);
    }

    const siteConfig = JSON.parse(fs.readFileSync(configFullPath, 'utf8'));

    siteConfig.menu = siteConfig.menu.map(item =>
        item.path.startsWith('http') ? item : {
            ...item,
            path: `${siteConfig.basePath}${item.path}`
        }
    );

    const postsDir = path.join(contentDir, siteConfig.dirs.posts);
    const pagesDir = path.join(contentDir, siteConfig.dirs.pages);
    const imagesDir = path.join(contentDir, siteConfig.dirs.images);
    const extrasDir = path.join(contentDir, siteConfig.dirs.extras);
    const templateDir = path.join(contentDir, siteConfig.dirs.templates);
    const cssFile = path.join(contentDir, siteConfig.dirs.css);
    const publicDir = path.join(contentDir, siteConfig.dirs.output);
    const publicPostsDir = path.join(publicDir, 'posts');

    return {
        siteConfig,
        contentDir,
        postsDir,
        pagesDir,
        imagesDir,
        extrasDir,
        templateDir,
        cssFile,
        publicDir,
        publicPostsDir,
    };
}

export function initTemplates(ctx) {
    Handlebars.unregisterPartial('header');
    Handlebars.unregisterPartial('footer');
    Handlebars.unregisterPartial('feature/highlight');

    Handlebars.registerPartial('header', fs.readFileSync(path.join(ctx.templateDir, 'header.html'), 'utf-8'));
    Handlebars.registerPartial('footer', fs.readFileSync(path.join(ctx.templateDir, 'footer.html'), 'utf-8'));
    Handlebars.registerPartial('feature/highlight', fs.readFileSync(path.join(ctx.templateDir, 'feature/highlight.html'), 'utf-8'));

    ctx.templates = {
        post: Handlebars.compile(fs.readFileSync(path.join(ctx.templateDir, 'post.html'), 'utf-8')),
        list: Handlebars.compile(fs.readFileSync(path.join(ctx.templateDir, 'list.html'), 'utf-8')),
        tagsList: Handlebars.compile(fs.readFileSync(path.join(ctx.templateDir, 'tags.html'), 'utf-8')),
        e404: Handlebars.compile(fs.readFileSync(path.join(ctx.templateDir, '404.html'), 'utf-8')),
        page: Handlebars.compile(fs.readFileSync(path.join(ctx.templateDir, 'page.html'), 'utf-8')),
        rss: Handlebars.compile(fs.readFileSync(path.join(ctx.templateDir, 'rss.xml'), 'utf-8')),
    };
}

export function loadCss(ctx) {
    const cssContent = fs.readFileSync(ctx.cssFile, 'utf-8');
    ctx.minifiedCss = new CleanCSS().minify(cssContent).styles;
}

function createMarkedRenderer(siteConfig) {
    const renderer = new marked.Renderer();
    renderer.image = ({ href, title, text }) => {
        const fixedHref = href.startsWith('/') ? `${siteConfig.basePath}${href}` : href;

        let width = '';
        let height = '';
        let titleAttr = '';

        if (title && /\b\d{2,4}x\d{2,4}\b/.test(title)) {
            const match = title.match(/(\d{2,4})x(\d{2,4})/);
            if (match) {
                width = match[1];
                height = match[2];
                titleAttr = title.replace(match[0], '').trim();
            }
        } else {
            titleAttr = title;
        }

        return `<img src="${fixedHref}" alt="${text}"${titleAttr ? ` title="${titleAttr}"` : ''}${width && height ? ` width="${width}" height="${height}"` : ''}>`;
    };

    renderer.link = ({ href, title, text }) => {
        const isExternal = href.startsWith('http') && !href.startsWith(siteConfig.siteUrl);
        const fullHref = isExternal ? href : `${siteConfig.basePath}${href}`;
        const targetAttr = isExternal ? ' target="_blank" rel="noopener"' : '';
        const suffix = isExternal ? '<svg aria-hidden="true" focusable="false" width="0.6em" height="0.6em" viewBox="0 0 24 24" style="vertical-align:text-top;"><path d="M5 19L19 5M5 5h14v14" stroke="currentColor" fill="none" stroke-width="3"/></svg>' : '';
        const titleAttr = title ? ` title="${title}"` : '';
        return `<a href="${fullHref}"${titleAttr}${targetAttr}>${text}${suffix}</a>`;
    };

    return renderer;
}

export function initMarked(ctx) {
    const renderer = createMarkedRenderer(ctx.siteConfig);
    marked.use({ renderer });
    ctx.defaultOgImage = `${ctx.siteConfig.siteUrl}${ctx.siteConfig.basePath}/${ctx.siteConfig.ogImage}`;
}

function resolveOgImage(frontMatter, htmlContent, siteConfig, defaultOgImage) {
    if (frontMatter.image) {
        return `${siteConfig.siteUrl}${siteConfig.basePath}${frontMatter.image}`;
    } else if (htmlContent.includes('<img')) {
        const imgMatch = htmlContent.match(/<img[^>]+src="([^">]+)"/);
        if (imgMatch && imgMatch[1]) {
            return imgMatch[1].startsWith('/')
                ? `${siteConfig.siteUrl}${siteConfig.basePath}${imgMatch[1]}`
                : defaultOgImage;
        }
    }
    return defaultOgImage;
}

export function buildPage(file, ctx) {
    const filePath = path.join(ctx.pagesDir, file);
    const stat = fs.statSync(filePath);

    if (!stat.isFile() || !(path.extname(file) === '.md' || path.extname(file) === '.markdown')) {
        return;
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data: frontMatter, content: markdownContent } = matter(fileContent);
    const htmlContent = marked.parse(markdownContent);
    const slug = path.basename(file, path.extname(file));

    const ogImage = resolveOgImage(frontMatter, htmlContent, ctx.siteConfig, ctx.defaultOgImage);

    const pageHtml = ctx.templates.page({
        config: ctx.siteConfig,
        header: {
            title: `${frontMatter.title} — ${ctx.siteConfig.name}`,
            meta: {
                description: frontMatter.description || ctx.siteConfig.description,
                author: ctx.siteConfig.author,
            },
            css: {
                minified: ctx.minifiedCss,
                needsHighlightJS: htmlContent.includes('<pre><code'),
            },
            og: {
                title: `${frontMatter.title} — ${ctx.siteConfig.name}`,
                description: frontMatter.description || ctx.siteConfig.description,
                image: ogImage,
            },
        },
        content: {
            title: frontMatter.title || slug.replace(/-/g, ' '),
            content: htmlContent
        }
    });
    fs.writeFileSync(path.join(ctx.publicDir, `${slug}.html`), pageHtml);
    console.log(`✅ Processed page: ${file}`);
}

export function buildAllPages(ctx) {
    console.info('⌛️ Processing pages...');
    fs.readdirSync(ctx.pagesDir).forEach(file => buildPage(file, ctx));
}

export function buildPost(file, ctx) {
    const filePath = path.join(ctx.postsDir, file);
    const stat = fs.statSync(filePath);

    if (!stat.isFile() || !(path.extname(file) === '.md' || path.extname(file) === '.markdown')) {
        return null;
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data: frontMatter, content: markdownContent } = matter(fileContent);

    let tags = [];
    if (frontMatter.tags && Array.isArray(frontMatter.tags)) {
        tags = frontMatter.tags;
    } else if (frontMatter.tags) {
        tags = frontMatter.tags.split(',').map(tag => tag.trim());
    }

    const filenameMatch = file.match(/^(\d{4}-\d{2}-\d{2})-(.*)\.(md|markdown)$/);
    if (!filenameMatch) {
        console.error(`‼️ Skipping file with unexpected format in posts: ${file}`);
        return null;
    }
    const date = filenameMatch[1];
    const slug = filenameMatch[2];

    const htmlContent = marked.parse(markdownContent);

    const ogImage = resolveOgImage(frontMatter, htmlContent, ctx.siteConfig, ctx.defaultOgImage);

    const postContent = {
        title: frontMatter.title || slug.replace(/-/g, ' '),
        description: frontMatter.description || ctx.siteConfig.description,
        date: {
            shortDate: date,
            longDate: new Date(date + 'T00:00:00Z').toUTCString(),
            dateObj: new Date(date + 'T00:00:00Z'),
        },
        content: htmlContent,
        tags: tags,
        path: `/posts/${slug}`,
    };

    const postHtml = ctx.templates.post({
        config: ctx.siteConfig,
        header: {
            title: `${frontMatter.title} — ${ctx.siteConfig.name}`,
            meta: {
                description: frontMatter.description || ctx.siteConfig.description,
                author: ctx.siteConfig.author,
            },
            css: {
                minified: ctx.minifiedCss,
                needsHighlightJS: htmlContent.includes('<pre><code'),
            },
            og: {
                title: `${frontMatter.title} — ${ctx.siteConfig.name}`,
                description: frontMatter.description || ctx.siteConfig.description,
                image: ogImage,
            },
        },
        post: postContent,
    });
    fs.writeFileSync(path.join(ctx.publicPostsDir, `${slug}.html`), postHtml);
    console.log(`✅ Processed post: ${slug}.html`);

    return postContent;
}

export function buildAllPosts(ctx) {
    console.info('⌛️ Processing posts...');
    const allPosts = [];
    const allTags = {};

    fs.readdirSync(ctx.postsDir).forEach(file => {
        const postContent = buildPost(file, ctx);
        if (!postContent) return;

        allPosts.push(postContent);
        postContent.tags.forEach(tag => {
            if (!allTags[tag]) allTags[tag] = [];
            allTags[tag].push(postContent);
        });
    });

    for (const tag in allTags) {
        allTags[tag].sort((a, b) => b.date.dateObj - a.date.dateObj);
    }

    allPosts.sort((a, b) => b.date.dateObj - a.date.dateObj);

    return { allPosts, allTags };
}

function headerBase(ctx) {
    return {
        title: ctx.siteConfig.name,
        meta: {
            description: ctx.siteConfig.description,
            author: ctx.siteConfig.author,
        },
        og: {
            title: ctx.siteConfig.name,
            description: ctx.siteConfig.description,
            image: ctx.defaultOgImage,
        },
        css: {
            minified: ctx.minifiedCss,
            needsHighlightJS: false,
        },
    };
}

export function buildIndex(allPosts, ctx) {
    console.info('⌛️ Processing index, 404, and RSS feed...');
    const hBase = headerBase(ctx);

    const indexHtml = ctx.templates.list({
        config: ctx.siteConfig,
        header: { ...hBase },
        content: { title: 'All Posts', items: allPosts },
    });
    fs.writeFileSync(path.join(ctx.publicDir, 'index.html'), indexHtml);
    console.log('✅ Generated index.html');

    const e404Html = ctx.templates.e404({
        config: ctx.siteConfig,
        header: { ...hBase },
        content: { title: 'All Posts', items: allPosts },
    });
    fs.writeFileSync(path.join(ctx.publicDir, '404.html'), e404Html);
    console.log('✅ Generated 404.html');
}

export function buildRss(allPosts, ctx) {
    const maxFeedItems = allPosts.length > 100 ? 10 : allPosts.length;
    const rssXml = ctx.templates.rss({
        config: ctx.siteConfig,
        rssBuildDate: new Date().toUTCString(),
        items: allPosts.slice(0, maxFeedItems)
    });
    fs.writeFileSync(path.join(ctx.publicDir, 'rss.xml'), rssXml);
    console.log(`✅ Generated RSS feed [added latest ${maxFeedItems} items out of ${allPosts.length}]`);
}

export function buildTags(allPosts, allTags, ctx) {
    console.info('⌛️ Processing tag pages...');
    const publicTagDir = path.join(ctx.publicDir, 'tags');
    fs.ensureDirSync(publicTagDir);
    const hBase = headerBase(ctx);

    for (const tag in allTags) {
        const specificTagDir = path.join(publicTagDir, tag);
        fs.ensureDirSync(specificTagDir);

        const tagPageHtml = ctx.templates.list({
            config: ctx.siteConfig,
            header: {
                ...hBase,
                title: `Tag: ${tag} — ${ctx.siteConfig.name}`,
                meta: {
                    ...hBase.meta,
                    description: `Posts tagged with "${tag}" on ${ctx.siteConfig.name}`,
                },
                og: {
                    ...hBase.og,
                    title: `Tag: ${tag} — ${ctx.siteConfig.name}`,
                    description: `Posts tagged with "${tag}" on ${ctx.siteConfig.name}`,
                },
            },
            content: {
                title: `Tag: ${tag}`,
                items: allTags[tag],
            },
        });
        fs.writeFileSync(path.join(specificTagDir, 'index.html'), tagPageHtml);
        console.log(`✅ Generated tag page: ${tag}`);
    }

    const tagIndexList = [];
    for (const tag in allTags) {
        tagIndexList.push({ title: tag, count: allTags[tag].length });
    }
    tagIndexList.sort((a, b) => b.count - a.count);

    const tagIndexHtml = ctx.templates.tagsList({
        config: ctx.siteConfig,
        header: {
            ...hBase,
            title: `All Tags — ${ctx.siteConfig.name}`,
            meta: {
                ...hBase.meta,
                description: `Explore tags on ${ctx.siteConfig.name}`,
            },
            og: {
                ...hBase.og,
                title: `All Tags — ${ctx.siteConfig.name}`,
                description: `Explore tags on ${ctx.siteConfig.name}`,
            },
        },
        content: {
            title: 'All Tags',
            tags: tagIndexList,
        },
    });
    fs.writeFileSync(path.join(publicTagDir, 'index.html'), tagIndexHtml);
    console.log('✅ Generated tag index page: tags/index.html');
}

export function copyAssets(ctx) {
    const publicImagesDir = path.join(ctx.publicDir, 'images');
    fs.ensureDirSync(publicImagesDir);
    fs.copySync(ctx.imagesDir, publicImagesDir, { overwrite: true });
    console.log('✅ Copied images to public directory');

    fs.copySync(ctx.extrasDir, ctx.publicDir, { overwrite: true });
    console.log('✅ Copied extras to public directory');
}
