import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
//import { pdfToQuestionsWorkflow } from './workflows/generate-questions-from-pdf-workflow';
//import { textQuestionAgent } from './agents/text-question-agent';
//import { pdfQuestionAgent } from './agents/pdf-question-agent';
import { pdfSummarizationAgent } from './agents/pdf-summarization-agent';
import { PostgresStore } from '@mastra/pg';
export const mastra = new Mastra({
  workflows: { },
  agents: {
    // textQuestionAgent,
    // pdfQuestionAgent,
    pdfSummarizationAgent,
  },
  // storage: new PostgresStore({
  //   // stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
  //   connectionString: process.env.POSTGRES_CONNECTION_STRING || ':memory:',
  // }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
