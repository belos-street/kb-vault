# 1.1 AI/ML 核心概念科普

> 从全栈工程师视角理解 AI/ML 核心概念，为 Agent 开发打下坚实基础

## 学习目标

- 理解 Transformer 架构的核心原理
- 掌握 Embedding 向量化的本质
- 了解 Tokenization 与上下文窗口的工作机制
- 熟悉主流大模型的特点与适用场景
- 掌握模型选型与成本优化策略

---

## 1. Transformer 架构原理

### 1.1 什么是 Transformer

Transformer 是 2017 年 Google 在论文《Attention Is All You Need》中提出的神经网络架构，彻底改变了 NLP 领域，成为当今所有大语言模型（LLM）的基础。

**核心创新**：
- **自注意力机制（Self-Attention）**：让模型能够关注输入序列中任意位置的信息
- **并行计算**：相比 RNN/LSTM，Transformer 可以并行处理整个序列
- **位置编码**：通过位置编码保留序列顺序信息

### 1.2 自注意力机制详解

```
输入: "The cat sat on the mat"

Self-Attention 计算:
1. 为每个词生成 Query (Q), Key (K), Value (V) 向量
2. 计算注意力分数: score = Q × K^T / √d_k
3. 应用 Softmax 归一化
4. 加权求和得到输出: output = softmax(score) × V
```

**直观理解**：
- 当模型处理 "cat" 这个词时，它会同时关注 "sat"（动作）和 "mat"（位置）
- 注意力分数决定了每个词对当前词的重要程度
- 这种机制让模型能够理解长距离依赖关系

### 1.3 多头注意力（Multi-Head Attention）

```typescript
// 伪代码示例
class MultiHeadAttention {
  private heads: AttentionHead[];
  
  constructor(numHeads: number = 8) {
    this.heads = Array.from({ length: numHeads }, () => new AttentionHead());
  }
  
  forward(x: Tensor): Tensor {
    // 每个头独立计算注意力
    const headOutputs = this.heads.map(head => head.forward(x));
    // 拼接所有头的输出
    return concat(headOutputs);
  }
}
```

**为什么需要多头**：
- 不同的头可以关注不同类型的语言关系
- 例如：一个头关注语法结构，另一个头关注语义相似性
- GPT-4 有 96 个注意力头，Claude 有 64 个

### 1.4 Transformer 的核心组件

```
┌─────────────────────────────────────┐
│           Transformer Block          │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │    Multi-Head Attention     │   │
│  └─────────────────────────────┘   │
│           ↓ Add & Norm              │
│  ┌─────────────────────────────┐   │
│  │    Feed-Forward Network     │   │
│  └─────────────────────────────┘   │
│           ↓ Add & Norm              │
└─────────────────────────────────────┘
```

**关键组件**：
- **Layer Normalization**：稳定训练过程
- **残差连接**：缓解梯度消失问题
- **Feed-Forward Network**：非线性变换，增加模型容量

---

## 2. Embedding 向量化原理

### 2.1 什么是 Embedding

Embedding 是将离散的符号（如文字、图片）映射到连续向量空间的技术。它是大模型理解世界的"翻译器"。

**核心思想**：
- 语义相似的概念在向量空间中距离更近
- 向量的每一维度代表某种潜在的语义特征
- 通过向量运算可以实现语义推理

### 2.2 文本 Embedding

```
"国王" → [0.2, 0.8, 0.1, ...]  (768维向量)
"王后" → [0.3, 0.7, 0.2, ...]  (768维向量)
"苹果" → [0.9, 0.1, 0.5, ...]  (768维向量)

向量距离:
- 国王 ↔ 王后 = 0.15 (很近，语义相似)
- 国王 ↔ 苹果 = 0.85 (很远，语义不同)
```

### 2.3 主流 Embedding 模型

