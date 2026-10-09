// 📖 对应文档：../doc/06-graph.md §6.6 拓扑排序（AOV 网 + 判环）
// 🎯 任务：队列版拓扑排序（零入度按编号升序入队）+ 输出顶点数 < n 判有环
// ▶️ 运行：make run EX=ex04-topo-sort（在 playground 目录下）
//
// 测试 AOV 网（文档 §6.8 例 6，顶点 v1~v6 → 下标 0~5）：
//   v1→v2, v1→v3, v2→v4, v3→v4, v4→v5, v4→v6, v5→v6
//   拓扑序列（队列版约定）= v1 v2 v3 v4 v5 v6

#include <stdio.h>
#include <stdbool.h>
#include <stdlib.h>
#include "../common/check.h"

#define N 6

typedef struct ArcNode {
    int adjvex;
    struct ArcNode *next;
} ArcNode;

typedef struct {
    ArcNode *first;
} VNode;

typedef struct {
    VNode vertices[N];
    int vexnum;
} ALGraph;

// ── 给定工具：有向图头插法加弧（u→v）──
static void AddArc(ALGraph *G, int u, int v) {
    ArcNode *p = malloc(sizeof(ArcNode));
    p->adjvex = v;
    p->next = G->vertices[u].first;
    G->vertices[u].first = p;
}

// 给定：结果缓冲（拓扑序列写入这里）
static int out[N], out_n = 0;

// ─── 任务：拓扑排序（队列版）───────────────────────────────
// 算法：① 扫所有边统计入度；② 入度为 0 的顶点【按编号升序】入队；
//      ③ 出队 → 写入 out → 把它所有后继的入度减 1，减到 0 立即入队；
//      ④ 输出顶点数 < n 则有环，返回 false
// TODO：用简单数组队列（头尾指针自管）实现，成功返回 true
bool TopSort(ALGraph *G) {
    return false;   // TODO
}

int main() {
    ALGraph G = {0};
    G.vexnum = N;
    // 头插法：先插 (0,2) 再插 (0,1)，使 v1 的边表为 v2→v3（与文档推演一致）
    AddArc(&G, 0, 2); AddArc(&G, 0, 1); AddArc(&G, 1, 3);
    AddArc(&G, 2, 3); AddArc(&G, 3, 4); AddArc(&G, 3, 5); AddArc(&G, 4, 5);

    // 无环情形：输出全部 6 个顶点，序列 v1 v2 v3 v4 v5 v6
    out_n = 0;
    CHECK(TopSort(&G), "任务 a：无环图返回 true（输出数 == n）");
    bool seq_ok = true;
    for (int i = 0; i < N; i++)
        if (out[i] != i) seq_ok = false;
    CHECK(seq_ok, "任务 b：拓扑序列 = v1 v2 v3 v4 v5 v6（队列版零入度升序）");

    // 有环情形：加 <v6, v1> 后 v1 入度变 1，无任何零入度顶点
    AddArc(&G, 5, 0);
    out_n = 0;
    CHECK(!TopSort(&G), "任务 c：加入 <v6,v1> 成环 → 返回 false（输出数 < n）");

    CHECK_END("ex04-topo-sort");
    return 0;
}
