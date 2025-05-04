# Publishing on Cloudflare Pages

Deploying your April⋅SSG site to Cloudflare Pages offers a fast, free, and scalable hosting solution with unlimited bandwidth and built-in web analytics.

## Prerequisites

*   A Cloudflare account.
*   Your April⋅SSG project pushed to a GitHub or GitLab repository.

## Deployment Steps

1.  Log in to your Cloudflare dashboard.
2.  Navigate to **Workers & Pages**.
3.  Click **Create application**, select the **Pages** tab, and then click **Connect to Git**.
4.  Choose the Git provider (GitHub or GitLab) where your project repository is hosted and authorize Cloudflare access if prompted.
5.  Select the repository containing your April⋅SSG project.
6.  In the **Set up builds and deployments** section, configure the following settings:
    *   **Production branch:** Select the branch you want to deploy (e.g., `main` or `master`).
    *   **Framework preset:** (Optional) You can leave this or select `None`.
    *   **Build command:** `npm run build` (or your specific build script if different).
    *   **Build output directory:** `public`.
7.  Click **Save and Deploy**.

Cloudflare will now clone your repository, build your project using the specified command, and deploy the contents of the build output directory.

Once the deployment is complete, your April⋅SSG site will be accessible via the unique `.pages.dev` subdomain provided by Cloudflare (e.g., `your-project-name.pages.dev`). You can also configure a custom domain through the Cloudflare Pages dashboard.