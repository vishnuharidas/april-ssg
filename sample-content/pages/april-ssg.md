---
title: About April⋅SSG
---
April⋅SSG is a lightweight, super simple static site generator written in JavaScript. It focuses on minimalism and ease of use, making it an ideal choice for developers who want to create static websites without unnecessary complexity.

April⋅SSG was born out of my frustration with tools like Jekyll and Hugo. They always seemed to overcomplicate things when all I wanted was a clean, minimalistic design for my site. After countless hours of trial and error, I decided to build a very simple static site generator with the help of Copilot. I'll be sharing the full story in an upcoming blog post—stay tuned!

## Installing April⋅SSG (standalone)

Installing SSG standalone is the easiest way. You create a clone of this repository, update contents, and your static site is ready!

First, clone the repository:

```shell
$ git clone 
```

Install dependencies:

```shell
$ npm install
```

The repository includes sample posts, a page, and images to get you started. These examples serve as a practical guide, allowing you to quickly understand the structure and begin creating your own content.

```shell
$ npm run build
```

Generated site is available inside the `public/` folder. You can upload this to your server, or publish on services like GitHub pages.

To preview the static site locally:

```shell
$ npm run dev
```

## Folder Structure

April⋅SSG follows a very simple folder structure. Apart from the default core folders (`templates` and `css`), below are the folders where you put your actual content.

```
/
├── content/
│   ├── posts/
│   │   ├── <yyyy-mm-dd>-<slug-this-post>.md
│   │   └── <yyyy-mm-dd>-<slug-another-post>.md
│   ├── page1.md    // generates `page1.html` and copied to `public/`
│   └── page2.md
├── images/
│   ├── image1.jpg
│   └── image2.png
├── extras/                 // everything here is directly copied to `public/`
│   ├── some-good-file.html
│   ├── some-video.html
│   └── cv/
│       └── my_cv.pdf
```

  *   **Posts:** Markdown files placed in `/content/posts/` (following the `<yyyy-mm-dd>-<slug>.md` format) are converted into individual post pages using the `post.html` template. These posts will also be listed on the main index page.
  *   **Pages:** Other Markdown files directly inside `/content/` (e.g., `about.md`) are converted into standalone pages using the `page.html` template.
  *   **Output:** All generated HTML files (posts and pages) are placed in the `/public/` directory.
  *   **Images:** Files within the `/images/` folder are copied directly to `/public/images/`.
  *   **Extras:** Any files or folders you place in the `/extras/` directory (e.g., PDFs, specific HTML files, subdirectories) are copied directly into the `/public/` directory. Be mindful not to use filenames that might clash with the generated page or post filenames.



## Modifying Look and Feel

```
/templates
├── footer.html     // Footer content - copyright, etc.
├── header.html     // Header - title, meta, etc.
├── list.html       // Body of a listing page. Eg. home page uses this.
├── page.html       // Body of a normal page (/content/file.md)
└── post.html       // Body of a post page (/content/posts/...md)
```

You can customize the site's layout by editing the HTML files in the `templates` folder. To change colors and styles, modify `css/styles.css`. All modifications will be reflected in the next build.

## Installing April⋅SSG (Git submodule) - Advanced

Installing April⋅SSG as a Git submodule is an option if you want to pull the latest updates of April⋅SSG. 

TODO: add more details on Git submodule

## License

Copyright (c) 2025 Vishnu Haridas

This software is published under MIT License. See [LICENSE](license) for more details