| 模型 | 维度 | 特点 | 适用场景 |
|------|------|------|----------|
| OpenAI text-embedding-3-large | 3072 | 性能最强，成本较高 | 企业级应用 |
| OpenAI text-embedding-3-small | 1536 | 性价比高 | 通用场景 |
| Cohere embed-v3 | 1024 | 多语言支持好 | 国际化应用 |
| BGE-M3 | 1024 | 开源免费 | 本地部署 |
| GTE-Qwen2 | 768-1536 | 中文优化 | 中文场景 |

### 2.4 Embedding 的实际应用

**语义搜索**：
```typescript
// 1. 将文档转换为向量
const docEmbeddings = await embedDocuments(documents);

// 2. 将查询转换为向量
const queryEmbedding = await embedQuery("如何学习 TypeScript");

// 3. 计算相似度
const similarities = docEmbeddings.map(doc => 
  cosineSimilarity(queryEmbedding, doc.embedding)
);

// 4. 返回最相关的文档
return documents[argmax(similarities)];
```

**聚类分析**：
```typescript
// 将客户反馈聚类，发现常见问题
const feedbackEmbeddings = await embedBatch(feedbacks);
const clusters = kMeans(feedbackEmbeddings, k=5);
```

---

## 3. Tokenization 与上下文窗口

### 3.1 什么是 Tokenization

Tokenization 是将文本分割成模型能理解的最小单元（Token）的过程。

**分词示例**：
```
输入: "Hello, how are you?"

Token 化结果（GPT 系列）:
["Hello", ",", " how", " are", " you", "?"]

Token 化结果（中文模型）:
["你好", "，", "你", "怎么样", "？"]
```

### 3.2 主流分词算法

**BPE（Byte Pair Encoding）**：
- GPT 系列使用
- 从字符级别开始，逐步合并高频字符对
- 优点：平衡词汇量和分词粒度

**WordPiece**：
- BERT 使用
- 类似 BPE，但使用似然概率而非频率
- 优点：更适合特定领域

**SentencePiece**：
- 多语言模型使用
- 直接在原始文本上训练，不依赖预分词
- 优点：语言无关，适合多语言场景

### 3.3 上下文窗口

上下文窗口（Context Window）是模型一次能处理的 Token 数量上限。

**2026年主流模型上下文窗口**：
| 模型 | 上下文窗口 | 约等于 |
|------|-----------|--------|
| GPT-5 | 400K tokens | 30万字 |
| Claude Opus 4.6 | 1M tokens | 75万字 |
| Gemini 3.1 Pro | 2M tokens | 150万字 |
| Llama 4 | 128K tokens | 10万字 |

**上下文窗口的影响**：
- **短窗口**：成本低，速度快，但无法处理长文档
- **长窗口**：能处理长文档，但成本高，速度慢
- **实际应用**：需要根据任务选择合适的窗口大小

### 3.4 Token 计数与成本估算

```typescript
// 使用 tiktoken 计算 token 数
import { encoding_for_model } from 'tiktoken';

const enc = encoding_for_model('gpt-4');
const tokens = enc.encode("Hello, how are you?");
console.log(tokens.length); // 6

// 成本估算
const inputPrice = 0.01; // $0.01 per 1K tokens
const outputPrice = 0.03; // $0.03 per 1K tokens

const cost = (inputTokens * inputPrice + outputTokens * outputPrice) / 1000;
```

---

## 4. 主流大模型对比（2026年6月）

### 4.1 OpenAI GPT 系列

**GPT-5**：
- 发布：2025年底
- 上下文：400K tokens
- 特点：平衡型，速度/质量最佳平衡
- 价格：$1.25/$10 per 1M tokens（输入/输出）

**GPT-5 Pro**：
- 发布：2026年初
- 上下文：400K tokens
- 特点：深度思考模式，复杂推理更强
- 价格：$15/$60 per 1M tokens

**GPT-4.1**：
- 仍可用，性价比最高
- 价格：$1.25/$10 per 1M tokens
- 适合：高并发、成本敏感场景

