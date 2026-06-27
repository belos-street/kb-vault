/**
 * 天气 FAQ 向量检索器
 * - 基于 Vectra 本地向量索引进行语义检索
 */
import { LocalDocumentIndex, OpenAIEmbeddings } from "vectra";
import { config } from "../config.js";

export interface FAQResult {
  question: string;
  answer: string;
  score: number;
}

let index: LocalDocumentIndex | null = null;

function getIndex(): LocalDocumentIndex {
  if (!index) {
    index = new LocalDocumentIndex({
      folderPath: config.VECTOR_STORE_PATH,
      embeddings: new OpenAIEmbeddings({
        apiKey: config.OPENAI_API_KEY,
        model: "text-embedding-3-small",
        endpoint: config.OPENAI_BASE_URL,
      }),
    });
  }
  return index;
}

/**
 * 检索与查询最相关的 FAQ
 * @param query 用户查询
 * @param maxDocuments 最多返回的 FAQ 数量
 * @returns FAQ 结果列表（按相似度排序）
 */
export async function retrieveFAQ(query: string, maxDocuments = 3): Promise<FAQResult[]> {
  const docIndex = getIndex();

  if (!(await docIndex.isIndexCreated())) {
    return [];
  }

  const results = await docIndex.queryDocuments(query, { maxDocuments });
  const faqResults: FAQResult[] = [];

  for (const result of results) {
    const metadata = await result.loadMetadata();
    faqResults.push({
      question: String(metadata.question ?? ""),
      answer: String(metadata.answer ?? ""),
      score: result.score,
    });
  }

  return faqResults;
}
