# Publishing on GitLab Pages

Deploying to GitLab Pages is straightforward by simply adding a `.gitlab-ci.yml` file. This configuration automates the build and deployment process. By default, GitLab Pages are published from the root directory, so no additional base path configuration is required.

## Steps

1. Ensure your repository contains the `.gitlab-ci.yml` file. You can use the one provided with this document.
2. Push your changes to the `main` branch.
3. GitLab will automatically build and deploy your site to GitLab Pages.

## Sample `gitlab-ci.yml` file

```yml
image: node:20

pages:
  stage: deploy
  script:
    - npm install
    - npm run build # or `node build your-site.config.js`

  artifacts:
    paths:
      - public

  only:
    - main
```

**Note:** You can customize the `.gitlab-ci.yml` file to suit your specific requirements, such as adding additional steps.