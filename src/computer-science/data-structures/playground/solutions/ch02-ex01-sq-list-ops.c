// ✅ 答案：ch02/ex01-sq-list-ops（做完再看！）
// 关键点：插入从后往前移、删除从前往后移；length 必须更新；分母 n+1 与 n 的来源
#include <stdio.h>
#include <stdbool.h>
#include "../common/check.h"

#define MaxSize 5
typedef int ElemType;

typedef struct {
    ElemType data[MaxSize];
    int length;
} SqList;

static void InitList(SqList *L) { L->length = 0; }
static void Fill(SqList *L, const int a[], int n) {
    for (int i = 0; i < n; i++) L->data[i] = a[i];
    L->length = n;
}
static bool SeqEquals(const SqList *L, const int expect[], int n) {
    if (L->length != n) return false;
    for (int i = 0; i < n; i++)
        if (L->data[i] != expect[i]) return false;
    return true;
}

bool ListInsert(SqList *L, int i, ElemType e) {
    if (i < 1 || i > L->length + 1) return false;   // ① 位序合法：1 ~ length+1
    if (L->length == MaxSize) return false;         // ② 表满
    for (int j = L->length; j >= i; j--)            // ③ 从后往前移（否则覆盖丢数据）
        L->data[j] = L->data[j - 1];
    L->data[i - 1] = e;                             // ④ 写入
    L->length++;                                    // ⑤ 别忘 length++
    return true;
}

bool ListDelete(SqList *L, int i, ElemType *e) {
    if (i < 1 || i > L->length) return false;       // ① 位序合法：1 ~ length
    *e = L->data[i - 1];                            // ② 取出被删元素
    for (int j = i; j < L->length; j++)             // ③ 从前往后移
        L->data[j - 1] = L->data[j];
    L->length--;                                    // ④ 幽灵元素防线
    return true;
}

int main() {
    SqList L;
    int e = 0;
    InitList(&L);
    int a1[] = {1, 2, 3};
    Fill(&L, a1, 3);
    CHECK(ListInsert(&L, 1, 0), "任务 1a：在位序 1 插入成功");
    int e1[] = {0, 1, 2, 3};
    CHECK(SeqEquals(&L, e1, 4), "任务 1b：插入后为 {0,1,2,3}");
    CHECK(ListInsert(&L, L.length + 1, 9), "任务 1c：位序 length+1 合法");
    CHECK(ListDelete(&L, L.length, &e) && e == 9, "任务 2a：删除表尾元素 9");
    CHECK(!ListInsert(&L, 0, 7), "任务 1d：位序 0 越界");
    CHECK(!ListInsert(&L, L.length + 2, 7), "任务 1e：位序 length+2 越界");
    CHECK(!ListDelete(&L, 0, &e), "任务 2b：删除位序 0 越界");
    CHECK(!ListDelete(&L, L.length + 1, &e), "任务 2c：删除位序 length+1 越界");
    int full[] = {1, 2, 3, 4, 5};
    Fill(&L, full, MaxSize);
    CHECK(!ListInsert(&L, 1, 0), "任务 1f：表满插入 → false");
    Fill(&L, full, 5);
    CHECK(ListDelete(&L, 2, &e) && e == 2, "任务 2d：删除位序 2 的元素 2");
    int e2[] = {1, 3, 4, 5};
    CHECK(SeqEquals(&L, e2, 4), "任务 2e：删除后为 {1,3,4,5}");
    CHECK_END("ch02-ex01-sq-list-ops");
    return 0;
}