### 4.2 Anthropic Claude 系列

**Claude Opus 4.6**：
- 发布：2026年2月
- 上下文：1M tokens
- 特点：写作质量最佳，代码能力强
- 价格：$15/$75 per 1M tokens

**Claude Sonnet 4.6**：
- 日常使用首选
- 价格：$3/$15 per 1M tokens
- 适合：大多数场景

**Claude Haiku 4.5**：
- 轻量级，速度快
- 价格：$0.25/$1.25 per 1M tokens
- 适合：自动化、Agent 调用

### 4.3 Google Gemini 系列

**Gemini 3.1 Pro**：
- 发布：2026年2月
- 上下文：2M tokens（最大）
- 特点：原生多模态，视频/图像/音频
- 价格：$2/$12 per 1M tokens

**Gemini 2.5 Flash**：
- 速度快，成本低
- 价格：$0.15/$0.60 per 1M tokens
- 适合：简单任务、高并发

### 4.4 开源模型

**Llama 4**（Meta）：
- 参数：8B, 70B, 405B
- 上下文：128K tokens
- 特点：生态最完善，社区最活跃
- 适合：本地部署、微调

**Qwen 3**（阿里）：
- 参数：0.5B-72B
- 上下文：128K tokens
- 特点：中文能力最强
- 适合：中文场景、本地部署

**DeepSeek R1**：
- 参数：671B（MoE）
- 上下文：128K tokens
- 特点：推理能力强，成本低
- 适合：推理任务、成本敏感场景

---

## 5. 模型选型与成本优化策略

### 5.1 模型选型决策树（2026年6月）

```
任务类型
├── 复杂推理任务
│   ├── 预算充足 → Claude Opus 4.6 / GPT-5 Pro
│   └── 预算有限 → DeepSeek R1 / GPT-5
├── 代码生成任务
│   ├── 复杂项目 → Claude Opus 4.6（SWE-bench 领先）
│   └── 日常编码 → Claude Sonnet 4.6
├── 多模态任务
│   ├── 视频/图像 → Gemini 3.1 Pro（原生多模态）
│   └── 音频处理 → GPT-4o（实时音频）
├── 长文档分析
│   ├── 超长文档 → Gemini 3.1 Pro（200万token）
│   └── 长文档 → Claude Opus 4.6（100万token）
├── 成本敏感场景
│   ├── 高并发 → GPT-4.1（$1.25/$10）
│   └── 本地部署 → Llama 4 / Qwen 3
└── 特定领域
    ├── 中文场景 → Qwen 3 / DeepSeek R1
    └── 多语言 → Gemini 3.1 Pro
```

### 5.2 成本优化策略

**1. 模型分层策略**：
```typescript
// 根据任务复杂度选择模型
function selectModel(task: Task): Model {
  if (task.complexity === 'high') {
    return 'claude-opus-4.6';
  } else if (task.complexity === 'medium') {
    return 'claude-sonnet-4.6';
  } else {
    return 'claude-haiku-4.5';
  }
}
```

**2. 缓存策略**：
```typescript
// 缓存常见查询结果
const cache = new Map<string, string>();

async function cachedQuery(query: string): Promise<string> {
  if (cache.has(query)) {
    return cache.get(query)!;
  }
  
  const result = await llm.query(query);
  cache.set(query, result);
  return result;
}
```

**3. 批处理策略**：
```typescript
// 批量处理多个请求
async function batchProcess(queries: string[]): Promise<string[]> {
  const batchedPrompt = queries.map((q, i) => `[${i}] ${q}`).join('\n');
  const result = await llm.query(batchedPrompt);
  return parseBatchResult(result);
}
```

**4. 流式输出策略**：
```typescript
// 使用流式输出减少等待时间
const stream = await llm.streamQuery(query);
for await (const chunk of stream) {
  process.stdout.write(chunk);
}
```

### 5.3 Token 使用监控

