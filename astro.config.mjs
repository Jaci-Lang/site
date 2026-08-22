// @ts-check

import path from "node:path";

import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

import tailwindcss from "@tailwindcss/vite";
import remarkLuauPlayground from "./src/plugins/remark-luau-playground";

import starlightSiteGraph from 'starlight-site-graph';
import starlightImageZoom from 'starlight-image-zoom';

// https://astro.build/config
export default defineConfig({
  site: 'https://jaci-lang.github.io',
  base: '/site',

  redirects: {
    "/typecheck": "/site/types",
    "/typecheck/basic-types": "/site/types/basic-types",
    "/typecheck/considerations": "/site/types/considerations",
    "/typecheck/generics": "/site/types/generics",
    "/typecheck/object-oriented-programs": "/site/types/object-oriented-programs",
    "/typecheck/overview": "/site/types/",
    "/typecheck/refinements": "/site/types/type-refinements",
    "/typecheck/tables": "/site/types/tables",
    "/typecheck/type-functions": "/site/types/type-functions",
    "/typecheck/unions-and-intersections": "/site/types/unions-and-intersections",
    "/news": "/site/blog",
  },

  markdown: {
    remarkPlugins: [remarkLuauPlayground],
  },

  integrations: [
    {
      name: "luau-playground",
      hooks: {
        'astro:config:setup': function({ addWatchFile }) {
          const remarkPlugin = path.resolve("src", "plugins", "remark-luau-playground.ts");
          addWatchFile(remarkPlugin);
        }
      }
    },
    starlight({
      plugins: [
        starlightSiteGraph(),
        starlightImageZoom()
      ],
      title: "Jaci",
      favicon: "/favicon.svg",
      head: [
        { tag: "link", attrs: { rel: "alternate", type: "application/rss+xml", title: "Jaci Blog", href: "https://jaci-lang.github.io/site/feed.xml" }}
      ],
      logo: {
        src: "./logo.svg",
        alt: "The official logo of the Jaci programming language."
      },
      customCss: [
        // Path to your Tailwind base styles:
        './src/styles/global.css',
        './src/fonts/font-face.css'
      ],
      components: {
        Header: "./src/components/Header.astro",
        PageFrame: "./src/components/PageFrame.astro",
        ContentPanel: "./src/components/ContentPanel.astro",
      },
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/jaci-lang/jaci",
        },
        {
          icon: "rss",
          label: "RSS Feed",
          href: "/site/feed.xml",
        },
      ],
      sidebar: [
        {
          label: "Getting Started",
          autogenerate: { directory: "getting-started" },
        },
        {
          label: "Advanced Users",
          autogenerate: { directory: "guides" },
        },
        {
          label: "Type System",
          autogenerate: { directory: "types" },
        },
        {
          label: "Reference",
          autogenerate: { directory: "reference" },
        },
      ],
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
