---
title: Share with GitHub Pages
summary: Enable GitHub Actions as the Pages source, then deploy your approved presentation.
category: Step 3
order: 3
takeaway: In Settings → Pages, select GitHub Actions; then push to the default branch and check the deployment.
reveals:
  - Select GitHub Actions as the Pages build and deployment source.
  - Push approved changes to main, then check the Actions workflow.
speakerNotes:
  talkingPoints:
    - GitHub Pages uses the included Actions workflow to build and publish the site.
    - Open the Pages URL after the deployment succeeds.
  technicalDetails:
    - Repository permissions or environment rules may require additional setup or approval.
    - The starter workflow publishes from main.
  transition: The template is ready to adapt again as the published story changes.
---

In your repository, open **Settings → Pages** and select **GitHub Actions** as the build and deployment source. The included workflow builds the site and publishes it from `main`.

Push your approved changes to `main`, check the workflow in the **Actions** tab, and open the Pages URL once deployment succeeds. Repository permissions or environment rules may require additional setup or approval.
