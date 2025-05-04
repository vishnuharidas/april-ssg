# April⋅SSG - a lightweight, simple static site generator

**April⋅SSG** is a lightweight, super-simple static site generator written in JavaScript. It focuses on **minimalism and ease of use**, making it an ideal choice for developers who want to create static websites without unnecessary complexity.

April⋅SSG was born out of my frustration with tools like Jekyll and Hugo. They always seemed to overcomplicate things when all I wanted was a clean, minimalistic site. After countless hours of trial and error, I built a simple static site generator with the help of Copilot. Discover the full story behind [why I built April⋅SSG](https://iamvishnu.com/posts/why-i-built-april-static-site-generator).

---

## 🚀 Installing April⋅SSG

Getting started is easy. Clone or fork this repository and you're ready to build your static site!

```bash
git clone https://github.com/vishnuharidas/april-ssg.git my-site
cd my-site
npm install
```

---

## 🧪 Running the Sample Website

This repository includes sample posts, a page, and images to help you get started. They serve as a guide for understanding the structure and creating your own content.

To build the sample site:

```bash
npm run build-sample
```

The generated site will be available inside the `public/` folder.

To preview the site locally:

```bash
npm run dev-sample
```

Visit [http://127.0.0.1:8080](http://127.0.0.1:8080) in your browser.

> **Note:** `npm run dev-sample` watches for changes and automatically rebuilds. Just refresh the browser to see updates.

---

## ✍️ Setting Up April⋅SSG for Your Own Content

Once you've tested the sample site, you can configure April⋅SSG for your own content.

### Manual Setup

1. Copy `/sample-content` to `/content`
2. Copy `sample-site.config.json` to `site.config.json`
3. Update the config file to match your needs

### One-Liner Setup

If you'd rather skip the manual steps, run:

```bash
npm run setup
```

This command creates the necessary folders and config file, so you can start writing immediately.

To serve your site locally:

```bash
npm run dev
```

Visit [http://127.0.0.1:8080](http://127.0.0.1:8080) in your browser.

> **Note:** `npm run dev` watches for file changes and rebuilds your site automatically.

---

## 📁 Folder Structure

April⋅SSG uses a simple, minimal folder structure:

```
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

---

## 📤 Output Directory

All generated HTML, assets, and copied files are placed in the `/public/` directory. You can deploy this to any static hosting platform (e.g., GitHub Pages, Firebase, Amazon S3, etc.).

---

## 🛠 GitHub Pages Workflow

This repository includes a GitHub Actions workflow (`.github/workflows/sample-deploy.yml`) that builds and deploys the sample site to GitHub Pages.

> **Note for cloners/forkers:**  
> The workflow is **guarded** to run only in the original repo (`vishnuharidas/april-ssg`). To use April⋅SSG with GitHub Pages in your own repo:
>
> 1. Copy the workflow file to your repo (e.g., `.github/workflows/deploy.yml`)
> 2. Remove or modify the repository guard condition
> 3. Update the `BASE_PATH` and config file name in the workflow as needed

---

## 🛠 GitLab Pages Workflow

Deploying to GitLab Pages is straightforward with the included `.gitlab-ci.yml` file. This configuration automates the build and deployment process. By default, GitLab Pages are published from the root directory, so no additional base path configuration is required.

To use this workflow:

1. Ensure your repository contains the `.gitlab-ci.yml` file
2. Push your changes to the `main` branch
3. GitLab will automatically build and deploy your site to GitLab Pages

> **Note:** You can customize the `.gitlab-ci.yml` file to suit your specific requirements, such as changing the build directory or adding additional steps.

---

## 🛠 Cloudflare Pages Workflow

Deploying your April⋅SSG site to Cloudflare Pages is the fast and easiest way to publish your website. Cloudflare Pages is free with unlimited visitor bandwidth.

To deploy using Cloudflare Pages:

1.  Navigate to your Cloudflare dashboard, go to **Workers & Pages**, and select **Create application**. Choose **Pages** and then **Connect to Git**.
2.  Select the Git repository (GitHub or GitLab) where your April⋅SSG project resides.
3.  In the **Set up builds and deployments** section, configure the following:
    *   **Build command:** `npm run build`
    *   **Build output directory:** `public`
4.  Click **Save and Deploy**. Cloudflare will build and deploy your site.

Your April⋅SSG site will be live on the provided Cloudflare Pages URL (eg., [https://april-ssg.pages.dev/](https://april-ssg.pages.dev/)) shortly after the deployment completes.

---

## 🎨 Customizing the Look and Feel

```
templates/
├── footer.html     → Footer section for all pages
├── header.html     → Header section for all pages
├── list.html       → Layout for listing pages (e.g. homepage)
├── page.html       → Template for standalone pages
├── post.html       → Template for blog posts
└── styles.css      → All your custom styles
```

You can fully customize your site by editing the HTML templates and `styles.css`. All changes will be reflected in the next build.

---

## 📄 License

MIT License © 2025 [Vishnu Haridas](https://iamvishnu.com). See [LICENSE](LICENSE.txt) for full details.
