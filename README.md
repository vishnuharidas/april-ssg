# April⋅SSG - a lightweight, simple static site generator

[![Netlify Status](https://api.netlify.com/api/v1/badges/f48e1b62-bae3-42ee-b6b5-ffb6a44b8100/deploy-status)](https://app.netlify.com/sites/april-ssg/deploys)

**April⋅SSG** is a lightweight, super-simple static site generator written in JavaScript. It focuses on **minimalism and ease of use**, making it an ideal choice for developers who want to create static websites without unnecessary complexity.

April⋅SSG was born out of my frustration with tools like Jekyll and Hugo. They always seemed to overcomplicate things when all I wanted was a clean, minimalistic site. After countless hours of trial and error, I built a simple static site generator with the help of Copilot. Discover the full story behind [why I built April⋅SSG](https://iamvishnu.com/posts/why-i-built-april-static-site-generator).


## 🚀 Installing April⋅SSG

Getting started is easy. Clone or fork this repository and you're ready to build your static site!

```bash
git clone https://github.com/vishnuharidas/april-ssg.git my-site
cd my-site
```

## 🧪 Building and Previewing Your Website

This repository includes sample blog posts, a page, and images to help you get started. They serve as a guide for understanding the structure and creating your own content.

To build the sample site:

```bash
node build.js content
```

The generated site will be available inside the `public/` folder.

To preview the site locally (with auto-rebuild):

```bash
node preview.js content
```

Or use the included shim (Linux/macOS):

```bash
chmod +x ./april-ssg
./april-ssg preview content
```

On Windows (cmd/PowerShell):

```bat
april-ssg.cmd preview content
```

Visit [http://127.0.0.1:8080](http://127.0.0.1:8080) in your browser. The preview watches for changes and rebuilds automatically; refresh to see updates.

## 🚀 Publishing Your Website

Once your site is built, the entire static website resides in the `/public` directory.

You can deploy your website by uploading the contents of the `/public` folder to any static web hosting provider. This can be done manually or integrated into your CI/CD pipeline.

For specific instructions on deploying to popular platforms, see the guides:

- [Publishing on GitHub Pages](docs/github-pages/README.md)
- [Publishing on GitLab Pages](docs/gitlab-pages/README.md)
- [Publishing on Cloudflare Pages](docs/cloudflare-pages/README.md)
- [Publishing on Netlify](docs/netlify/README.md)


## 📁 Folder Structure

April⋅SSG uses a simple, minimal folder structure:

```text
content/
├── posts/      → Your blog posts
├── pages/      → Standalone pages like about.md
├── images/     → Images
├── extras/     → Any other files (PDFs, raw HTML, etc.)
└── site.config.json    → Website configuration
```

### How It Works

- **`posts/`** — Markdown files named like `2025-04-29-my-post.md` become `/public/posts/my-post.html`. These are listed on the index page.
- **`pages/`** — Markdown pages (like `about.md`) become standalone pages at `/public/about.html`.
- **`images/`** — Files in `content/images/` are copied directly to `public/images/`.
- **`extras/`** — All files and folders in `extras/` are copied as-is into `public/`. Avoid naming collisions. Here's where you can put files like `robots.txt`.
- **`site.config.json`** — Central configuration file for your website. Customize directory names, site title, URLs, and other global settings here.


## 🎨 Customizing the Look and Feel

You can personalize your site's appearance by modifying the HTML templates and `styles.css` in the `templates/` folder. Any updates you make will be applied the next time you build your site. For practical examples, check out the [Example CSS Variations Preview](styles) page.

```text
templates/
├── footer.html     → Footer section for all pages
├── header.html     → Header section for all pages
├── list.html       → Layout for listing pages (e.g. homepage)
├── page.html       → Template for standalone pages
├── post.html       → Template for blog posts
├── rss.xml         → Template for RSS feed
├── tags.xml        → Template for tags with count
└── styles.css      → Styles for the website
```

## 📄 License

MIT License © 2025 [Vishnu Haridas](https://iamvishnu.com). See [LICENSE](LICENSE.txt) for full details.
