import type { Chapter } from './types.ts'

// 大纲依据：框框老师《高等数学（上）》49 个分 P，剔除 3 个非正课分 P 后
// 归并为 6 章 39 讲。章节号、讲次与视频一一对应，知识点颗粒度到「节内小节」。
export const chapters: Chapter[] = [
  {
    id: 'ch1',
    label: '第一章',
    title: '函数与极限',
    goal: '建立函数语言与极限工具箱，这是整张数二试卷的地基。',
    lessons: [
      {
        id: 'ch1-1',
        number: '1.1',
        title: '映射与函数',
        tagline: '先把「函数是什么」讲透，再谈极限。',
        minutes: 118,
        points: [
          '函数的概念与三要素',
          '映射的概念与记号',
          '映射的分类：单射、满射、双射',
          '逆映射的存在条件',
          '复合映射与定义域限制',
          '几种常见的函数',
          '函数的四种特性：有界、单调、奇偶、周期',
          '反函数与反三角函数',
          '初等函数与基本初等函数'
        ],
        live: true
      },
      {
        id: 'ch1-2',
        number: '1.2',
        title: '数列极限',
        tagline: '从「无限接近」到 ε-N 语言，建立收敛的判据。',
        minutes: 113,
        points: [
          '数列极限的 ε-N 定义',
          '极限的几何意义与数轴表示',
          '收敛数列的唯一性、有界性、保号性',
          '子数列与原数列的收敛关系',
          '数列极限的四则运算',
          '常用数列极限与「先猜后证」'
        ],
        live: true
      },
      {
        id: 'ch1-3',
        number: '1.3',
        title: '函数极限',
        tagline: '把数列的离散趋近推广到函数的连续趋近。',
        minutes: 77,
        points: [
          'x→x₀ 时函数极限的定义',
          'x→∞ 时函数极限的定义',
          '左极限与右极限',
          '极限的局部有界性与局部保号性',
          '极限存在的充要条件',
          '函数极限与数列极限的联系'
        ],
        live: true
      },
      {
        id: 'ch1-4',
        number: '1.4',
        title: '无穷小与无穷大',
        tagline: '无穷小不是「很小的数」，而是趋于零的变量。',
        minutes: 24,
        points: [
          '无穷小的定义与 0 的特殊地位',
          '无穷大的定义',
          '无穷小与无穷大的倒数关系',
          '无穷小的运算性质',
          '有界量 × 无穷小 = 无穷小'
        ],
        live: true
      },
      {
        id: 'ch1-5',
        number: '1.5',
        title: '极限的运算法则',
        tagline: '先判断类型，再决定能不能拆。',
        minutes: 38,
        points: [
          '极限四则运算法则及使用前提',
          '复合函数极限与极限号穿透',
          '多项式与有理函数的极限',
          '0/0 型与 ∞/∞ 型的初步处理',
          '拆项、通分、有理化技巧'
        ],
        live: true
      },
      {
        id: 'ch1-6',
        number: '1.6',
        title: '极限存在准则与两个重要极限',
        tagline: '夹逼、单调有界，以及 e 的两种出场方式。',
        minutes: 48,
        points: [
          '夹逼准则',
          '单调有界准则',
          '第一个重要极限 sin x / x',
          '第二个重要极限 (1+1/x)^x',
          '1^∞ 型极限与 e 的推广',
          '递推数列极限的证明思路'
        ],
        live: true
      },
      {
        id: 'ch1-7',
        number: '1.7',
        title: '无穷小的比较',
        tagline: '等价替换是求极限的第一选择，但加减要慎用。',
        minutes: 29,
        points: [
          '高阶、低阶、同阶、等价无穷小',
          '等价无穷小替换定理',
          '乘除可换、加减慎换',
          '常用等价无穷小表',
          '无穷小的阶在极限计算中的应用'
        ],
        live: true
      },
      {
        id: 'ch1-8',
        number: '1.8',
        title: '函数的连续性与间断点',
        tagline: '连续是「极限等于函数值」，间断点只有四类。',
        minutes: 39,
        points: [
          '函数在一点连续的定义',
          '左连续与右连续',
          '间断点的四种类型',
          '分段函数在分界点的连续性',
          '连续函数的四则运算与复合',
          '初等函数在其定义区间内连续'
        ],
        live: true
      },
      {
        id: 'ch1-9',
        number: '1.9',
        title: '闭区间上连续函数的性质',
        tagline: '最值、零点、介值，证明题的三件套。',
        minutes: 18,
        points: [
          '最大值最小值定理',
          '有界性定理',
          '零点定理',
          '介值定理',
          '闭区间连续性质在证明题中的应用'
        ],
        live: true
      }
    ]
  },
  {
    id: 'ch2',
    label: '第二章',
    title: '导数与微分',
    goal: '从变化率出发建立导数，掌握一元函数求导的完整流水线。',
    lessons: [
      {
        id: 'ch2-1',
        number: '2.1',
        title: '导数概念',
        tagline: '瞬时速度与切线斜率的共同抽象。',
        minutes: 36,
        points: [
          '瞬时速度与切线斜率引例',
          '导数定义与导函数',
          '左导数与右导数',
          '可导必连续，连续不一定可导',
          '导数的几何意义与切线方程',
          '可导性与连续性关系的反例'
        ],
        live: false
      },
      {
        id: 'ch2-2',
        number: '2.2',
        title: '函数的求导法则',
        tagline: '四则、反函数、链式，一层层拆开。',
        minutes: 45,
        points: [
          '导数的四则运算法则',
          '反函数求导法则',
          '复合函数链式法则',
          '基本初等函数求导公式',
          '复合函数多层求导',
          '抽象函数求导'
        ],
        live: false
      },
      {
        id: 'ch2-3',
        number: '2.3',
        title: '高阶导数',
        tagline: '二阶导数的物理与几何含义。',
        minutes: 32,
        points: [
          '高阶导数定义与记号',
          '常见函数的 n 阶导数',
          '莱布尼茨公式',
          '高阶导数在极限与微分方程中的应用'
        ],
        live: false
      },
      {
        id: 'ch2-4',
        number: '2.4',
        title: '隐函数与参数方程求导',
        tagline: '不显式解出 y，也能求 y 的导数。',
        minutes: 31,
        points: [
          '隐函数求导法',
          '对数求导法',
          '参数方程确定函数的一阶导数',
          '参数方程的二阶导数',
          '幂指函数求导'
        ],
        live: false
      },
      {
        id: 'ch2-5',
        number: '2.5',
        title: '函数的微分',
        tagline: '用线性主部近似函数增量。',
        minutes: 42,
        points: [
          '微分的定义',
          '可微与可导的等价关系',
          '微分形式不变性',
          '近似计算与误差估计',
          '微分在几何与物理中的应用'
        ],
        live: false
      }
    ]
  },
  {
    id: 'ch3',
    label: '第三章',
    title: '微分中值定理与导数的应用',
    goal: '中值定理是证明题核心，导数是函数性态的总控开关。',
    lessons: [
      {
        id: 'ch3-1',
        number: '3.1',
        title: '微分中值定理',
        tagline: '费马、罗尔、拉格朗日、柯西，一条证明链。',
        minutes: 91,
        points: [
          '费马引理',
          '罗尔定理',
          '拉格朗日中值定理',
          '柯西中值定理',
          '辅助函数的构造方法',
          '中值定理证明题的三种套路'
        ],
        live: false
      },
      {
        id: 'ch3-2',
        number: '3.2',
        title: '洛必达法则',
        tagline: '未定式求极限的标准化武器，但有失效边界。',
        minutes: 35,
        points: [
          '0/0 型洛必达法则',
          '∞/∞ 型洛必达法则',
          '其他未定式的转化',
          '使用洛必达的三个前提',
          '洛必达失效的反例与替代方法'
        ],
        live: false
      },
      {
        id: 'ch3-3',
        number: '3.3',
        title: '泰勒公式',
        tagline: '用多项式局部逼近函数，极限与估值的统一工具。',
        minutes: 43,
        points: [
          '泰勒多项式与泰勒公式',
          '佩亚诺余项',
          '拉格朗日余项',
          '麦克劳林展开',
          '常用五个展开式',
          '泰勒公式求极限与证明不等式'
        ],
        live: false
      },
      {
        id: 'ch3-4',
        number: '3.4',
        title: '函数单调性与凹凸性',
        tagline: '一阶导管升降，二阶导管弯曲。',
        minutes: 44,
        points: [
          '一阶导数判定单调性',
          '二阶导数判定凹凸性',
          '拐点的判定',
          '单调区间与凹凸区间的求法',
          '利用单调性证明不等式'
        ],
        live: false
      },
      {
        id: 'ch3-5',
        number: '3.5',
        title: '函数的极值与最值',
        tagline: '极值是局部概念，最值是整体概念。',
        minutes: 47,
        points: [
          '极值的必要条件和第一充分条件',
          '第二充分条件',
          '最大值与最小值的求法',
          '实际问题的最值建模',
          '极值与最值的区别'
        ],
        live: false
      },
      {
        id: 'ch3-6',
        number: '3.6',
        title: '渐近线与函数作图',
        tagline: '把极限、单调、凹凸拼成一张完整的图。',
        minutes: 31,
        points: [
          '水平渐近线',
          '铅直渐近线',
          '斜渐近线',
          '函数作图的标准步骤',
          '渐近线与极限的关系'
        ],
        live: false
      },
      {
        id: 'ch3-7',
        number: '3.7',
        title: '曲率',
        tagline: '描述曲线弯曲程度的几何量。',
        minutes: 37,
        points: [
          '弧微分',
          '曲率与曲率公式',
          '曲率半径与曲率圆',
          '曲率在几何中的应用'
        ],
        live: false
      }
    ]
  },
  {
    id: 'ch4',
    label: '第四章',
    title: '不定积分',
    goal: '积分是微分的逆运算，核心是识别该用哪一套换元。',
    lessons: [
      {
        id: 'ch4-1',
        number: '4.1',
        title: '不定积分的概念与性质',
        tagline: '原函数族与基本积分表。',
        minutes: 44,
        points: [
          '原函数与不定积分的概念',
          '不定积分与导数的关系',
          '基本积分表',
          '不定积分的线性性质',
          '原函数存在性'
        ],
        live: false
      },
      {
        id: 'ch4-2',
        number: '4.2',
        title: '换元积分法',
        tagline: '凑微分与变量代换，两大方向。',
        minutes: 88,
        points: [
          '第一类换元法（凑微分）',
          '第二类换元法（变量代换）',
          '三角代换',
          '根式代换',
          '倒代换',
          '换元法的选择策略'
        ],
        live: false
      },
      {
        id: 'ch4-3',
        number: '4.3',
        title: '分部积分法',
        tagline: '反对幂指三，谁先谁后。',
        minutes: 40,
        points: [
          '分部积分公式',
          'u 与 dv 的选取原则',
          '循环分部积分',
          '递推型分部积分',
          '分部积分与换元的组合'
        ],
        live: false
      },
      {
        id: 'ch4-4',
        number: '4.4',
        title: '有理函数的积分',
        tagline: '部分分式分解，把复杂分式拆成基本项。',
        minutes: 43,
        points: [
          '有理函数的分解',
          '部分分式法',
          '真分式与假分式',
          '三角有理式的积分',
          '简单根式的有理化'
        ],
        live: false
      }
    ]
  },
  {
    id: 'ch5',
    label: '第五章',
    title: '定积分及其应用',
    goal: '数二大题主力：定积分计算 + 几何/物理应用。',
    lessons: [
      {
        id: 'ch5-1',
        number: '5.1',
        title: '定积分的概念与性质',
        tagline: '从曲边梯形面积到黎曼和。',
        minutes: 51,
        points: [
          '曲边梯形面积与定积分定义',
          '可积的充分条件',
          '定积分的几何意义',
          '定积分的线性性质',
          '区间可加性与保号性',
          '估值定理与积分中值定理'
        ],
        live: false
      },
      {
        id: 'ch5-2',
        number: '5.2',
        title: '微积分基本公式',
        tagline: '牛顿-莱布尼茨公式，把定积分变成原函数差值。',
        minutes: 36,
        points: [
          '变上限积分函数',
          '变上限积分求导',
          '牛顿-莱布尼茨公式',
          '变限积分与洛必达结合',
          '原函数存在与定积分计算'
        ],
        live: false
      },
      {
        id: 'ch5-3',
        number: '5.3',
        title: '定积分的换元积分法',
        tagline: '换元必换限，对称区间看奇偶。',
        minutes: 53,
        points: [
          '定积分换元法',
          '换元必换限',
          '对称区间的奇偶性',
          '周期函数的积分性质',
          '三角换元在定积分中的应用'
        ],
        live: false
      },
      {
        id: 'ch5-4',
        number: '5.4',
        title: '定积分的分部积分法',
        tagline: '分部公式在定积分中的边界项处理。',
        minutes: 26,
        points: [
          '定积分分部积分公式',
          '分部积分处理变限积分',
          '递推公式',
          '定积分与不定积分分部的关系'
        ],
        live: false
      },
      {
        id: 'ch5-5',
        number: '5.5',
        title: '广义积分',
        tagline: '无穷限与瑕积分，先判敛散再计算。',
        minutes: 50,
        points: [
          '无穷限广义积分',
          '无界函数的广义积分（瑕积分）',
          '广义积分的敛散性',
          '比较判别法',
          '广义积分的计算'
        ],
        live: false
      },
      {
        id: 'ch5-6',
        number: '5.6',
        title: '定积分的应用',
        tagline: '面积、体积、弧长、侧面积与物理应用。',
        minutes: 113,
        points: [
          '极坐标方程与参数方程',
          '直角坐标下的面积',
          '极坐标下的面积',
          '旋转体体积（绕 x 轴 / 绕 y 轴 / 柱壳法）',
          '平面曲线弧长',
          '旋转体侧面积',
          '物理应用：功、水压力、质心、平均值'
        ],
        live: false
      }
    ]
  },
  {
    id: 'ch6',
    label: '第六章',
    title: '常微分方程',
    goal: '识别方程类型 → 套对应解法 → 代初值定特解。',
    lessons: [
      {
        id: 'ch6-1',
        number: '6.1',
        title: '微分方程的概念',
        tagline: '阶、通解、特解、初值条件。',
        minutes: 7,
        points: [
          '微分方程的定义与阶',
          '通解与特解',
          '初始条件与初值问题',
          '微分方程的分类'
        ],
        live: false
      },
      {
        id: 'ch6-2',
        number: '6.2',
        title: '可分离变量的微分方程',
        tagline: '变量分开，两边积分。',
        minutes: 10,
        points: [
          '可分离变量方程',
          '分离变量与积分',
          '隐式通解',
          '初值问题的特解'
        ],
        live: false
      },
      {
        id: 'ch6-3',
        number: '6.3',
        title: '齐次方程',
        tagline: '令 u = y/x，把齐次方程化为可分离变量。',
        minutes: 8,
        points: [
          '齐次方程的形式',
          '变量代换 y/x',
          '可化为齐次的方程',
          '齐次方程的求解步骤'
        ],
        live: false
      },
      {
        id: 'ch6-4',
        number: '6.4',
        title: '一阶线性微分方程',
        tagline: '常数变易法与通解公式。',
        minutes: 15,
        points: [
          '一阶线性微分方程标准形式',
          '常数变易法',
          '通解公式',
          '伯努利方程（了解）'
        ],
        live: false
      },
      {
        id: 'ch6-5',
        number: '6.5',
        title: '可降阶的高阶微分方程',
        tagline: '缺谁就看谁，逐步降阶。',
        minutes: 30,
        points: [
          'y^(n)=f(x) 型',
          '缺 y 型降阶',
          '缺 x 型降阶',
          '降阶后的求解流程'
        ],
        live: false
      },
      {
        id: 'ch6-6',
        number: '6.6',
        title: '高阶线性微分方程',
        tagline: '先看解的结构，再谈怎么求。',
        minutes: 22,
        points: [
          '二阶线性微分方程解的结构',
          '齐次方程通解结构',
          '非齐次方程特解结构',
          '叠加原理'
        ],
        live: false
      },
      {
        id: 'ch6-7',
        number: '6.7',
        title: '常系数齐次线性微分方程',
        tagline: '特征方程的三种根，对应三种通解。',
        minutes: 24,
        points: [
          '特征方程',
          '两个相异实根',
          '二重实根',
          '共轭复根',
          '通解的三种形式'
        ],
        live: false
      },
      {
        id: 'ch6-8',
        number: '6.8',
        title: '常系数非齐次线性微分方程',
        tagline: '待定系数法，先看 λ 是不是特征根。',
        minutes: 41,
        points: [
          '待定系数法',
          'f(x)=P_m(x)e^{λx} 型',
          'λ 是否为特征根的三种设法',
          'f(x)=e^{λx}[P cos ωx + Q sin ωx] 型',
          '特解叠加原理'
        ],
        live: false
      }
    ]
  }
]

export const allLessons = chapters.flatMap((chapter) => chapter.lessons)

export const lessonById = new Map(allLessons.map((lesson) => [lesson.id, lesson]))

export const totalMinutes = allLessons.reduce(
  (sum, lesson) => sum + lesson.minutes,
  0
)

export const chapterById = new Map(
  chapters.map((chapter) => [chapter.id, chapter])
)
