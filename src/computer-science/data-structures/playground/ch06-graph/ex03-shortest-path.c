// 📖 对应文档：../doc/06-graph.md §6.5 最短路径（Dijkstra + Floyd）
// 🎯 任务：两大最短路算法 —— 贪心逐步确定 vs 动态规划放开中转点，验证文档例 4/例 5 结果
// ▶️ 运行：make run EX=ex03-shortest-path（在 playground 目录下）

#include <stdio.h>
#include <stdbool.h>
#include "../common/check.h"

#define N 5
#define INF 0x3f3f3f3f

// ── 给定：文档 §6.8 例 4 的有向图（5 顶点，有向！）──
static int D1[N][N] = {
    //      v0  v1  v2  v3  v4
    /*v0*/ {  0, 10,INF,  5,INF },
    /*v1*/ {INF,  0,  1,  2,INF },
    /*v2*/ {INF,INF,  0,INF,  4 },
    /*v3*/ {INF,  3,  9,  0,  2 },
    /*v4*/ {  7,INF,  6,INF,  0 },
};

// ─── 任务 1：Dijkstra（贪心，dist/path/final 三数组）────────
// 每趟：在 V-S 中选 dist 最小的 v 并入 S（final[v]=1），
//      再用 v 松弛：dist[v]+Edge[v][j] < dist[j] 且 !final[j] 时更新
// ⚠️ 408 结论：Dijkstra 不能处理负权边（贪心前提被破坏）
// TODO：结果 dist 数组写回 result[]（源点 v0 = 下标 0）
void Dijkstra(const int G[N][N], int result[]) {
    // TODO
}

// ─── 任务 2：Floyd（动态规划，k 循环必须最外层！）───────────
// A[i][j] = min(A[i][j], A[i][k] + A[k][j])，允许负权边但不允许负权回路
// 注：本例仅 3 个顶点，k 放内外层结果相同（无区分度）；k 必须最外层的
//     原因请对照文档 §6.8 例 5 的手推 —— "本轮刚更新的中间结果可继续参与计算"
// TODO：A 初始化为 G；三重循环 k 最外层、i、j 内层，按上式更新
void Floyd(const int G3[][3], int A[][3]) {
    // TODO
}

int main() {
    // 任务 1 检验：dist = [0, 8, 9, 5, 7]（文档例 4 推演表）
    int result[N] = {0};
    Dijkstra(D1, result);
    CHECK(result[0] == 0 && result[1] == 8 && result[2] == 9 &&
          result[3] == 5 && result[4] == 7,
          "任务 1：v0 到各点最短距离 [0,8,9,5,7]（v1 经 v3 中转 5+3=8 < 10）");

    // 任务 2 检验：文档例 5 的 3 顶点图 → D^(3) = [[0,4,6],[5,0,2],[3,7,0]]
    int G3[3][3] = { {0, 4, 11}, {6, 0, 2}, {3, INF, 0} };
    int A[3][3] = {0};
    Floyd(G3, A);
    CHECK(A[0][2] == 6 && A[1][0] == 5 && A[2][1] == 7,
          "任务 2a：v1→v3=6（经 v2）、v2→v1=5（经 v3）、v3→v2=7（经 v1）");
    bool floyd_ok = (A[0][0]==0 && A[0][1]==4 && A[1][1]==0 && A[1][2]==2 &&
                     A[2][0]==3 && A[2][2]==0);
    CHECK(floyd_ok, "任务 2b：其余分量与 D^(0) 一致（k 循环必须最外层）");

    CHECK_END("ex03-shortest-path");
    return 0;
}
