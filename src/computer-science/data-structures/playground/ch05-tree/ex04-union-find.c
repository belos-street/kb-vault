// 📖 对应文档：../doc/05-tree-and-binary-tree.md §5.8 并查集（Kruskal 判环的前置工具）
// 🎯 任务：Init / Find（路径压缩）/ Union（按规模合并），并数出连通分量个数
// ▶️ 运行：make run EX=ex04-union-find（在 playground 目录下）
//
// 存储约定（双亲表示法）：parent[i] < 0 表示 i 是根，绝对值 = 集合规模。

#include <stdio.h>
#include <stdbool.h>
#include "../common/check.h"

#define MAXN 10

static int parent[MAXN];

// ─── 任务 1：初始化（每个元素自成一个集合）─────────────────
void Init(int n) {
    // TODO：parent[i] = -1
}

// ─── 任务 2：查找根（带路径压缩）───────────────────────────
// 路径压缩：找到根后，把路径上所有结点直接挂到根下（parent[x] = 根）
// TODO：parent[x] < 0 → 返回 x；否则 return parent[x] = Find(parent[x]);
int Find(int x) {
    return 0;   // TODO
}

// ─── 任务 3：合并（按规模：小树并入大树）───────────────────
// parent 为负，数值越小规模越大：parent[rx] > parent[ry] 说明 rx 所在集合更小
// TODO：rx == ry 直接返回（已同集合）；
//      rx 更小：parent[ry] += parent[rx]; parent[rx] = ry;
//      否则反过来：parent[rx] += parent[ry]; parent[ry] = rx
void Union(int x, int y) {
    // TODO
}

int main() {
    Init(MAXN);

    // 逐对合并：(0,1) (2,3) (1,3) → {0,1,2,3} 一族；(4,5) → {4,5}；6,7,8,9 自成一体
    Union(0, 1);
    Union(2, 3);
    Union(1, 3);   // 把 {0,1} 与 {2,3} 连成 4 元素集合
    Union(4, 5);

    CHECK(Find(0) == Find(3), "任务 a：0 与 3 同根（经 1→3 两次合并连通）");
    // 路径压缩区分断言：Find(3) 走过 3→2→0，压缩后 3 直挂根 0；
    // 若 Find 只找根不压缩，parent[3] 仍是 2 → 本断言必挂；
    // 占位态 parent 全 0 → parent[0]==-4 必挂（顺带消除任务 d 的占位白过）
    CHECK(parent[3] == 0 && parent[0] == -4,
          "任务 a2：路径压缩生效（3 直挂根）且按规模合并记录规模 4");
    CHECK(Find(0) != Find(4), "任务 b：{0,1,2,3} 与 {4,5} 不同集合");
    CHECK(Find(6) == 6 && Find(9) == 9, "任务 c：未合并的元素自己是根");

    // 路径压缩验证：{0,1,2,3} 的根是 0，路径上结点最终都直挂根
    int root = Find(0);
    CHECK(root == 0 && parent[1] == 0 && parent[2] == 0, "任务 d：路径压缩后 1、2 直挂根 0");

    // 按规模验证：4 元素集合的根，parent 绝对值应为 4
    CHECK(parent[root] == -4, "任务 e：按规模合并后根记录集合规模 4");

    // 连通分量计数：不同根的元素个数 = 分量数
    // 合并后集合：{0,1,2,3} {4,5} {6} {7} {8} {9} → 共 6 个分量
    int components = 0;
    for (int i = 0; i < MAXN; i++)
        if (Find(i) == i) components++;
    CHECK(components == 6, "任务 f：10 个元素 4 次有效合并 → 10 - 4 = 6 个分量");

    CHECK_END("ex04-union-find");
    return 0;
}
