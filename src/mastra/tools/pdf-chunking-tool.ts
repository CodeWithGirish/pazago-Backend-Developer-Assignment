// tools/chunking-tool.ts
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { vectorStore } from '../lib/vectorStore'; // this should wrap Postgres + pgvector
import { embed } from 'ai';
import { openai } from '@ai-sdk/openai'; // from @ai-sdk/openai or ai


// Simple text chukker
function chunkText(text: string, chunkSize = 1000, overlap = 200): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end);
    chunks.push(chunk);
    start += chunkSize - overlap;
  }

  return chunks;
}

export const chunkingTool = createTool({
  id: 'chunking-tool',
  description: 'Splits large text into chunks, embeds them, and stores in Postgres vector database',
  inputSchema: z.object({
    text: z.string().min(1, 'Text input is required'),
    documentId: z.string().optional(), // useful if you want to group chunks by doc
  }),
  execute: async (context) => {
    // 1. Chunk the input text
    const chunks = chunkText(context.text);

    // 2. Generate embeddings for each chunk
    const embeddings = await Promise.all(
      chunks.map(async (chunk) => {
        const { embedding } = await embed({
          model: openai.embedding('text-embedding-3-large'), // you can swap to large if needed
          value: chunk, 
        });
        return embedding;
      })
    );

    // 3. Store chunks + embeddings into vectorStore (pgvector)
    const documentId = context.documentId || 'doc';

    await Promise.all(
      chunks.map((chunk, i) =>
        vectorStore.add({
          id: `${documentId}-chunk-${i}`,
          values: embeddings[i],
          metadata: {
            text: chunk,
            documentId,
            chunkIndex: i,
          },
        })
      )
    );
    

    return {
      success: true,
      chunksStored: chunks.length, 
      documentId: context.documentId || 'unknown',
    };
  },
});
