const fs = require('fs-extra');
const path = require('path');
const marked = require('marked');
const Handlebars = require('handlebars');
const matter = require('gray-matter');
const CleanCSS = require('clean-css');

// Run as `$ npm run build -- content-folder-name` for a specific folder. Defaults to "content" not specified.
const contentDir = path.resolve(__dirname, process.argv[2] || "content");
console.log(`Building site from content folder: ${contentDir}`);

const configFullPath = path.join(contentDir, 'site.config.json');

// Exit if the config file does not exist
if (!fs.existsSync(configFullPath)) {
    console.error(`‼️ Error: Config file not found at ${configFullPath}`);
    process.exit(1);
}

// Read site configuration
const siteConfig = JSON.parse(fs.readFileSync(configFullPath, 'utf8'));

// Use paths from config
const postsDir = path.join(contentDir, siteConfig.dirs.posts);
const pagesDir = path.join(contentDir, siteConfig.dirs.pages);
const imagesDir = path.join(contentDir, siteConfig.dirs.images);
const extrasDir = path.join(contentDir, siteConfig.dirs.extras);

// Templates and CSS
const templateDir = path.join(contentDir, siteConfig.dirs.templates);
const cssFile = path.join(contentDir, siteConfig.dirs.css);

// Output Directories
const publicDir = path.join(contentDir, siteConfig.dirs.output);
const publicPostsDir = path.join(publicDir, 'posts');

// Ensure public directories exist and are clean
fs.ensureDirSync(publicDir);
fs.emptyDirSync(publicDir);
fs.ensureDirSync(publicPostsDir);

// Register Handlebars partials
Handlebars.registerPartial('header', fs.readFileSync(path.join(templateDir, 'header.html'), 'utf-8'));
Handlebars.registerPartial('footer', fs.readFileSync(path.join(templateDir, 'footer.html'), 'utf-8'));
Handlebars.registerPartial('feature/highlight', fs.readFileSync(path.join(templateDir, 'feature/highlight.html'), 'utf-8'));

// Compile templates
const postTemplate = Handlebars.compile(fs.readFileSync(path.join(templateDir, 'post.html'), 'utf-8'));
const listTemplate = Handlebars.compile(fs.readFileSync(path.join(templateDir, 'list.html'), 'utf-8'));
const tagsListTemplate = Handlebars.compile(fs.readFileSync(path.join(templateDir, 'tags.html'), 'utf-8'));
const e404Template = Handlebars.compile(fs.readFileSync(path.join(templateDir, '404.html'), 'utf-8'));
const pageTemplate = Handlebars.compile(fs.readFileSync(path.join(templateDir, 'page.html'), 'utf-8'));
const rssTemplate = Handlebars.compile(fs.readFileSync(path.join(templateDir, 'rss.xml'), 'utf-8'));

const allPosts = [];
const allTags = {}; 

// This is to fix the image links in the markdown files
const renderer = new marked.Renderer();
renderer.image = (href, title, text) => {
  const fixedHref = href.startsWith('/') ? `${siteConfig.basePath}${href}` : href;

  let width = '';
  let height = '';
  let titleAttr = '';

  // If title is in the format "400x300" or 'some text 400x300'
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

renderer.link = function(href, title, text) {
  const isExternal = href.startsWith('http') && !href.startsWith(siteConfig.siteUrl);

  const fullHref = isExternal ? href : `${siteConfig.basePath}${href}`;
  const targetAttr = isExternal ? ' target="_blank" rel="noopener"' : '';
  const suffix = isExternal ? '<svg aria-hidden="true" focusable="false" width="0.6em" height="0.6em" viewBox="0 0 24 24" style="vertical-align:text-top;"><path d="M5 19L19 5M5 5h14v14" stroke="currentColor" fill="none" stroke-width="3"/></svg>' : '';
  const titleAttr = title ? ` title="${title}"` : '';

  return `<a href="${fullHref}"${titleAttr}${targetAttr}>${text}${suffix}</a>`;
};

marked.use({ renderer });

const defaultOgImage = `${siteConfig.siteUrl}${siteConfig.basePath}/${siteConfig.ogImage}`;

// Minify and include CSS in the HTML
const cssContent = fs.readFileSync(cssFile, 'utf-8');
const minifiedCss = new CleanCSS().minify(cssContent).styles;

console.info('⌛️ Processing pages...');

// Read and process markdown files from pages directory
fs.readdirSync(pagesDir).forEach(file => {

    const filePath = path.join(pagesDir, file);
    const stat = fs.statSync(filePath);

    // Process markdown files directly in /content
    if (stat.isFile() && (path.extname(file) === '.md' || path.extname(file) === '.markdown')) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const { data: frontMatter, content: markdownContent } = matter(fileContent);
        const htmlContent = marked.parse(markdownContent);
        const slug = path.basename(file, path.extname(file)); // e.g., 'about' from 'about.md'

        let ogImage = defaultOgImage;

        // If front matter has an image, use it. Otherwise, use the first image in the content. Otherwise, use the default image.
        if (frontMatter.image) {
            ogImage = `${siteConfig.siteUrl}${siteConfig.basePath}${frontMatter.image}`;
        } else if (htmlContent.includes('<img')) {
            const imgMatch = htmlContent.match(/<img[^>]+src="([^">]+)"/);
            if (imgMatch && imgMatch[1]) {
                ogImage = imgMatch[1].startsWith('/') // Use images from this website only
                    ? `${siteConfig.siteUrl}${siteConfig.basePath}${imgMatch[1]}`
                    : defaultOgImage;
            }
        }

        const pageHtml = pageTemplate({
            config: siteConfig,
            header: {

                title: `${frontMatter.title} — ${siteConfig.name}`,

                meta: {
                    description: frontMatter.description || siteConfig.description,
                    author: siteConfig.author,
                },

                // CSS
                css: {
                    minified: minifiedCss,
                    needsHighlightJS: htmlContent.includes('<pre><code'),
                },

                // Open Graph metadata
                og: {
                    title: `${frontMatter.title} — ${siteConfig.name}`, // Use title from front matter or generate from slug
                    description: frontMatter.description || siteConfig.description,
                    image: ogImage,
                },

            },
            content: {
                title: frontMatter.title || slug.replace(/-/g, ' '), // Use title from front matter or generate from slug
                content: htmlContent
            }
        });
        fs.writeFileSync(path.join(publicDir, `${slug}.html`), pageHtml);

        console.log(`✅ Processed page: ${file}`);
    }
});

