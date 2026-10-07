// ✅ 答案：ch06/ex03-shortest-path（做完再看！）
// 关键点：Dijkstra 选 dist 最小再松弛；Floyd 的 k 循环必须最外层
#include <stdio.h>
#include <stdbool.h>
#include "../common/check.h"

#define N 5
#define INF 0x3f3f3f3f

static int D1[N][N] = {
    /*v0*/ {  0, 10,INF,  5,INF },
    /*v1*/ {INF,  0,  1,  2,INF },
    /*v2*/ {INF,INF,  0,INF,  4 },
    /*v3*/ {INF,  3,  9,  0,  2 },
    /*v4*/ {  7,INF,  6,INF,  0 },
};

void Dijkstra(const int G[N][N], int result[]) {
    int dist[N], final_[N];
    for (int i = 0; i < N; i++) {
        dist[i] = G[0][i];           // 初值 = 源点直达边权
        final_[i] = 0;
    }
    dist[0] = 0;
    final_[0] = 1;                   // 源点并入 S
    for (int t = 1; t < N; t++) {
        int min = INF, v = -1;
        for (int j = 0; j < N; j++)          // 在 V-S 中选 dist 最小
            if (!final_[j] && dist[j] < min) {
                min = dist[j];
                v = j;
            }
        final_[v] = 1;                       // 并入 S（此后 dist[v] 不再变）
        for (int j = 0; j < N; j++)          // 用 v 松弛其余顶点
            if (!final_[j] && G[v][j] < INF && dist[v] + G[v][j] < dist[j])
                dist[j] = dist[v] + G[v][j];
    }
    for (int i = 0; i < N; i++) result[i] = dist[i];
}

void Floyd(const int G3[][3], int A[][3]) {
    for (int i = 0; i < 3; i++)              // A 初始化为邻接矩阵
        for (int j = 0; j < 3; j++)
            A[i][j] = G3[i][j];
    for (int k = 0; k < 3; k++)              // k 必须最外层！
        for (int i = 0; i < 3; i++)
            for (int j = 0; j < 3; j++)
                if (A[i][k] + A[k][j] < A[i][j])
                    A[i][j] = A[i][k] + A[k][j];
}

int main() {
    int result[N] = {0};
    Dijkstra(D1, result);
    CHECK(result[0] == 0 && result[1] == 8 && result[2] == 9 &&
          result[3] == 5 && result[4] == 7,
          "任务 1：dist = [0,8,9,5,7]");
    int G3[3][3] = { {0, 4, 11}, {6, 0, 2}, {3, INF, 0} };
    int A[3][3] = {0};
    Floyd(G3, A);
    CHECK(A[0][2] == 6 && A[1][0] == 5 && A[2][1] == 7,
          "任务 2a：v1→v3=6、v2→v1=5、v3→v2=7");
    bool floyd_ok = (A[0][0]==0 && A[0][1]==4 && A[1][1]==0 && A[1][2]==2 &&
                     A[2][0]==3 && A[2][2]==0);
    CHECK(floyd_ok, "任务 2b：其余分量与 D^(0) 一致");
    CHECK_END("ch06-ex03-shortest-path");
    return 0;
}