```typescript
// 监控 token 使用量
class TokenMonitor {
  private usage: Map<string, number> = new Map();
  
  track(model: string, inputTokens: number, outputTokens: number) {
    const cost = this.calculateCost(model, inputTokens, outputTokens);
    this.usage.set(model, (this.usage.get(model) || 0) + cost);
  }
  
  getUsage(): Map<string, number> {
    return this.usage;
  }
  
  private calculateCost(model: string, input: number, output: number): number {
    const prices = {
      'claude-opus-4.6': { input: 15, output: 75 },
      'claude-sonnet-4.6': { input: 3, output: 15 },
      'gpt-5': { input: 1.25, output: 10 },
      // ... 其他模型
    };
    
    const price = prices[model];
    return (input * price.input + output * price.output) / 1_000_000;
  }
}
```

---

## 实践练习

### 练习 1：Embedding 相似度计算

```typescript
// 计算两段文本的语义相似度
import { OpenAIEmbeddings } from '@langchain/openai';

const embeddings = new OpenAIEmbeddings();

const text1 = "TypeScript 是 JavaScript 的超集";
const text2 = "TypeScript 添加了静态类型系统";
const text3 = "今天天气真好";

const [vec1, vec2, vec3] = await Promise.all([
  embeddings.embedQuery(text1),
  embeddings.embedQuery(text2),
  embeddings.embedQuery(text3),
]);

console.log("相似度 1-2:", cosineSimilarity(vec1, vec2)); // 高
console.log("相似度 1-3:", cosineSimilarity(vec1, vec3)); // 低
```

### 练习 2：Token 计数与成本估算

```typescript
// 估算一次 API 调用的成本
import { encoding_for_model } from 'tiktoken';

const enc = encoding_for_model('gpt-4');

const prompt = "请解释什么是 Transformer 架构";
const tokens = enc.encode(prompt);

console.log(`Token 数量: ${tokens.length}`);
console.log(`预估成本: $${(tokens.length * 0.01 / 1000).toFixed(4)}`);
```

### 练习 3：模型选型实践

```typescript
// 根据任务选择合适的模型
interface Task {
  type: 'coding' | 'writing' | 'analysis' | 'multimodal';
  complexity: 'low' | 'medium' | 'high';
  budget: 'low' | 'medium' | 'high';
}

function selectModel(task: Task): string {
  const matrix = {
    coding: {
      low: 'claude-haiku-4.5',
      medium: 'claude-sonnet-4.6',
      high: 'claude-opus-4.6',
    },
    writing: {
      low: 'claude-haiku-4.5',
      medium: 'claude-sonnet-4.6',
      high: 'claude-opus-4.6',
    },
    analysis: {
      low: 'gpt-4.1',
      medium: 'gpt-5',
      high: 'gpt-5-pro',
    },
    multimodal: {
      low: 'gemini-2.5-flash',
      medium: 'gemini-3.1-pro',
      high: 'gemini-3.1-pro',
    },
  };
  
  return matrix[task.type][task.complexity];
}
```

---

## 技术对比

### Transformer vs RNN/LSTM vs CNN

| 特性 | Transformer | RNN/LSTM | CNN |
|------|-------------|----------|-----|
| **并行计算** | ✅ 支持 | ❌ 顺序计算 | ✅ 支持 |
| **长距离依赖** | ✅ 直接建模 | ⚠️ 梯度消失 | ⚠️ 需要多层 |
| **位置信息** | 需要位置编码 | 天然保留 | 局部窗口 |
| **计算复杂度** | O(n²) | O(n) | O(n) |
| **适用场景** | NLP、多模态 | 序列生成 | 图像处理 |
| **代表模型** | GPT、BERT、Claude | LSTM-Attention | ResNet、ViT |

**选择建议**：
- 需要处理长文本 → Transformer
- 需要实时生成（如语音合成）→ RNN/LSTM
- 需要处理图像 → CNN 或 Vision Transformer