console.info('⌛️ Processing posts...');

// Read and process markdown files from posts directory
fs.readdirSync(postsDir).forEach(file => {

    const filePath = path.join(postsDir, file);
    const stat = fs.statSync(filePath);

    if (stat.isFile() && (path.extname(file) === '.md' || path.extname(file) === '.markdown')) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const { data: frontMatter, content: markdownContent } = matter(fileContent);

        // Extract tags from frontmatter, ensuring it's an array
        let tags = [];
        if (frontMatter.tags && Array.isArray(frontMatter.tags)) {
            tags = frontMatter.tags;
        } else if (frontMatter.tags) {
            // If tags is a string, split it by comma and trim whitespace
            tags = frontMatter.tags.split(',').map(tag => tag.trim());
        }


        // Extract date and slug from filename (YYYY-MM-DD-slug.md)
        const filenameMatch = file.match(/^(\d{4}-\d{2}-\d{2})-(.*)\.(md|markdown)$/);
        if (!filenameMatch) {
            console.error(`‼️ Skipping file with unexpected format in posts: ${file}`);
            return;
        }
        const date = filenameMatch[1];
        const slug = filenameMatch[2];

        // Convert markdown to HTML
        const htmlContent = marked.parse(markdownContent);

        let ogImage = defaultOgImage;

        // If front matter has an image, use it. Otherwise, use the first image in the content. Otherwise, use the default image.
        if (frontMatter.image) {
            ogImage = `${siteConfig.siteUrl}${siteConfig.basePath}${frontMatter.image}`;
        } else if (htmlContent.includes('<img')) {
            const imgMatch = htmlContent.match(/<img[^>]+src="([^">]+)"/);
            if (imgMatch && imgMatch[1]) {
                ogImage = imgMatch[1].startsWith('/') // Use images from this website only
                    ? `${siteConfig.siteUrl}${imgMatch[1]}`
                    : defaultOgImage;
            }
        }

        const postContent = {
            title: frontMatter.title || slug.replace(/-/g, ' '), // Use title from front matter or generate from slug
            description: frontMatter.description || siteConfig.description,
            date: {
                shortDate: date,
                longDate: new Date(date + 'T00:00:00Z').toUTCString(),
            },
            content: htmlContent,
            tags: tags,
            path: `/posts/${slug}`,
        };

        // Generate individual post HTML
        const postHtml = postTemplate({
            config: siteConfig,
            header: {
                title: `${frontMatter.title} — ${siteConfig.name}`,
                meta: {
                    description: frontMatter.description || siteConfig.description,
                    author: siteConfig.author,
                },

                // CSS
                css: {
                    minified: minifiedCss,
                    needsHighlightJS: htmlContent.includes('<pre><code'),
                },

                // Open Graph metadata
                og: {
                    title: `${frontMatter.title} — ${siteConfig.name}`, // Use title from front matter or generate from slug
                    description: frontMatter.description || siteConfig.description,
                    image: ogImage,
                },

            },
            post: postContent,
        });
        fs.writeFileSync(path.join(publicPostsDir, `${slug}.html`), postHtml);

        console.log(`✅ Processed post: ${slug}.html`);

        // Add data for the index list
        allPosts.push(postContent);

        // Populate allTags
        tags.forEach(tag => {
            if (!allTags[tag]) {
                allTags[tag] = [];
            }
            allTags[tag].push(postContent);
        });
    }
});

// After the loop, sort posts within each tag by date (descending)
for (const tag in allTags) {
    allTags[tag].sort((a, b) => new Date(b.date) - new Date(a.date));
}

