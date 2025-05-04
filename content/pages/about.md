---
title: About April⋅SSG
description: A minimalistic static site generator for developers who value simplicity.
---
**April⋅SSG** is a lightweight, super-simple static site generator written in JavaScript. It focuses on **minimalism and ease of use**, making it an ideal choice for developers who want to create static websites without unnecessary complexity.

April⋅SSG was born out of my frustration with tools like Jekyll and Hugo. They always seemed to overcomplicate things when all I wanted was a clean, minimalistic site. After countless hours of trial and error, I built a simple static site generator with the help of Copilot. Discover the full story behind [why I built April⋅SSG](https://iamvishnu.com/posts/why-i-built-april-static-site-generator).


## 🚀 Installing April⋅SSG

Getting started is easy. Clone or fork this repository and you're ready to build your static site!

```bash
git clone https://github.com/vishnuharidas/april-ssg.git my-site
cd my-site
npm install
```

## 🧪 Building and Previewing Your Website

This repository includes sample blog posts, a page, and images to help you get started. They serve as a guide for understanding the structure and creating your own content.

To build the sample site:

```bash
npm run build
```

The generated site will be available inside the `public/` folder.

To preview the site locally:

```bash
npm run dev
```

Visit [http://127.0.0.1:8080](http://127.0.0.1:8080) in your browser.

> **Note:** The `npm run dev` command watches for file changes and automatically rebuilds the site. Simply refresh your browser to see the updates. This feature is intended to provide a faster and effortless local preview experience as you make changes.

## 🚀 Publishing Your Website

Once your site is built, the entire static website resides in the `/public` directory.

You can deploy your website by uploading the contents of the `/public` folder to any static web hosting provider. This can be done manually or integrated into your CI/CD pipeline.

For specific instructions on deploying to popular platforms like GitHub Pages, [see the guides](https://github.com/vishnuharidas/april-ssg/tree/main/docs/) included in the original repository.


## 📁 Folder Structure

April⋅SSG uses a simple, minimal folder structure:

```text
content/
├── posts/      → Your blog posts
├── pages/      → Standalone pages like about.md
├── images/     → Images
└── extras/     → Any other files (PDFs, raw HTML, etc.)
```

### How It Works

- **`posts/`** — Markdown files named like `2025-04-29-my-post.md` become `/public/posts/my-post.html`. These are listed on the index page.
- **`pages/`** — Markdown pages (like `about.md`) become standalone pages at `/public/about.html`.
- **`images/`** — Files in `content/images/` are copied directly to `public/images/`.
- **`extras/`** — All files and folders in `extras/` are copied as-is into `public/`. Avoid naming collisions. Here's where you can put files like `robots.txt`.

> **Note:** You can change these folder mappings in `site.config.json`.

## 🎨 Customizing the Look and Feel

You can fully customize your site by editing the HTML templates and `styles.css`. All changes will be reflected in the next build.

```text
templates/
├── footer.html     → Footer section for all pages
├── header.html     → Header section for all pages
├── list.html       → Layout for listing pages (e.g. homepage)
├── page.html       → Template for standalone pages
├── post.html       → Template for blog posts
└── styles.css      → All your custom styles
```
## 📄 License

MIT License © 2025 [Vishnu Haridas](https://iamvishnu.com). See [LICENSE](license) for full details.
