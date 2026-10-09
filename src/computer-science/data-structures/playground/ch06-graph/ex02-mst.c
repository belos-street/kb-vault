// 📖 对应文档：../doc/06-graph.md §6.4 最小生成树（Prim + Kruskal）
// 🎯 任务：同一张图分别用 Prim（加点）与 Kruskal（加边+并查集）求 MST，权值和都 = 15
// ▶️ 运行：make run EX=ex02-mst（在 playground 目录下）
//
// 测试图（文档 §6.8 例 2，6 顶点带权无向图）：
//   v1-v2:6  v1-v3:1  v2-v4:5  v2-v5:3  v3-v5:4  v4-v6:2  v5-v6:6
//   MST 边集 {(v1,v3),(v3,v5),(v5,v2),(v2,v4),(v4,v6)}，总权值 15

#include <stdio.h>
#include <stdbool.h>
#include "../common/check.h"

#define N 6
#define INF 0x3f3f3f3f

// ── 给定：邻接矩阵（对称，变量名用 G 避免与下面的 Edge 类型重名）──
static int G[N][N] = {
    //      v0  v1  v2  v3  v4  v5
    /*v0*/ {  0,  6,  1,INF,INF,INF },
    /*v1*/ {  6,  0,INF,  5,  3,INF },
    /*v2*/ {  1,INF,  0,INF,  4,INF },
    /*v3*/ {INF,  5,INF,  0,INF,  2 },
    /*v4*/ {INF,  3,  4,INF,  0,  6 },
    /*v5*/ {INF,INF,INF,  2,  6,  0 },
};

// ─── 任务 1：Prim（加点法，lowcost 数组）───────────────────
// TODO：lowcost[v0] = -1（-1 = 已并入 U），其余 = G[v0][i]；
//      循环 n-1 趟：① 在 lowcost != -1 中选最小者 v，累加 lowcost[v] 并置 -1；
//      ② 用 G[v][j] 更新其余顶点的 lowcost（更小才更新）
// 返回 MST 总权值
int Prim(int v0) {
    return 0;   // TODO
}

// ─── 任务 2：Kruskal（加边法）─────────────────────────────
// 给定：并查集（简化版，路径压缩）+ 边表（已按权升序排好，勿改顺序）
static int pa[N];
static int Find(int x) { return pa[x] < 0 ? x : (pa[x] = Find(pa[x])); }

typedef struct { int u, v, w; } Edge;
static Edge edges[] = {
    {0, 2, 1},   // (v1,v3) 权 1
    {3, 5, 2},   // (v4,v6) 权 2
    {1, 4, 3},   // (v2,v5) 权 3
    {2, 4, 4},   // (v3,v5) 权 4
    {1, 3, 5},   // (v2,v4) 权 5
    {0, 1, 6},   // (v1,v2) 权 6
    {4, 5, 6},   // (v5,v6) 权 6
};
static int edge_n = 7;

// TODO：pa 全 -1；按序考察每条边：Find(u) != Find(v)（不成环）则
//      Union（pa[Find(u)] = Find(v) 即可）并累加权值；选够 n-1 条 break
int Kruskal(void) {
    (void)G; (void)edges; (void)edge_n; (void)Find;   // 防未使用警告，实现后可删
    return 0;   // TODO
}

int main() {
    CHECK(Prim(0) == 15, "任务 1：Prim 从 v1 出发 MST 权值和 = 15（1+4+3+5+2）");
    CHECK(Kruskal() == 15, "任务 2：Kruskal MST 权值和 = 15（两算法结果一致）");

    CHECK_END("ex02-mst");
    return 0;
}
