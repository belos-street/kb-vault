// common/check.h —— 练习自检工具（给定代码，不用深究，专注做题即可）
// 用法：
//   CHECK(条件, "提示")   条件为真打印 ✅，为假打印 ❌ 并给出文件行号与表达式
//   CHECK_END("ex名")     文件结尾调用，全部通过打印 🎉 并退出码 0，否则退出码 1
#ifndef KB_CHECK_H
#define KB_CHECK_H

#include <stdio.h>
#include <stdlib.h>

static int check_passed = 0;
static int check_failed = 0;

#define CHECK(cond, msg)                                                          \
    do {                                                                          \
        if (cond) {                                                               \
            check_passed++;                                                       \
            printf("✅ %s\n", (msg));                                             \
        } else {                                                                  \
            check_failed++;                                                       \
            printf("❌ %s（%s:%d：%s）\n", (msg), __FILE__, __LINE__, #cond);     \
        }                                                                         \
    } while (0)

#define CHECK_END(name)                                                           \
    do {                                                                          \
        printf("\n");                                                             \
        if (check_failed == 0) {                                                  \
            printf("🎉 %s 全部通过！（共 %d 项）\n", (name), check_passed);        \
        } else {                                                                  \
            printf("💪 %d 项未通过（已过 %d 项），按 ❌ 提示修复后重跑\n",         \
                   check_failed, check_passed);                                   \
            exit(1);                                                              \
        }                                                                         \
    } while (0)

#endif // KB_CHECK_H