console.info('⌛️ Processing index, images, extras, and RSS feed...');

// Sort posts by date (descending)
allPosts.sort((a, b) => new Date(b.date.shortDate) - new Date(a.date.shortDate));

// Generate index page (list of posts)
const indexHtml = listTemplate({
    config: siteConfig,
    header: {
        title: siteConfig.name,
        meta: {
            description: siteConfig.description,
            author: siteConfig.author,
        },

        // CSS
        css: {
            minified: minifiedCss,
            needsHighlightJS: false,
        },

        // Open Graph metadata
        og: {
            title: `All Posts — ${siteConfig.name}`,
            description: siteConfig.description,
            image: defaultOgImage,
        },

    },
    content: {
        title: `All Posts`,
        items: allPosts,
    },
}); // Pass site name
fs.writeFileSync(path.join(publicDir, 'index.html'), indexHtml);
console.log(`✅ Generated index.html`);

// Generate 404 page (list of posts)
const e404Html = e404Template({
    config: siteConfig,
    header: {
        title: siteConfig.name,
        meta: {
            description: siteConfig.description,
            author: siteConfig.author,
        },

        // CSS
        css: {
            minified: minifiedCss,
            needsHighlightJS: false,
        },

        // Open Graph metadata
        og: {
            title: `All Posts — ${siteConfig.name}`,
            description: siteConfig.description,
            image: defaultOgImage,
        },

    },
    content: {
        title: `All Posts`,
        items: allPosts,
    },
}); // Pass site name
fs.writeFileSync(path.join(publicDir, '404.html'), e404Html);
console.log(`✅ Generated 404.html`);

// Generate RSS feed - add latest 10 items if more than 100 posts. Otherwise, add all 100 posts.
const maxFeedItems = allPosts.length > 100 ? 10 : allPosts.length;
const rssXml = rssTemplate({
    config: siteConfig,
    rssBuildDate: new Date().toUTCString(),
    items: allPosts.slice(0, maxFeedItems)
}); // Pass site name
fs.writeFileSync(path.join(publicDir, 'rss.xml'), rssXml);
console.log(`✅ Generated RSS feed [added latest ${maxFeedItems} items out of ${allPosts.length}]`);

console.info('⌛️ Processing tag pages...');
// Create the main tag directory
const publicTagDir = path.join(publicDir, 'tags');
fs.ensureDirSync(publicTagDir);

// Generate pages for each tag
for (const tag in allTags) {
    const specificTagDir = path.join(publicTagDir, tag);
    fs.ensureDirSync(specificTagDir);

    const tagPageHtml = listTemplate({
        config: siteConfig,
        header: {
            title: `Tag: ${tag} — ${siteConfig.name}`,
            meta: {
                description: `Posts tagged with "${tag}" on ${siteConfig.name}`,
                author: siteConfig.author,
            },

            // CSS
            css: {
                minified: minifiedCss,
                needsHighlightJS: false,
            },

            // Open Graph metadata
            og: {
                title: `Tag: ${tag} — ${siteConfig.name}`,
                description: `Posts tagged with "${tag}" on ${siteConfig.name}`,
                image: defaultOgImage,
            },

        },
        content: {
            title: `All Tags`,
            items: allTags[tag],
        },
    });
    fs.writeFileSync(path.join(specificTagDir, 'index.html'), tagPageHtml);
    console.log(`✅ Generated tag page: ${tag}`);
}

// Generate tag index page (list of tags)
const tagIndexList = [];
for (const tag in allTags) {
    tagIndexList.push({
        title: tag,
        count: allTags[tag].length,
    });
}

// Sort tags by count (descending)
tagIndexList.sort((a, b) => b.count - a.count);

const tagIndexHtml = tagsListTemplate({
    config: siteConfig,
    header: {
        title: `All Tags — ${siteConfig.name}`,
        meta: {
            description: `Explore tags on ${siteConfig.name}`,
            author: siteConfig.author,
        },

        // CSS
        css: {
            minified: minifiedCss,
            needsHighlightJS: false,
        },

        // Open Graph metadata
        og: {
            title: `All Tags — ${siteConfig.name}`,
            description: `Explore tags on ${siteConfig.name}`,
            image: defaultOgImage,
        },

    },
    content: {
        title: `All Tags`,
        tags: tagIndexList,
    },
});
fs.writeFileSync(path.join(publicTagDir, 'index.html'), tagIndexHtml);
console.log(`✅ Generated tag index page: tags/index.html`);

// Copy the folder /images to the public directory
const publicImagesDir = path.join(publicDir, 'images');
fs.ensureDirSync(publicImagesDir);
fs.copySync(imagesDir, publicImagesDir, { overwrite: true });
console.log('✅ Copied images to public directory');

// Copy the contents of /extras to the public directory
fs.copySync(extrasDir, publicDir, { overwrite: true });
console.log('✅ Copied extras to public directory');

console.info('-----------------------------------------------------------------------------')
console.info('✅ SUCCESS: Build completed. Run `npm run dev` to start the server.');
console.info('-----------------------------------------------------------------------------')
