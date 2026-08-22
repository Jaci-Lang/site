import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import sanitizeHtml from 'sanitize-html';
import MarkdownIt from 'markdown-it';
const parser = new MarkdownIt();

export async function GET(context) {
  const posts = await getCollection('blog');
  const sorted = posts.sort((a, b) => new Date(b.data.date).valueOf() - new Date(a.data.date).valueOf()).reverse();

  return rss({
    title: 'Jaci Blog',
    description: 'A blazing-fast, embeddable Luau fork optimized for standalone applications, general-purpose systems programming, and high-performance native execution.',
    site: "https://jaci-lang.github.io/site",
    customData: `<language>en-us</language>`,
    items: sorted.map((post) => {
      let authorName = 'Jaci Team';
      if (post.data.authors && post.data.authors.length > 0) {
        authorName = post.data.authors.map((a) => (typeof a === 'string' ? a : a.name)).join(', ');
      } else if (post.data.author) {
        authorName = typeof post.data.author === 'string' ? post.data.author : post.data.author.name;
      }

      return {
        title: post.data.title,
        pubDate: post.data.date,
        description: post.data.description,
        author: authorName,
        link: `/site/blog/${post.id}`,
        content: sanitizeHtml(parser.render(post.body || ''), {
          allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
        }),
      };
    }),
  });
}

