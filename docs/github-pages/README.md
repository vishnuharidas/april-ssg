# Publishing on GitHub Pages

A sample GitHub Actions workflow file (`deploy.yml`) is included with this document that builds and deploys the sample site to GitHub Pages.

## Steps

1. Copy the workflow file to the GitHub Workflows directory of your repo (`/.github/workflows/deploy.yml`).
2. Update the `BASE_PATH`.
    - This is required because by default, GitHub Pages publishes websites under a subdirectory. For example, if your repo is https://username.github.com/my-awesome-blog, then GitHub Pages URL will be https://username.github.io/my-awesome-blog. To ensure that all links, images, and other files are linked properly, every list must use a prefit of `/my-awesome-blog`. The `BASE_PATH` configuration is intented for this.
3. Push your changes to the `main` branch.
4. GitHub Pages will automatically build and deploy your pages.

## Sample `.github/workflows/deploy.yml` file

```yml
name: Deploy April⋅SSG Website to GitHub Pages

# This workflow builds and deploys the April⋅SSG sample site to GitHub Pages on the original April⋅SSG repository.
#
# To use in your own repo:
# 1. Copy this file to `/.github/workflows/deploy.yml`
# 2. Set `BASE_PATH` to your GitHub Pages path (e.g., /my-blog or "")

env:
  CONFIG_FILE: site.config.json

  BASE_PATH: /april-ssg
  # - Use "/repo-name" if deploying to https://username.github.io/repo-name
  # - Use "/directory" if deploying to a subdirectory (e.g., https://example.com/directory)
  # - Use "" (empty string) if deploying to the root of a domain (e.g., custom domain or https://username.github.io)

on:
  push:
    branches:
      - main

permissions:
  contents: write

jobs:
  build-deploy:
    
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm install

      - name: Override config basePath for GitHub Pages
        run: |
          echo "Setting basePath=${BASE_PATH} in ${CONFIG_FILE}"
          jq ".basePath=\"${BASE_PATH}\"" "$CONFIG_FILE" > github-pages-temp.config.json

      - name: Build static site
        run: node build.js github-pages-temp.config.json

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./public
          publish_branch: gh-pages
          user_name: "github-actions[bot]"
          user_email: "github-actions[bot]@users.noreply.github.com"
```

**Note:** You can customize the `deploy.yml` file to suit your specific requirements, such as adding additional steps.