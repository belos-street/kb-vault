// ✅ 答案：ch05/ex04-union-find（做完再看！）
// 关键点：Find 路径压缩一行写法；Union 小树并入大树（负值越小规模越大）
#include <stdio.h>
#include <stdbool.h>
#include "../common/check.h"

#define MAXN 10
static int parent[MAXN];

void Init(int n) {
    for (int i = 0; i < n; i++)
        parent[i] = -1;               // 各自成集合，根记规模 1
}

int Find(int x) {
    if (parent[x] < 0)
        return x;                     // 负数 → 是根
    return parent[x] = Find(parent[x]);   // 路径压缩：路径结点直挂根
}

void Union(int x, int y) {
    int rx = Find(x), ry = Find(y);
    if (rx == ry) return;             // 已同集合
    if (parent[rx] > parent[ry]) {    // rx 集合更小（如 -2 > -4）
        parent[ry] += parent[rx];     // 大根累计规模
        parent[rx] = ry;              // 小根指向大根
    } else {
        parent[rx] += parent[ry];
        parent[ry] = rx;
    }
}

int main() {
    Init(MAXN);
    Union(0, 1);
    Union(2, 3);
    Union(1, 3);
    Union(4, 5);
    CHECK(Find(0) == Find(3), "任务 a：0 与 3 同根");
    CHECK(parent[3] == 0 && parent[0] == -4,
          "任务 a2：路径压缩生效（3 直挂根）且按规模合并记录规模 4");
    CHECK(Find(0) != Find(4), "任务 b：两个集合不同");
    CHECK(Find(6) == 6 && Find(9) == 9, "任务 c：未合并元素自己是根");
    int root = Find(0);
    CHECK(root == 0 && parent[1] == 0 && parent[2] == 0, "任务 d：路径压缩后直挂根");
    CHECK(parent[root] == -4, "任务 e：根记录集合规模 4");
    int components = 0;
    for (int i = 0; i < MAXN; i++)
        if (Find(i) == i) components++;
    CHECK(components == 6, "任务 f：10 - 4 = 6 个分量");
    CHECK_END("ch05-ex04-union-find");
    return 0;
}
