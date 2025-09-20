import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { vectorStore } from '../lib/vectorStore';
import { openai } from '@ai-sdk/openai';
import { embed } from 'ai';

export const vectorSearchTool = createTool({
  id: 'vector-search-tool',
  description: 'Search for relevant PDF chunks using embeddings',
  inputSchema: z.object({
    query: z.string(),
    topK: z.number().optional().default(5),
  }),
  outputSchema: z.object({
    results: z.array(
      z.object({
        id: z.string(),
        content: z.string(),
        score: z.number(),
      })
    ),
  }),
  execute: async (context) => {
    try {
      const { query } = context;
      // Step 1: Generate embedding for the query
      const { embedding } = await embed({
        model: openai.embedding('text-embedding-3-large'),
        value: query,
      });

      // Step 2: Query vector store
      const results = await vectorStore.search({
        queryVector: embedding,
        topK: context.topK,
      });

      // TODO: Map the results to the outputSchema correctly
      return {
        results: results.map((r: any) => ({
          id: r.id,
          content: r.metadata?.text || '',
          score: 1 - r.distance, // smaller distance = higher score
        })),
      };
    } catch (err) {
      console.error('Vector search failed:', err);
      return { results: [] };
    }
  },
});
