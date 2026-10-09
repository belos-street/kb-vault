// ✅ 答案：ch06/ex04-topo-sort（做完再看！）
// 关键点：零入度按编号升序入队；后继入度减到 0 立即入队；输出数 < n 判环
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

static void AddArc(ALGraph *G, int u, int v) {
    ArcNode *p = malloc(sizeof(ArcNode));
    p->adjvex = v;
    p->next = G->vertices[u].first;
    G->vertices[u].first = p;
}

static int out[N], out_n = 0;

bool TopSort(ALGraph *G) {
    int indegree[N] = {0};
    int count = 0;
    int q[N], head = 0, tail = 0;
    // ① 统计入度
    for (int i = 0; i < G->vexnum; i++)
        for (ArcNode *p = G->vertices[i].first; p != NULL; p = p->next)
            indegree[p->adjvex]++;
    // ② 零入度按编号升序入队
    for (int i = 0; i < G->vexnum; i++)
        if (indegree[i] == 0)
            q[tail++] = i;
    // ③ 出队输出 → 后继入度减 1 → 新零入度立即入队
    while (head < tail) {
        int v = q[head++];
        out[out_n++] = v;
        count++;
        for (ArcNode *p = G->vertices[v].first; p != NULL; p = p->next) {
            int w = p->adjvex;
            if (--indegree[w] == 0)
                q[tail++] = w;
        }
    }
    return count == G->vexnum;     // 输出数 < n → 有环
}

int main() {
    ALGraph G = {0};
    G.vexnum = N;
    // 头插法：先插 (0,2) 再插 (0,1)，使 v1 的边表为 v2→v3（与文档推演一致）
    AddArc(&G, 0, 2); AddArc(&G, 0, 1); AddArc(&G, 1, 3);
    AddArc(&G, 2, 3); AddArc(&G, 3, 4); AddArc(&G, 3, 5); AddArc(&G, 4, 5);

    out_n = 0;
    CHECK(TopSort(&G), "任务 a：无环图返回 true");
    bool seq_ok = true;
    for (int i = 0; i < N; i++)
        if (out[i] != i) seq_ok = false;
    CHECK(seq_ok, "任务 b：拓扑序列 = v1 v2 v3 v4 v5 v6");

    AddArc(&G, 5, 0);
    out_n = 0;
    CHECK(!TopSort(&G), "任务 c：加 <v6,v1> 成环 → false");
    CHECK_END("ch06-ex04-topo-sort");
    return 0;
}
