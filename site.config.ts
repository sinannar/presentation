import type { PresentationConfig } from './src/lib/deck';

interface SiteConfig {
  title: string;
  description: string;
  author: string;
  tagline: string;
  primaryLink: { label: string; href: string };
  sections: readonly { id: string; label: string; href: string }[];
  presentation?: PresentationConfig;
}

export const siteConfig: SiteConfig = {
  title: 'From notes to keynote',
  description: 'A presentation template that explains how to make it your own.',
  author: 'The presentation template',
  tagline: 'Your story, built with agents and ready to share.',
  primaryLink: {
    label: 'Create your repo',
    href: 'https://github.com/sinannar/presentation',
  },
  sections: [
    { id: 'docs', label: 'Docs', href: '/docs/' },
    { id: 'news', label: 'News', href: '/news/' },
  ],
} as const;
