---
title: About April⋅SSG
---
April⋅SSG is a lightweight, super simple static site generator written in JavaScript. It focuses on minimalism and ease of use, making it an ideal choice for developers who want to create simple static websites without unnecessary complexity.

April⋅SSG was born out of my frustration with tools like Jekyll and Hugo. They always seemed to overcomplicate things when all I wanted was a clean, minimalistic design for my site. After countless hours of trial and error, I decided to build a very simple static site generator with the help of Copilot. I'll be sharing the full story in an upcoming blog post—stay tuned!

## Installing April⋅SSG

Installing April⋅SSG is easy. You create a clone of this repository, update contents, and your static site is ready!

First, clone the repository:

```shell
$ git clone https://github.com/vishnuharidas/april-ssg
```

Install dependencies:

```shell
$ npm install
```

### Running the Sample Website

The repository includes sample posts, a page, and images to get you started. These examples serve as a practical guide, allowing you to quickly understand the structure and begin creating your own content. To build the sample site:

```shell
$ npm run build-sample
```

Generated site is available inside the `public/` folder.

To preview the static site locally:

```shell
$ npm run dev-sample
```

Visit `http://127.0.0.1:8080` to see the sample website in action. Stop the server by pressing Ctrl+C.

### Setting up April⋅SSG

Once the sample website is up and running successfully, you can set up April⋅SSG to add your content. The set up is very simple: copy the `sample-content` folder to a new `content` folder, and copy the file `sample-site.config.json` to `site.config.json` and update.

If you are lazy to do so, you can run this command to do this:

```shell
$ npm run setup
```

This will create the content folder and the configuration file for you, and you can start creating contents right away.

To preview the static site locally, run the below command and visit `http://127.0.0.1:8080` to see the website in action.

```shell
$ npm run dev
```

## Folder Structure

April⋅SSG follows a very simple folder structure. Everything inside the `content` folder belogs to you.

```
content/
├── posts/
│   ├── <yyyy-mm-dd>-<slug-this-post>.md  (Copied directly to /public/posts/slug-this-post.html)
│   └── <yyyy-mm-dd>-<slug-another-post>.md
├── pages/
│   ├── page1.md      (Copied directly to /public/page1.html)
│   └── page2.md
├── images/
│   ├── image1.jpg    (Copied directly to /public/images/image1.jpg)
│   └── image2.jpg
└── extras/           (Copied directly to /public/*)
    ├── some-good-file.html
    └── cv/
        └── my_cv.pdf
```

  *   **Posts:** Markdown files placed in `/content/posts/` (following the `<yyyy-mm-dd>-<slug>.md` format) are converted into individual post pages using the `post.html` template. These posts will also be listed on the main index page.
  *   **Pages:** Markdown files placed in `/content/pages/` (e.g., `about.md`) are converted into standalone pages using the `page.html` template.
  *   **Images:** Files within the `/content/images/` folder are copied directly to `/public/images/`.
  *   **Extras:** Any files or folders you place in the `/content/extras/` directory (e.g., PDFs, specific HTML files, subdirectories) are copied directly into the `/public/` directory. Be mindful not to use filenames that might clash with the generated page or post filenames.
  
### Output Directory
All generated HTML files (posts and pages) are placed in the `/public/` directory. You can upload this file to your website, or set up GitHub Pages and copy this folder. The repository already comes with a GitHub Pages workflow.

## Configuration

Modify `site.config.json` file to configure your directories, navigation menu, and base path (if hosting inside a directory).

## Modifying Look and Feel

```
templates/
├── footer.html     (Footer content - copyright, etc.)
├── header.html     (Header - title, meta, etc.)
├── list.html       (Body of a listing page. Eg. home page uses this.)
├── page.html       (Body of a normal page (/content/file.md))
├── post.html       (Body of a post page (/content/posts/...md))
└── styles.css      (All CSS styles)
```

You can customize the site's layout by editing the HTML files in the `templates` folder. To change colors and styles, modify `styles.css`. All modifications will be reflected in the next build.

## License

Copyright (c) 2025 Vishnu Haridas

This software is published under MIT License. See [LICENSE](license) for more details