# 第 3 章：结构体、动态内存与 408 算法题规范

> 本章直接对接数据结构模块：用 struct + typedef + malloc 定义 408 标准数据结构，并按三问格式完整手写一道算法题。学完本章即可翻开数据结构第 2 章。
>
> 📖 预计阅读：2 小时 &nbsp;|&nbsp; 🎯 考点可答：链表/二叉树结点定义怎么写、算法题三问格式与得分点 &nbsp;|&nbsp; ⬅️ 前置：[[02-pointers-and-arrays|第 2 章]]

[[outline|← 返回目录]]

---

## 3.1 struct：把数据和指针打包

```c
struct Node {
    int data;              // 数据域
    struct Node *next;     // 指针域（自引用：指向同类型的下一个结点）
};

// 声明变量与访问成员
struct Node n1;
n1.data = 1;               // 变量用 . 访问
n1.next = NULL;

// 指针访问成员用 ->
struct Node *p = &n1;
p->data = 2;               // p->data 等价于 (*p).data
```

**自引用**是链表/树的基础：结构体内可以包含指向自身类型的指针（必须写全 `struct Node *`，不能写 `Node *`，因为 typedef 的名字此时还没生效）。

## 3.2 typedef：408 标准定义逐行解读

typedef 给类型起别名，408 教材的标准写法：

```c
typedef int ElemType;              // ① 元素类型统一别名，换数据类型只改这一行

typedef struct LNode {             // ② 定义结点结构体
    ElemType data;                 //    数据域
    struct LNode *next;            //    指针域
} LNode, *LinkList;                // ③ 一次起两个别名：
                                   //    LNode     = struct LNode（结点类型）
                                   //    LinkList  = struct LNode*（结点指针类型）
```

于是后面两种写法完全等价，408 代码里会交替出现：

```c
LNode *p;        // p 是结点指针
LinkList L;      // L 也是结点指针（习惯上用作头指针）
```

## 3.3 malloc / free：动态内存

```c
// 在堆上分配一个结点的内存，返回 void* 指针
LNode *s = (LNode *)malloc(sizeof(LNode));
if (s == NULL) return;     // 分配失败保护（考试写上加分）
s->data = x;
s->next = NULL;

// 不再使用时释放，并把指针置空防止悬空访问
free(s);
s = NULL;
```

| 要点 | 说明 |
|------|------|
| 栈 vs 堆 | 局部变量在栈上自动回收；`malloc` 在堆上，**不 free 就泄漏** |
| `sizeof(LNode)` | 按类型算字节数，不要手写数字 |
| 强制转换 | C 里 `(LNode *)` 可省略，但教材/王道都写（兼容 C++），考试跟着写 |
| 判 NULL | malloc 可能失败；链表操作的边界判断也全靠 `!= NULL` |

## 3.4 408 标准结构定义速查

数据结构模块会反复用到这几个定义，先混个脸熟：

```c
// 顺序表（静态分配）
#define MaxSize 100
typedef struct {
    ElemType data[MaxSize];   // 存储空间
    int length;               // 当前长度
} SqList;

// 单链表结点（见 3.2 的 LNode / LinkList）

// 顺序栈
typedef struct {
    ElemType data[MaxSize];
    int top;                  // 栈顶指针（初始 -1）
} SqStack;

// 循环队列（牺牲一个单元判满）
typedef struct {
    ElemType data[MaxSize];
    int front, rear;          // 队头、队尾指针
} SqQueue;
// 队满：(rear + 1) % MaxSize == front
// 队空：rear == front

// 二叉链表结点
typedef struct BiTNode {
    ElemType data;
    struct BiTNode *lchild, *rchild;   // 左右孩子
} BiTNode, *BiTree;
```

## 3.5 408 算法题三问格式与得分点

真题题干固定为三问（以 2025 年第 41 题为例）：

> (1) 给出算法的基本设计思想。
> (2) 根据设计思想，采用 C 或 C++ 语言描述算法，关键之处给出注释。
> (3) 说明你所设计算法的时间复杂度和空间复杂度。

