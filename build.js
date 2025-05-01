const fs = require('fs-extra');
const path = require('path');
const marked = require('marked');
const Handlebars = require('handlebars');
const matter = require('gray-matter');

// Get the config path from CLI or default to site.config.json in the current directory
// This allows using AprilSSG as a Git submodule.
const configPath = process.argv[2] || './site.config.json';
const configFullPath = path.resolve(process.cwd(), configPath);

// Read site configuration
const siteConfig = JSON.parse(fs.readFileSync(configFullPath, 'utf8'));

// Use paths from config
const postsDir = path.join(__dirname, siteConfig.dirs.posts);
const pagesDir = path.join(__dirname, siteConfig.dirs.pages);
const imagesDir = path.join(__dirname, siteConfig.dirs.images);
const extrasDir = path.join(__dirname, siteConfig.dirs.extras);

// Templates and CSS
const templateDir = path.join(__dirname, siteConfig.dirs.templates);
const cssFile = path.join(__dirname, siteConfig.dirs.css);

// Output Directories
const publicDir = path.join(__dirname, siteConfig.dirs.output);
const publicPostsDir = path.join(publicDir, 'posts');

// Ensure public directories exist and are clean
fs.ensureDirSync(publicDir);
fs.emptyDirSync(publicDir);
fs.ensureDirSync(publicPostsDir);

// Add Handlebar helper to "include" partials
Handlebars.registerHelper('include', function (partialPath, options) {
    const filePath = path.resolve(templateDir, partialPath);
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return new Handlebars.SafeString(content);
    } catch (err) {
        console.error(`Error including partial: ${partialPath}`);
        return '';
    }
});

// Register Handlebars partials
const headerTemplate = fs.readFileSync(path.join(templateDir, 'header.html'), 'utf-8');
const footerTemplate = fs.readFileSync(path.join(templateDir, 'footer.html'), 'utf-8');
Handlebars.registerPartial('header', headerTemplate);
Handlebars.registerPartial('footer', footerTemplate);

// Compile templates
const postTemplate = Handlebars.compile(fs.readFileSync(path.join(templateDir, 'post.html'), 'utf-8'));
const listTemplate = Handlebars.compile(fs.readFileSync(path.join(templateDir, 'list.html'), 'utf-8'));
const e404Template = Handlebars.compile(fs.readFileSync(path.join(templateDir, '404.html'), 'utf-8'));
const pageTemplate = Handlebars.compile(fs.readFileSync(path.join(templateDir, 'page.html'), 'utf-8'));

const postsData = [];

// This is to fix the image links in the markdown files
const renderer = new marked.Renderer();
renderer.image = (href, title, text) => {
    const fixedHref = href.startsWith('/') ? `${siteConfig.basePath}${href}` : href;
    return `<img src="${fixedHref}" alt="${text}" ${title ? `title="${title}"` : ''}>`;
};
marked.use({ renderer });

const navItems = siteConfig.menu.map(item => {
    return {
        title: item.title,
        path: item.path.startsWith("http") ? item.path : `${siteConfig.basePath}${item.path}`,
    };
})

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

        const pageData = {
            navItems: navItems,
            basePath: siteConfig.basePath, // Pass base path
            siteName: siteConfig.name, // Pass site name
            pageDescription : frontMatter.description || siteConfig.description, 
            author: frontMatter.author || siteConfig.author, // Use author from front matter or site config
            pageTitle: `${frontMatter.title} — ${siteConfig.name}`, // Pass site name
            pageDesciption: frontMatter.content || '', // Use description from front matter
            title: frontMatter.title || slug.replace(/-/g, ' '), // Use title from front matter or generate from slug
            content: htmlContent
        };

        const pageHtml = pageTemplate(pageData);
        fs.writeFileSync(path.join(publicDir, `${slug}.html`), pageHtml);
        console.log(`✅ Processed page: ${file}`);
    }
});

// Read and process markdown files from posts directory
fs.readdirSync(postsDir).forEach(file => {

    const filePath = path.join(postsDir, file);
    const stat = fs.statSync(filePath);

    if (stat.isFile() && (path.extname(file) === '.md' || path.extname(file) === '.markdown')) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const { data: frontMatter, content: markdownContent } = matter(fileContent);

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

        console.log(frontMatter.description);

        // Prepare data for the post template
        const postData = {
            navItems: navItems,
            basePath: siteConfig.basePath, // Pass base path
            pageDescription : frontMatter.description || siteConfig.description, 
            pageTitle: `${frontMatter.title} — ${siteConfig.name}`, // Pass site name
            siteName: siteConfig.name, // Pass site name
            author: frontMatter.author || siteConfig.author, // Use author from front matter or site config
            ...frontMatter, // Include front matter data (like title)
            date: date,
            content: htmlContent,
            path: `${siteConfig.basePath}/posts/${slug}.html` // Path for linking in the list
        };

        // Generate individual post HTML
        const postHtml = postTemplate(postData);
        fs.writeFileSync(path.join(publicPostsDir, `${slug}.html`), postHtml);

        console.log(`✅ Processed post: ${slug}.html`);

        // Add data for the index list
        postsData.push({
            title: frontMatter.title || slug.replace(/-/g, ' '), // Use title from front matter or generate from slug
            date: date,
            path: `${siteConfig.basePath}/posts/${slug}`
        });
    }
});

// Sort posts by date (descending)
postsData.sort((a, b) => new Date(b.date) - new Date(a.date));

// Generate index page (list of posts)
const indexHtml = listTemplate({
    navItems: navItems,
    basePath: siteConfig.basePath,
    siteName: siteConfig.name,
    pageTitle: siteConfig.name,
    pageDescription : siteConfig.description, 
    author: siteConfig.author,
    title: 'All Posts',
    items: postsData
}); // Pass site name
fs.writeFileSync(path.join(publicDir, 'index.html'), indexHtml);

// Generate 404 page (list of posts)
const e404Html = e404Template({
    navItems: navItems,
    basePath: siteConfig.basePath,
    siteName: siteConfig.name,
    pageTitle: siteConfig.name,
    pageDescription : siteConfig.description, 
    author: siteConfig.author,
    title: 'All Posts',
    items: postsData
}); // Pass site name
fs.writeFileSync(path.join(publicDir, '404.html'), e404Html);

console.log('✅ Processed index page');

// Copy the folder /images to the public directory
const publicImagesDir = path.join(publicDir, 'images');
fs.ensureDirSync(publicImagesDir);
fs.copySync(imagesDir, publicImagesDir, { overwrite: true });
console.log('✅ Copied images to public directory');

// Copy the single CSS file specified in the config to the public/css directory
const publicCssDir = path.join(publicDir, 'css');
fs.ensureDirSync(publicCssDir);
fs.copySync(cssFile, path.join(publicCssDir, path.basename(cssFile)), { overwrite: true });
console.log('✅ Copied CSS to public directory');

// Copy the contents of /extras to the public directory
fs.copySync(extrasDir, publicDir, { overwrite: true });
console.log('✅ Copied extras to public directory');

console.info('-----------------------------------------------------------------------------')
console.info('✅ SUCCESS: Build completed. Run `npm run dev[-sample]` to start the server.');
console.info('-----------------------------------------------------------------------------')
