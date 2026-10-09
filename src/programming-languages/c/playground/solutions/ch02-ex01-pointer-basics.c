// ✅ 答案：ch02/ex01-pointer-basics（做完再看！）
// 关键点：& 取地址、* 解引用；指针可重定向；NULL + 判空保护
#include <stdio.h>
#include "../common/check.h"

int main() {
    int x = 10;
    int y = 99;

    int *p = &x;
    CHECK(p == &x, "任务 1a：p 存的是 x 的地址");
    CHECK(*p == 10, "任务 1b：*p 解引用拿到的就是 x 的值");
    printf("📐 &x = %p，p = %p\n", (void *)&x, (void *)p);

    *p = 20;   // 通过地址写入，x 本人被改
    CHECK(x == 20, "任务 2：*p = 20 修改的就是 x 本人");

    p = &y;    // 指针只是存地址的变量，可以改指向
    CHECK(p == &y && *p == 99, "任务 3：改指向后 *p 读的是 y");

    p = NULL;
    CHECK(p == NULL, "任务 4：p 已置空");
    if (p == NULL) {
        printf("📐 p 是空指针，跳过访问 —— 这个判断保护了程序\n");
    }

    // 🧪 实验答案：*p 在 p == NULL 时解引用空指针 → 段错误。
    // 所以 malloc 后判 NULL、链表遍历用 while (p != NULL) 都是保命习惯。

    CHECK_END("ch02-ex01-pointer-basics");
    return 0;
}
