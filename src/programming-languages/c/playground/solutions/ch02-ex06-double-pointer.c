// ✅ 答案：ch02/ex06-double-pointer（做完再看！）
// 关键点：修改指针本身 → 二级指针；**pp 逐层开箱；C++ 引用 ⟺ 纯 C 指针
#include <stdio.h>
#include "../common/check.h"

void make_null(int **pp) {
    *pp = NULL;   // *pp 是外面那个指针变量本身
}

void retarget(int **pp, int *to) {
    *pp = to;
}

int main() {
    int x = 10, y = 20;
    int *p = &x;

    int **pp = &p;
    **pp = 42;   // 第一层 *pp 拿到 p，第二层 **pp 拿到 x
    CHECK(x == 42, "任务 3：**pp = 42 修改了 x");

    make_null(&p);
    CHECK(p == NULL, "任务 1：make_null 后外面的 p 变成 NULL");

    retarget(&p, &y);
    CHECK(p == &y && *p == 20, "任务 2：retarget 后 p 指向 y");

    // 🧪 实验答案：void bump(int &x) 是 C++ 引用语法，.c 文件编译报错。
    // 教材/王道的 &L 是 C++ 引用；纯 C 等价写法：
    //   修改元素值：f(int &x) ⟺ f(int *x) + f(&x)
    //   修改指针：  f(LNode *&L) ⟺ f(LNode **L) + f(&L)

    CHECK_END("ch02-ex06-double-pointer");
    return 0;
}
