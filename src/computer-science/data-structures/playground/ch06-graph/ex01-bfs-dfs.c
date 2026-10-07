// 📖 对应文档：../doc/06-graph.md §6.3 图的遍历（本章核心）
// 🎯 任务：邻接表上的 BFS 与 DFS（含非连通图外层循环），验证文档例 1 的两个序列
// ▶️ 运行：make run EX=ex01-bfs-dfs（在 playground 目录下）
//
// 测试图（文档 §6.3.3，6 个顶点 v1~v6，代码用下标 0~5 对应）：
//   邻接表（头插法建表后的最终形态）：v1: v3→v2 | v2: v5→v4→v1 | v3: v5→v1
//                                      v4: v6→v2 | v5: v6→v3→v2 | v6: v5→v4
//   从 v1 出发：DFS = v1 v3 v5 v6 v4 v2 ；BFS = v1 v3 v2 v5 v4 v6

#include <stdio.h>
#include <stdbool.h>
#include <stdlib.h>
#include "../common/check.h"

#define MaxVertexNum 6

typedef struct ArcNode {
    int adjvex;                // 邻接顶点下标
    struct ArcNode *next;
} ArcNode;

typedef struct VNode {
    ArcNode *first;            // 边表头指针
} VNode;

typedef struct {
    VNode vertices[MaxVertexNum];
    int vexnum;
} ALGraph;

// ── 给定工具：无向图头插法加边（两端各插一次）──
static void AddEdge(ALGraph *G, int u, int v) {
    ArcNode *pu = malloc(sizeof(ArcNode));
    pu->adjvex = v; pu->next = G->vertices[u].first; G->vertices[u].first = pu;
    ArcNode *pv = malloc(sizeof(ArcNode));
    pv->adjvex = u; pv->next = G->vertices[v].first; G->vertices[v].first = pv;
}

// ── 给定工具：结果缓冲 / 队列 / visited ──
static int out[MaxVertexNum], out_n = 0;
static bool visited[MaxVertexNum];
static int q[MaxVertexNum * 2], q_head = 0, q_tail = 0;

static void visit(int v) { out[out_n++] = v; }
static void ResetAll(ALGraph *G) {
    out_n = 0;
    q_head = q_tail = 0;
    for (int i = 0; i < G->vexnum; i++) visited[i] = false;
}

// ─── 任务 1：DFS（递归）───────────────────────────────────
// TODO：visit(v) + visited[v] = true；按边表顺序对每个未访问邻接点递归
void DFS(ALGraph *G, int v) {
    (void)visit;   // 防未使用警告，实现后可删
    // TODO
}

// ─── 任务 2：BFS（队列，出队即访问，邻接点入队时标记）──────
// TODO：visit(v) + 标记 + 入队；while 队非空：出队 u，扫 u 的边表，
//      未访问的邻接点 visit + 标记 + 入队
void BFS(ALGraph *G, int v) {
    (void)visit; (void)q;   // 防未使用警告，实现后可删
    // TODO
}

// ─── 任务 3：全图遍历（非连通图的外层循环，408 算法题扣分点！）──
// TODO：先全部 visited 置 false；再 for 每个顶点，未访问则调用 DFS（或 BFS）
void DFSTraverse(ALGraph *G) {
    // TODO
}

int main() {
    ALGraph G = {0};
    G.vexnum = MaxVertexNum;
    // 按此顺序加边 → 恰好得到文档给出的边表形态（头插法逆序）
    AddEdge(&G, 0, 1); AddEdge(&G, 0, 2); AddEdge(&G, 1, 3); AddEdge(&G, 1, 4);
    AddEdge(&G, 2, 4); AddEdge(&G, 3, 5); AddEdge(&G, 4, 5);

    // 任务 1 检验：DFS 从 v1（下标 0）
    ResetAll(&G);
    DFS(&G, 0);
    int dfs_expect[] = {0, 2, 4, 5, 3, 1};
    CHECK(out_n == 6, "任务 1a：DFS 访问 6 个顶点");
    bool dfs_ok = true;
    for (int i = 0; i < 6; i++) if (out[i] != dfs_expect[i]) dfs_ok = false;
    CHECK(dfs_ok, "任务 1b：DFS = v1 v3 v5 v6 v4 v2（按边表首个未访问邻接点深入）");

    // 任务 2 检验：BFS 从 v1
    ResetAll(&G);
    BFS(&G, 0);
    int bfs_expect[] = {0, 2, 1, 4, 3, 5};
    bool bfs_ok = true;
    for (int i = 0; i < 6; i++) if (out[i] != bfs_expect[i]) bfs_ok = false;
    CHECK(bfs_ok, "任务 2：BFS = v1 v3 v2 v5 v4 v6（逐层扩展）");

    // 任务 3 检验：删掉边 (3,5) 与 (2,4) 前后……直接验证全图遍历覆盖所有顶点
    ResetAll(&G);
    DFSTraverse(&G);
    CHECK(out_n == 6, "任务 3：全图遍历（外层循环）覆盖全部 6 个顶点");

    CHECK_END("ex01-bfs-dfs");
    return 0;
}
