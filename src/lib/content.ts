import { getCollection } from 'astro:content';

export async function publishedDocs() {
  return (await getCollection('docs', ({ data }) => !data.draft))
    .sort((a, b) => a.data.order - b.data.order || a.data.title.localeCompare(b.data.title));
}

export async function publishedNews() {
  return (await getCollection('news', ({ data }) => !data.draft))
    .sort((a, b) => b.data.published.valueOf() - a.data.published.valueOf());
}

export function displayDate(date: Date): string {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: 'UTC' }).format(date);
}
