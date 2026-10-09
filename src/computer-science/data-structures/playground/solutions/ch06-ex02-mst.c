// ✅ 答案：ch06/ex02-mst（做完再看！）
// 关键点：Prim 选最小+更新 lowcost；Kruskal 并查集判环，选够 n-1 条 break
#include <stdio.h>
#include <stdbool.h>
#include "../common/check.h"

#define N 6
#define INF 0x3f3f3f3f

static int G[N][N] = {
    /*v0*/ {  0,  6,  1,INF,INF,INF },
    /*v1*/ {  6,  0,INF,  5,  3,INF },
    /*v2*/ {  1,INF,  0,INF,  4,INF },
    /*v3*/ {INF,  5,INF,  0,INF,  2 },
    /*v4*/ {INF,  3,  4,INF,  0,  6 },
    /*v5*/ {INF,INF,INF,  2,  6,  0 },
};

int Prim(int v0) {
    int lowcost[N];
    int total = 0;
    lowcost[v0] = -1;                          // -1 = 已并入 U
    for (int i = 0; i < N; i++)
        if (i != v0) lowcost[i] = G[v0][i];    // 初值 = v0 的出边
    for (int t = 1; t < N; t++) {              // 还要并入 n-1 个顶点
        int min = INF, v = -1;
        for (int j = 0; j < N; j++)            // ① 选 V-U 中 lowcost 最小者
            if (lowcost[j] != -1 && lowcost[j] < min) {
                min = lowcost[j];
                v = j;
            }
        total += lowcost[v];                   // 该边入 MST
        lowcost[v] = -1;                       // 并入 U
        for (int j = 0; j < N; j++)            // ② 用 v 更新其余顶点
            if (lowcost[j] != -1 && G[v][j] < lowcost[j])
                lowcost[j] = G[v][j];
    }
    return total;
}

static int pa[N];
static int Find(int x) { return pa[x] < 0 ? x : (pa[x] = Find(pa[x])); }

typedef struct { int u, v, w; } Edge;
static Edge edges[] = {
    {0, 2, 1}, {3, 5, 2}, {1, 4, 3}, {2, 4, 4}, {1, 3, 5}, {0, 1, 6}, {4, 5, 6},
};
static int edge_n = 7;

int Kruskal(void) {
    int total = 0, cnt = 0;
    for (int i = 0; i < N; i++) pa[i] = -1;    // 并查集初始化
    for (int i = 0; i < edge_n && cnt < N - 1; i++) {
        int ru = Find(edges[i].u), rv = Find(edges[i].v);
        if (ru != rv) {                        // 不同根 → 不成环 → 选入
            pa[ru] = rv;                       // 合并集合
            total += edges[i].w;
            cnt++;
        }
    }
    return total;
}

int main() {
    CHECK(Prim(0) == 15, "任务 1：Prim MST 权值和 = 15");
    CHECK(Kruskal() == 15, "任务 2：Kruskal MST 权值和 = 15");
    CHECK_END("ch06-ex02-mst");
    return 0;
}
