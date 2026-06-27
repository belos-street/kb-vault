/**
 * 天气 FAQ 向量索引构建
 * - 读取 src/rag/faq-data.json
 * - 使用 Vectra + OpenAI Embeddings 构建本地向量索引
 *
 * 运行方式：bun run src/rag/indexer.ts
 */
import { LocalDocumentIndex, OpenAIEmbeddings } from "vectra";
import { config } from "../config.js";
import faqData from "./faq-data.json" with { type: "json" };

const index = new LocalDocumentIndex({
  folderPath: config.VECTOR_STORE_PATH,
  embeddings: new OpenAIEmbeddings({
    apiKey: config.OPENAI_API_KEY,
    model: "text-embedding-3-small",
    endpoint: config.OPENAI_BASE_URL,
  }),
});

async function buildIndex(): Promise<void> {
  if (!(await index.isIndexCreated())) {
    await index.createIndex({ version: 1 });
  }

  for (const item of faqData) {
    await index.upsertDocument(
      `faq://${item.id}`,
      `${item.question}\n${item.answer}`,
      "md",
      {
        question: item.question,
        answer: item.answer,
      }
    );
  }

  console.log(`已索引 ${faqData.length} 条 FAQ，索引路径：${config.VECTOR_STORE_PATH}`);
}

buildIndex().catch((error) => {
  console.error("构建 FAQ 索引失败：", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
