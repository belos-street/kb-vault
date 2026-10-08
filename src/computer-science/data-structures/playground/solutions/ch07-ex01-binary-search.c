// ✅ 答案：ch07/ex01-binary-search（做完再看！）
// 关键点：low <= high；mid=(low+high)/2；比较次数 = 结点所在层数
#include <stdio.h>
#include <stdbool.h>
#include "../common/check.h"

typedef struct {
    int elem[64];
    int TableLen;
} SSTable;

static int cmp_count = 0;

int Binary_Search(SSTable ST, int key) {
    int low = 1, high = ST.TableLen;
    while (low <= high) {                    // 区间剩 1 个元素也要比（不是 <）
        int mid = (low + high) / 2;          // 向下取整 → 判定树唯一
        cmp_count++;
        if (ST.elem[mid] == key)
            return mid;
        else if (ST.elem[mid] > key)
            high = mid - 1;                  // 目标在左半区间
        else
            low = mid + 1;                   // 目标在右半区间
    }
    return -1;                               // 区间为空，失败
}

int main() {
    SSTable ST = {0};
    ST.TableLen = 10;
    for (int i = 1; i <= 10; i++) ST.elem[i] = i;
    cmp_count = 0;
    CHECK(Binary_Search(ST, 5) == 5, "任务 a：key=5 是判定树根");
    CHECK(cmp_count == 1, "任务 b：根结点 1 次比较");
    cmp_count = 0;
    CHECK(Binary_Search(ST, 4) == 4, "任务 c：key=4 位置 4");
    CHECK(cmp_count == 4, "任务 d：比较 4 次 = 层数");
    cmp_count = 0;
    CHECK(Binary_Search(ST, 10) == 10 && cmp_count == 4, "任务 e：key=10 比较 4 次");
    cmp_count = 0;
    CHECK(Binary_Search(ST, 99) == -1, "任务 f：失败返回 -1");
    CHECK(cmp_count == 4, "任务 g：失败比较次数 = 树高 4");
    CHECK_END("ch07-ex01-binary-search");
    return 0;
}