### Embedding 模型对比

| 模型 | 维度 | 价格 | 多语言 | 适用场景 |
|------|------|------|--------|----------|
| text-embedding-3-large | 3072 | $0.13/1M | ✅ | 企业级应用 |
| text-embedding-3-small | 1536 | $0.02/1M | ✅ | 通用场景 |
| Cohere embed-v3 | 1024 | $0.10/1M | ✅✅ | 国际化应用 |
| BGE-M3 | 1024 | 免费 | ✅ | 本地部署 |
| GTE-Qwen2 | 768-1536 | 免费 | ✅ | 中文优化 |

---

## 面试问答

> **问：Transformer 为什么比 RNN 快？**
>
> 答：Transformer 支持**并行计算**，可以同时处理整个序列；而 RNN 是顺序计算，必须逐步处理。具体来说：
> 1. Transformer 的自注意力机制可以并行计算所有位置之间的关系
> 2. RNN 必须按顺序处理，当前时刻的计算依赖前一时刻的结果
> 3. GPU 对矩阵运算优化更好，Transformer 的矩阵运算更适合 GPU 并行

> **问：Embedding 维度如何选择？**
>
> 答：根据**数据量**和**精度要求**选择：
> - 高维度（3072）：表达能力强，适合企业级应用，但存储成本高
> - 中维度（1536）：性价比高，适合通用场景
> - 低维度（768）：存储成本低，适合本地部署和简单任务
>
> 实际经验：如果数据量 < 100 万，1536 维足够；如果 > 100 万且精度要求高，选择 3072 维。

> **问：Tokenization 对模型性能有什么影响？**
>
> 答：Tokenization 影响：
> 1. **词汇量大小**：词汇量太大增加模型参数，太小导致 OOV（未登录词）
> 2. **分词粒度**：太细丢失语义，太粗增加序列长度
> 3. **多语言支持**：不同语言的分词效果差异大
>
> 最佳实践：使用 BPE（Byte Pair Encoding）平衡词汇量和分词粒度。

> **问：如何优化 LLM 调用成本？**
>
> 答：主要策略：
> 1. **模型分层**：简单任务用小模型（Haiku），复杂任务用大模型（Opus）
> 2. **缓存策略**：缓存常见查询结果，避免重复调用
> 3. **批处理**：将多个请求合并为一次调用
> 4. **流式输出**：减少用户等待时间，提高体验
> 5. **Prompt 优化**：减少不必要的 Token 消耗

> **问：什么是上下文窗口？如何处理超长文本？**
>
> 答：上下文窗口是模型一次能处理的 Token 数量上限。处理超长文本的方法：
> 1. **文本分割**：将长文本分割成多个片段，分别处理
> 2. **检索增强（RAG）**：只检索最相关的片段作为上下文
> 3. **摘要压缩**：先生成摘要，再基于摘要回答问题
> 4. **使用长窗口模型**：如 Gemini 3.1 Pro（200 万 Token）

---

## 实践练习

### 练习 1：Embedding 相似度计算

**要求**：计算三段文本的语义相似度，验证语义相似的文本向量距离更近。

**提示**：
- 使用 `@langchain/openai` 的 `OpenAIEmbeddings`
- 使用余弦相似度计算向量距离
- 需要实现 `cosineSimilarity` 函数

**预期效果**：
- 相似文本（TypeScript 相关）的相似度 > 0.8
- 不相似文本（TypeScript vs 天气）的相似度 < 0.3

```typescript
// 计算两段文本的语义相似度
import { OpenAIEmbeddings } from '@langchain/openai';

const embeddings = new OpenAIEmbeddings();

// 实现余弦相似度函数
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (normA * normB);
}

const text1 = "TypeScript 是 JavaScript 的超集";
const text2 = "TypeScript 添加了静态类型系统";
const text3 = "今天天气真好";

const [vec1, vec2, vec3] = await Promise.all([
  embeddings.embedQuery(text1),
  embeddings.embedQuery(text2),
  embeddings.embedQuery(text3),
]);

console.log("相似度 1-2:", cosineSimilarity(vec1, vec2)); // 预期：0.8+
console.log("相似度 1-3:", cosineSimilarity(vec1, vec3)); // 预期：<0.3
```

