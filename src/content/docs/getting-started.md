---
title: Create your repository
summary: On github.com/sinannar/presentation, select “Use this template” to create your own repository.
category: Step 1
order: 1
takeaway: Open a Codespace or clone your copy and run the local preview.
featured: true
reveals:
  - Create a new repository from the template.
  - Open a Codespace or install dependencies locally.
speakerNotes:
  talkingPoints:
    - Use “Use this template” to create a repository you own.
    - Open a Codespace or clone that repository to preview it locally.
  technicalDetails:
    - Use Node.js 22.23.4 or newer.
    - In a Codespace dependencies install on creation; run npm run dev -- --host 0.0.0.0 and open the forwarded port.
  transition: With a local copy ready, decide what audience and outcome should shape the story.
---

## Start from the template

Visit [sinannar/presentation](https://github.com/sinannar/presentation), select **Use this template**, then create a new repository. Open a Codespace from that repository, or clone it to your computer.

## Preview locally

In a Codespace, wait for setup and run `npm run dev -- --host 0.0.0.0`, then open the forwarded port. Locally, install Node.js 22.23.4 or newer, run `npm ci`, then run `npm run dev` and open the URL printed in your terminal.
