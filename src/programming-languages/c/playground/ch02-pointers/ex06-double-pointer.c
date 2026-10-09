// 📖 对应文档：doc/02-pointers-and-arrays.md §2.6 二级指针与 C++ 引用
// 🎯 任务：想修改指针本身 → 传指针的地址；认清严蔚敏教材 &L 的真实身份
// ▶️ 运行：make run EX=ex06-double-pointer（在 playground 目录下）
//
// 规则：TODO 处需要你实现；🧪 实验需取消注释观察行为，看完恢复注释。

#include <stdio.h>
#include "../common/check.h"

// ─── 任务 1：把外面的指针置空 ──────────────────────────────
// TODO：通过 pp 把外面的指针改成 NULL
void make_null(int **pp) {
    // TODO：两层开箱：*pp 就是外面那个指针本身
}

// ─── 任务 2：让外面的指针改指向 ────────────────────────────
// TODO：让 *pp 改成指向 to
void retarget(int **pp, int *to) {
    // TODO
}

int main() {
    int x = 10, y = 20;
    int *p = &x;

    // ─── 任务 3（先做热身）：二级指针逐层解引用 ─────────────
    int **pp = &p;   // pp 指向"指针 p"这个变量
    CHECK(*pp == &x, "事实：*pp 解一层拿到 p，p 又指向 x");
    // TODO：只用 pp（不许直接写 p 或 x）把 x 改成 42
    // 你的代码：

    CHECK(x == 42, "任务 3：**pp = 42 —— *pp 拿到 p，**pp 拿到 x");

    // ─── 任务 1 检验 ────────────────────────────────────────
    make_null(&p);   // 传"指针的地址"
    CHECK(p == NULL, "任务 1：make_null 后外面的 p 变成 NULL");

    // ─── 任务 2 检验 ────────────────────────────────────────
    retarget(&p, &y);
    CHECK(p == &y && *p == 20, "任务 2：retarget 后 p 指向 y");

    // ─── 🧪 实验：严蔚敏教材的 &L 到底是什么 ────────────────
    // 取消注释重跑（编译不通过！）：.c 文件里没有"引用"这种东西。
    //   void bump(int &x) { x = x + 1; }   ← 形参 &x 是 C++ 引用语法
    // 教材/王道的 void InitList(SqList &L) 混用了 C++ 引用，阅卷两种都认：
    //   C++ 引用 f(int &x)  ⟺  纯 C f(int *x) + 调用处 f(&x)
    // 修改指针本身（如链表头指针）：
    //   C++ 引用 LNode *&L  ⟺  纯 C 二级指针 LNode **L
    //
    // void bump(int &x) { x = x + 1; }

    CHECK_END("ex06-double-pointer");
    return 0;
}
