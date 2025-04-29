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
const contentDirRoot = path.join(__dirname, siteConfig.dirs.content);
const contentDir = path.join(contentDirRoot, "posts"); // Assuming posts are always in a 'posts' subdirectory
const templateDir = path.join(__dirname, siteConfig.dirs.templates);

// Output Directories
const publicDir = path.join(__dirname, siteConfig.dirs.output);
const publicPostsDir = path.join(publicDir, 'posts');

// Ensure public directories exist and are clean
fs.ensureDirSync(publicDir);
fs.emptyDirSync(publicDir);
fs.ensureDirSync(publicPostsDir);

// Register Handlebars partials
const headerTemplate = fs.readFileSync(path.join(templateDir, 'header.html'), 'utf-8');
const footerTemplate = fs.readFileSync(path.join(templateDir, 'footer.html'), 'utf-8');
Handlebars.registerPartial('header', headerTemplate);
Handlebars.registerPartial('footer', footerTemplate);

// Compile templates
const postTemplate = Handlebars.compile(fs.readFileSync(path.join(templateDir, 'post.html'), 'utf-8'));
const listTemplate = Handlebars.compile(fs.readFileSync(path.join(templateDir, 'list.html'), 'utf-8'));
const pageTemplate = Handlebars.compile(fs.readFileSync(path.join(templateDir, 'page.html'), 'utf-8'));

const postsData = [];

// Read and process markdown files from content directory
fs.readdirSync(contentDirRoot).forEach(item => {
    const itemPath = path.join(contentDirRoot, item);
    const stats = fs.statSync(itemPath);

    // Process markdown files directly in /content
    if (stats.isFile() && (path.extname(item) === '.md' || path.extname(item) === '.markdown')) {
        const fileContent = fs.readFileSync(itemPath, 'utf-8');
        const { data: frontMatter, content: markdownContent } = matter(fileContent);
        const htmlContent = marked.parse(markdownContent);
        const slug = path.basename(item, path.extname(item)); // e.g., 'about' from 'about.md'

        const pageData = {
            siteName: siteConfig.name, // Pass site name
            author: frontMatter.author || siteConfig.author, // Use author from front matter or site config
            pageTitle: `${frontMatter.title} — ${siteConfig.name}`, // Pass site name
            pageDesciption: frontMatter.content || '', // Use description from front matter
            title: frontMatter.title || slug.replace(/-/g, ' '), // Use title from front matter or generate from slug
            content: htmlContent
        };

        const pageHtml = pageTemplate(pageData);
        fs.writeFileSync(path.join(publicDir, `${slug}.html`), pageHtml);
        console.log(`Processed page: ${item}`);
    }
    // Process posts within /content/posts directory
    else if (stats.isDirectory() && item === 'posts') {
        fs.readdirSync(itemPath).forEach(file => {
            if (path.extname(file) === '.md' || path.extname(file) === '.markdown') {
                const filePath = path.join(itemPath, file);
                const fileContent = fs.readFileSync(filePath, 'utf-8');
                const { data: frontMatter, content: markdownContent } = matter(fileContent);

                // Extract date and slug from filename (YYYY-MM-DD-slug.md)
                const filenameMatch = file.match(/^(\d{4}-\d{2}-\d{2})-(.*)\.(md|markdown)$/);
                if (!filenameMatch) {
                    console.error(`Skipping file with unexpected format in posts: ${file}`);
                    return;
                }
                const date = filenameMatch[1];
                const slug = filenameMatch[2];

                // Convert markdown to HTML
                const htmlContent = marked.parse(markdownContent);

                // Prepare data for the post template
                const postData = {
                    pageTitle: `${frontMatter.title} — ${siteConfig.name}`, // Pass site name
                    siteName: siteConfig.name, // Pass site name
                    author: frontMatter.author || siteConfig.author, // Use author from front matter or site config
                    ...frontMatter, // Include front matter data (like title)
                    date: date,
                    content: htmlContent,
                    path: `/posts/${slug}.html` // Path for linking in the list
                };

                // Generate individual post HTML
                const postHtml = postTemplate(postData);
                fs.writeFileSync(path.join(publicPostsDir, `${slug}.html`), postHtml);

                console.log(`Processed post: ${slug}.html`);

                // Add data for the index list
                postsData.push({
                    title: frontMatter.title || slug.replace(/-/g, ' '), // Use title from front matter or generate from slug
                    date: date,
                    path: `/posts/${slug}.html`
                });
            }
        });
    }
});

// Sort posts by date (descending)
postsData.sort((a, b) => new Date(b.date) - new Date(a.date));

// Generate index page (list of posts)
const indexHtml = listTemplate({ 
    siteName: siteConfig.name, 
    pageTitle: siteConfig.name, 
    author: siteConfig.author,
    title: 'All Posts', 
    items: postsData 
}); // Pass site name
fs.writeFileSync(path.join(publicDir, 'index.html'), indexHtml);

console.log('Processed index page');

// Copy the folder /images to the public directory
const imagesDir = path.join(__dirname, siteConfig.dirs.images);
const publicImagesDir = path.join(publicDir, 'images');
fs.ensureDirSync(publicImagesDir);
fs.copySync(imagesDir, publicImagesDir, { overwrite: true });
console.log('Copied images to public directory');

// Copy the folder /css to the public directory
const cssDir = path.join(__dirname, siteConfig.dirs.css);
const publicCssDir = path.join(publicDir, 'css');
fs.ensureDirSync(publicCssDir);
fs.copySync(cssDir, publicCssDir, { overwrite: true });
console.log('Copied CSS to public directory');

// Copy the contents of /extras to the public directory
const extasDir = path.join(__dirname, siteConfig.dirs.extras);
fs.copySync(extasDir, publicDir, { overwrite: true });
console.log('Copied extras to public directory');


console.info('SUCCESS: Build completed!');
