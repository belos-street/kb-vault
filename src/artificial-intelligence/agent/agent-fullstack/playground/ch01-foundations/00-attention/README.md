# 00 · 手写缩放点积注意力

对应文档：[1.1 AI/ML 核心概念科普](../../../doc/01-AI-Agent基础与认知升级/01-AI-ML核心概念科普.md)

## 场景

在进入任何框架之前，先把 Transformer 的核心一步写出来。不需要模型、不需要向量库，只有数组。

你要实现两个纯函数：

```ts
softmax(values: number[]): number[]
scaledDotProductAttention(
  query: number[],
  keys: number[][],
  values: number[][]
): number[]
```

## 验收标准

1. `softmax([0, 0])` 返回 `[0.5, 0.5]`。
2. `softmax([1000, 1000])` 不产生 `NaN`，结果仍是 `[0.5, 0.5]`。
3. `softmax` 输出之和为 1，且原来更大的分数概率更大。
4. `softmax` 收到空数组、`NaN`、`Infinity` 时抛 `RangeError`。
5. `query = [1, 0]`、`keys = [[1, 0], [0, 1]]`、`values = [[1, 0], [0, 1]]` 时，输出约 `[0.6698, 0.3302]`。
6. 缩放因子必须是 `sqrt(d)`：`query = [1, 1]`、`keys = [[1, 1], [0, 0]]`、`values = [[1, 0], [0, 1]]` 时，输出约 `[0.8044, 0.1956]`。用 `d` 而不是 `sqrt(d)` 会得到 `[0.881, 0.119]`，测试会挂。
7. 只有一个 key 时，输出等于该 key 对应的 value。
8. `query` 与 `key` 维度不一致、`keys` 为空、`keys` 与 `values` 数量不一致时，抛 `RangeError`。

## 约束

- 纯数组运算，不引入第三方库。
- 不许修改 `index.test.ts` 和 `shared/`。
- 必须数值稳定：先减去最大值再取指数。

## 提示

<details>
<summary>提示 1 · 方向</summary>

`softmax` 解决的是「把一组分数变成概率」；注意力解决的是「用 query 和每个 key 的相似度，去加权求和 values」。

</details>

<details>
<summary>提示 2 · 关键公式</summary>

```text
softmax(x_i) = exp(x_i - max(x)) / Σ exp(x_j - max(x))

score_i = dot(query, keys[i]) / sqrt(d)
weight  = softmax(scores)
output  = Σ weight_i * values[i]
```

`d` 是 `query` 的维度，不是 key 的数量。

</details>

<details>
<summary>提示 3 · 结构伪代码</summary>

```text
softmax(values):
  校验非空、全部是有限数
  m = max(values)
  取 exp(v - m) 得到数组 e
  返回 e / sum(e)

attention(query, keys, values):
  校验 key 数量 > 0、query 与 key 维度一致、keys 与 values 数量一致
  d = query.length
  scores = keys.map(k => dot(query, k) / sqrt(d))
  返回按 weight[i] 累加 value[i] 的向量
```

</details>

## 进阶（通过后做）

- 多头注意力：把 `d` 切成 `h` 份，各算一份再拼接。
- Mask：允许把某些位置分数设成 `-Infinity`，观察 softmax 结果。
- 批量：支持 `[batch][n][d]` 的三维输入。

## 运行

```bash
bun test ch01-foundations/00-attention
```
