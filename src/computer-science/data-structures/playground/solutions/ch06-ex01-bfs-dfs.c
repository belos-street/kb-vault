// ✅ 答案：ch06/ex01-bfs-dfs（做完再看！）
// 关键点：DFS 按边表首个未访问邻接点深入；BFS 入队即标记；非连通图外层循环
#include <stdio.h>
#include <stdbool.h>
#include <stdlib.h>
#include "../common/check.h"

#define MaxVertexNum 6

typedef struct ArcNode {
    int adjvex;
    struct ArcNode *next;
} ArcNode;

typedef struct VNode {
    ArcNode *first;
} VNode;

typedef struct {
    VNode vertices[MaxVertexNum];
    int vexnum;
} ALGraph;

static void AddEdge(ALGraph *G, int u, int v) {
    ArcNode *pu = malloc(sizeof(ArcNode));
    pu->adjvex = v; pu->next = G->vertices[u].first; G->vertices[u].first = pu;
    ArcNode *pv = malloc(sizeof(ArcNode));
    pv->adjvex = u; pv->next = G->vertices[v].first; G->vertices[v].first = pv;
}

static int out[MaxVertexNum], out_n = 0;
static bool visited[MaxVertexNum];
static int q[MaxVertexNum * 2], q_head = 0, q_tail = 0;

static void visit(int v) { out[out_n++] = v; }
static void ResetAll(ALGraph *G) {
    out_n = 0;
    q_head = q_tail = 0;
    for (int i = 0; i < G->vexnum; i++) visited[i] = false;
}

void DFS(ALGraph *G, int v) {
    visit(v);                    // 访问当前顶点
    visited[v] = true;
    for (ArcNode *p = G->vertices[v].first; p != NULL; p = p->next) {
        int w = p->adjvex;
        if (!visited[w])         // 按边表顺序取第一个未访问邻接点深入
            DFS(G, w);
    }
}

void BFS(ALGraph *G, int v) {
    visit(v);
    visited[v] = true;           // 入队时即标记（防止重复入队）
    q_head = q_tail = 0;
    q[q_tail++] = v;
    while (q_head < q_tail) {
        int u = q[q_head++];     // 出队（已在入队时访问过）
        for (ArcNode *p = G->vertices[u].first; p != NULL; p = p->next) {
            int w = p->adjvex;
            if (!visited[w]) {
                visit(w);
                visited[w] = true;
                q[q_tail++] = w;
            }
        }
    }
}

void DFSTraverse(ALGraph *G) {
    for (int i = 0; i < G->vexnum; i++) visited[i] = false;
    for (int i = 0; i < G->vexnum; i++)
        if (!visited[i])         // 非连通图：每个连通分量都要有起点
            DFS(G, i);
}

int main() {
    ALGraph G = {0};
    G.vexnum = MaxVertexNum;
    AddEdge(&G, 0, 1); AddEdge(&G, 0, 2); AddEdge(&G, 1, 3); AddEdge(&G, 1, 4);
    AddEdge(&G, 2, 4); AddEdge(&G, 3, 5); AddEdge(&G, 4, 5);

    ResetAll(&G);
    DFS(&G, 0);
    int dfs_expect[] = {0, 2, 4, 5, 3, 1};
    CHECK(out_n == 6, "任务 1a：DFS 访问 6 个顶点");
    bool dfs_ok = true;
    for (int i = 0; i < 6; i++) if (out[i] != dfs_expect[i]) dfs_ok = false;
    CHECK(dfs_ok, "任务 1b：DFS = v1 v3 v5 v6 v4 v2");

    ResetAll(&G);
    BFS(&G, 0);
    int bfs_expect[] = {0, 2, 1, 4, 3, 5};
    bool bfs_ok = true;
    for (int i = 0; i < 6; i++) if (out[i] != bfs_expect[i]) bfs_ok = false;
    CHECK(bfs_ok, "任务 2：BFS = v1 v3 v2 v5 v4 v6");

    ResetAll(&G);
    DFSTraverse(&G);
    CHECK(out_n == 6, "任务 3：全图遍历覆盖全部 6 个顶点");
    CHECK_END("ch06-ex01-bfs-dfs");
    return 0;
}
