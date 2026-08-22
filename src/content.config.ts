import { defineCollection, z } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

import { glob, type Loader, type LoaderContext } from 'astro/loaders';

export type StarlightCollection = 'docs' | 'i18n' | 'blog';

/**
 * Helper functions to get paths to collections.
 */
export function getCollectionUrl(collection: StarlightCollection, srcDir: URL) {
	return new URL(`content/${collection}/`, srcDir);
}

export function getCollectionPathFromRoot(
	collection: StarlightCollection,
	{ root, srcDir }: { root: URL | string; srcDir: URL | string }
) {
	return (
		(typeof srcDir === 'string' ? srcDir : srcDir.pathname).replace(
			typeof root === 'string' ? root : root.pathname,
			''
		) +
		'content/' +
		collection
	);
}

const docsExtensions = ['markdown', 'mdown', 'mkdn', 'mkd', 'mdwn', 'md', 'mdx'];
const i18nExtensions = ['json', 'yml', 'yaml'];

type GlobOptions = Parameters<typeof glob>[0];
type GenerateIdFunction = NonNullable<GlobOptions['generateId']>;

function blogLoader({
	generateId,
}: {
	generateId?: GenerateIdFunction;
} = {}): Loader {
	return {
		name: 'starlight-blog-loader',
		load: createGlobLoadFn('blog', generateId),
	};
}

function createGlobLoadFn(
	collection: StarlightCollection,
	generateId?: GenerateIdFunction
): Loader['load'] {
	return (context: LoaderContext) => {
		const extensions = collection === 'blog' ? docsExtensions : i18nExtensions;

		if (
			collection === 'blog' &&
			context.config.integrations.find(({ name }) => name === '@astrojs/markdoc')
		) {
			extensions.push('mdoc');
		}

		const options: GlobOptions = {
			base: getCollectionPathFromRoot(collection, context.config),
			pattern: `**/[^_]*.{${extensions.join(',')}}`,
		};
		if (generateId) options.generateId = generateId;

		return glob(options).load(context);
	};
}

const authorSchema = z.object({
	name: z.string(),
	title: z.string().optional(),
	url: z.string().optional(),
	picture: z.string().optional(),
});

export const collections = {
	docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
	blog: defineCollection({
		loader: blogLoader(),
		schema: docsSchema({
			extend: z.object({
				date: z.date(),
				lastUpdated: z.date().optional(),
				author: z.union([z.string(), authorSchema]).optional(),
				authors: z.array(z.union([z.string(), authorSchema])).optional(),
				tags: z.array(z.string()).optional(),
				editUrl: z.union([z.string(), z.boolean()]).optional(),
			}),
		}),
	}),
};