---

### 练习 2：Token 计数与成本估算

**要求**：估算一次 API 调用的 Token 数量和成本。

**提示**：
- 使用 `tiktoken` 库计算 Token 数量
- 不同模型的价格不同，参考 OpenAI 官方定价
- 注意区分输入和输出的价格

**预期效果**：
- 能准确计算给定文本的 Token 数量
- 能根据 Token 数量估算成本

```typescript
// 估算一次 API 调用的成本
import { encoding_for_model } from 'tiktoken';

const enc = encoding_for_model('gpt-4');

const prompt = "请解释什么是 Transformer 架构";
const tokens = enc.encode(prompt);

console.log(`Token 数量: ${tokens.length}`);

// 假设输出 Token 数量是输入的 2 倍
const inputTokens = tokens.length;
const outputTokens = inputTokens * 2;

// GPT-4.1 价格：$1.25/1M 输入，$10/1M 输出
const inputCost = inputTokens * 1.25 / 1_000_000;
const outputCost = outputTokens * 10 / 1_000_000;
const totalCost = inputCost + outputCost;

console.log(`预估成本: $${totalCost.toFixed(6)}`);
```

---

### 练习 3：模型选型实践

**要求**：根据任务类型、复杂度和预算，选择合适的模型。

**提示**：
- 参考 5.1 的模型选型决策树
- 考虑成本和性能的平衡
- 可以扩展决策矩阵

**预期效果**：
- 能根据任务特征选择合适的模型
- 理解不同模型的适用场景

```typescript
// 根据任务选择合适的模型
interface Task {
  type: 'coding' | 'writing' | 'analysis' | 'multimodal';
  complexity: 'low' | 'medium' | 'high';
  budget: 'low' | 'medium' | 'high';
}

function selectModel(task: Task): string {
  const matrix = {
    coding: {
      low: 'claude-haiku-4.5',
      medium: 'claude-sonnet-4.6',
      high: 'claude-opus-4.6',
    },
    writing: {
      low: 'claude-haiku-4.5',
      medium: 'claude-sonnet-4.6',
      high: 'claude-opus-4.6',
    },
    analysis: {
      low: 'gpt-4.1',
      medium: 'gpt-5',
      high: 'gpt-5-pro',
    },
    multimodal: {
      low: 'gemini-2.5-flash',
      medium: 'gemini-3.1-pro',
      high: 'gemini-3.1-pro',
    },
  };
  
  return matrix[task.type][task.complexity];
}

// 测试用例
console.log(selectModel({ type: 'coding', complexity: 'high', budget: 'high' })); // claude-opus-4.6
console.log(selectModel({ type: 'analysis', complexity: 'low', budget: 'low' })); // gpt-4.1
console.log(selectModel({ type: 'multimodal', complexity: 'medium', budget: 'medium' })); // gemini-3.1-pro
```

---

## 总结

**核心要点**：
1. **Transformer** 是所有大模型的基础，自注意力机制是其核心创新
2. **Embedding** 将离散符号映射到连续向量空间，实现语义理解
3. **Tokenization** 将文本分割成模型能理解的最小单元
4. **上下文窗口** 决定了模型一次能处理的信息量
5. **模型选型** 需要根据任务类型、复杂度和预算综合考虑

**下一步**：
- 学习 Agent 架构设计范式（1.2）
- 动手实践 Embedding 计算
- 尝试不同模型的 API 调用

---

*参考资料*：
- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [Anthropic Claude Documentation](https://docs.anthropic.com/)
- [Google Gemini Documentation](https://ai.google.dev/docs)