**阅卷得分点**：
1. 设计思想用 2-3 句话说清"用什么方法、分几步"，不要写代码细节
2. 代码**关键之处必须有注释**（循环目的、指针含义、边界处理）
3. 边界条件要处理：空表、单结点、头结点的存在与否
4. 复杂度必须与代码一致，说清最好/最坏更佳

**完整示例**（王道高频题：带头结点的单链表原地逆置）：

**(1) 设计思想**：采用头插法逆置。遍历原链表，将每个结点依次摘下，插入到头结点之后，遍历完成后链表即被逆置。只需修改指针，空间复杂度 $O(1)$。

**(2) 代码**：

```c
// 带头结点单链表的原地逆置
void ReverseList(LinkList L) {
    LNode *p = L->next;    // p 指向第一个数据结点（待处理结点）
    LNode *q;
    L->next = NULL;        // 头结点 next 置空，逆置后的表初始为空
    while (p != NULL) {    // 依次摘下每个结点，头插到 L 之后
        q = p->next;       // q 暂存 p 的后继，防止断链
        p->next = L->next; // 头插三步
        L->next = p;
        p = q;             // p 后移，继续处理原链表的下一个结点
    }
}
```

**(3) 复杂度**：单层循环遍历 $n$ 个结点，时间复杂度 $O(n)$；只用了 p、q 两个辅助指针，空间复杂度 $O(1)$。

## 3.6 链表建表模板：尾插法

算法题常需要先建链表再操作，尾插法是标准模板（注意尾指针 r 的作用）：

```c
// 尾插法建立带头结点的单链表（读入 9999 结束）
void List_TailInsert(LinkList &L) {        // 注意：& 是 C++ 引用，见第 2 章 2.6
    L = (LinkList)malloc(sizeof(LNode));   // 创建头结点
    L->next = NULL;
    LNode *s, *r = L;                      // r 始终指向尾结点
    ElemType x;
    scanf("%d", &x);
    while (x != 9999) {
        s = (LNode *)malloc(sizeof(LNode));
        s->data = x;
        r->next = s;                       // 新结点挂到尾部
        r = s;                             // r 更新为新尾
        scanf("%d", &x);
    }
    r->next = NULL;                        // 尾结点 next 置空
}
```

---

## 📝 练习

**1. 定义双链表结点**
- 要求：用 typedef 定义双链表结点 `DNode`（含 data、前驱 prior、后继 next）及指针别名 `DLinkList`
- 提示：对照 3.2 的 LNode 定义加一个指针域
- 预期效果：`typedef struct DNode{ ElemType data; struct DNode *prior, *next; } DNode, *DLinkList;`

**2. 手写尾插法**
- 要求：不看 3.6，默写 `List_TailInsert`
- 提示：三个关键角色 —— 头结点 L、新结点 s、尾指针 r
- 预期效果：与 3.6 逻辑一致，`r->next = NULL` 收尾没有遗漏

**3. 完整三问题**（2019 真题改编）
- 要求：在带头结点的单链表中删除所有值为 x 的结点，按三问格式作答
- 提示：用前驱指针 pre 遍历，`pre->next` 为待检查结点；命中则摘除并 free，否则 pre 后移
- 预期效果：设计思想 + 带注释代码 + $O(n)$ 时间、 $O(1)$ 空间

---

## 🎯 考点速查

- `typedef struct LNode{...} LNode, *LinkList;` 每部分的含义（LNode 是结点类型、LinkList 是指针类型）
- malloc 后判 NULL、free 后置 NULL
- 头插法逆置链表的三步：暂存后继 → 头插 → 后移
- 尾插法靠尾指针 r 保持 $O(1)$ 插入
- 三问格式：设计思想 → 带注释 C/C++ 代码 → 复杂度（与代码一致）
- 修改头指针：C++ 用引用 `LinkList &L`，纯 C 用二级指针 `LinkList *L`
