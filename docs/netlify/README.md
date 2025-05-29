# Publishing on Netlify

Netlify provides fast, reliable, and free static site hosting with continuous deployment from your Git repository.

## Prerequisites

- A Netlify account.
- Your April⋅SSG project pushed to a GitHub, GitLab, or Bitbucket repository.

## Deployment Steps

1. Log in to your Netlify dashboard.
2. Click **Add new site** > **Import an existing project**.
3. Connect your Git provider and select your repository.
4. Configure the following build settings:
    - **Build command:** `npm run build` (or your custom build script)
    - **Publish directory:** `public`
5. Click **Deploy site**.

Netlify will clone your repository, run the build command, and deploy the contents of the `public` directory. Your site will be live on a Netlify subdomain (e.g., `your-site.netlify.app`). You can also set up a custom domain through the Netlify dashboard.
