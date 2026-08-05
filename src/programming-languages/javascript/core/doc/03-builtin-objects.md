# 03 - 内置对象

> 对应大纲篇目 03 | 面试可答：内置对象的行为由"状态语义"决定——RegExp 携带 lastIndex 状态、Date 可变且月份从 0 起、JSON 走 toJSON/replacer/reviver 钩子链，能按规范解释机制并掌握 ES2026 标准库补强。

## 学习目标

- 能解释 g/y 标志下 lastIndex 状态机，说清 exec/test/match/matchAll 的行为差异
- 会用具名捕获组与 v 标志集合运算，能解释灾难性回溯成因与 ReDoS 防护
- 能说清 Date 的三个设计原罪（月份从 0、可变、解析实现定义）与 Temporal 替代路线
- 会用 toJSON/replacer/reviver 控制 JSON 序列化，掌握 ES2026 source text access 与 JSON.rawJSON
- 理解 TypedArray 的 ArrayBuffer 视图模型，会用 ES2026 base64/hex API

## 核心概念

### RegExp：g 标志下的 lastIndex 状态机

带 `g`（或 `y`）标志的正则是**有状态对象**：实例属性 `lastIndex` 记录下一次匹配的起点。`exec`/`test` 会读写它，这是绝大多数正则坑的根源。

规范行为（RegExpBuiltinExec）：

1. 开始匹配时，若带 `g`/`y`，读取 `lastIndex` 作为起点（超出字符串长度直接失败）
2. 匹配成功，把 `lastIndex` 写为匹配文本的末尾位置
3. 匹配失败，`lastIndex` 重置为 0

```js
const re = /a/g
const str = 'aaa'

console.log(re.exec(str)?.index, re.lastIndex) // 0 1
console.log(re.exec(str)?.index, re.lastIndex) // 1 2
console.log(re.exec(str)?.index, re.lastIndex) // 2 3
console.log(re.exec(str)) // null（位置 3 处失败）
console.log(re.lastIndex) // 0（失败后归零）
```

最典型的翻车场景是「锚定正则 + g 标志」：

```js
const re = /^\d+$/g
console.log(re.test('123')) // true，lastIndex = 3
console.log(re.test('123')) // false（从下标 3 开始找，^ 匹配不上）
console.log(re.test('123')) // true（上次失败后 lastIndex 归零）
```

与字符串侧 API 的关键差异：

```js
const re = /(\d+)/g
const str = 'a1b2'

// str.match：带 g 只返回完整匹配，不含捕获组，且内部重置 lastIndex
console.log(str.match(re)) // ['1', '2']

// str.matchAll：返回迭代器，每项含捕获组；要求 g 标志；
// 内部通过 species 克隆正则（拷贝 lastIndex），不污染原实例
for (const m of str.matchAll(re)) {
  console.log(m[1]) // '1' '2'
}
console.log(re.lastIndex) // 0（matchAll 没有改动原实例）
```

> 结论：g 标志正则跨调用复用，用 `matchAll`、克隆新实例或手动 `re.lastIndex = 0`；校验型正则干脆别开 g。

### RegExp：具名捕获组

具名捕获组（ES2018）让分组可寻址；ES2025 补充了两项：内联标志组 `(?i:...)` 与分支内重复组名。

```js
const dateRe = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/
const m = dateRe.exec('2026-08-04')
console.log(m.groups.year, m.groups.month, m.groups.day) // '2026' '08' '04'

// replace 回调中 groups 对象是最后一个参数
const swapped = '2026-08-04'.replace(
  /(?<y>\d{4})-(?<m>\d{2})-(?<d>\d{2})/,
  (...args) => {
    const groups = args.at(-1)
    return `${groups.d}/${groups.m}/${groups.y}`
  }
)
console.log(swapped) // '04/08/2026'
```

```js
// ES2025：内联标志组，作用域仅限组内
// 引擎差异：bun 1.1.38（JSC）解析 (?i:...) 即抛 SyntaxError，需支持该语法的较新引擎
console.log(/(?i:abc)/.test('ABC')) // true
console.log(/(?i:abc)/.test('abc')) // true

// ES2025：分支间重复组名（互斥分支中允许同名，每次只有一个命中）
const tokenRe = /(?<value>\d+)|(?<value>[a-z]+)/
console.log(tokenRe.exec('42').groups.value) // '42'
console.log(tokenRe.exec('foo').groups.value) // 'foo'
```

### RegExp：v 标志与 Unicode 属性转义

ES2018 的 u 标志引入 Unicode 模式与 `\p{...}` 属性转义；ES2024 的 v 标志是 u 的超集，新增**字符类内集合运算**（交 `&&`、差 `--`、对称差 `~~`）与 `\q{...}` 字符串属性。

```js
// u 标志：Unicode 属性转义
console.log(/^\p{Script=Han}+$/u.test('汉字')) // true
console.log(/^\p{Decimal_Number}+$/u.test('123')) // true

// v 标志（ES2024）：集合运算
// White_Space 减去 ASCII = ASCII 之外的 Unicode 空白（如 U+00A0）
const re = /[\p{White_Space}--\p{ASCII}]/v
console.log(re.test(' ')) // false（普通空格属于 ASCII）
console.log(re.test('\u00A0')) // true（NBSP 是空白但不是 ASCII）
```

注意：

- v 标志强制更严格的字符类语法：类内的 `-` `(` `[` 等必须转义，把 u 模式下被静默放过的歧义直接报错
- v 隐含 Unicode 模式，与 u 互斥（不能同时写 uv）
- 处理 emoji、多文字系统时优先 u/v 标志，避免按码元切割造成误匹配

### RegExp：回溯与 ReDoS

JS 正则引擎是回溯式 NFA：量词先贪婪展开，整体失败后逐字符回退重试。嵌套量词会把尝试路径数推到指数级——这就是**灾难性回溯**；配合不可信输入即构成 ReDoS（正则拒绝服务）攻击面。

```js
const evilRe = /^(a+)+$/
// 'aaa...a!' 永远匹配不上：引擎会把 a 序列的每一种切分方案都试一遍，路径数约 2^n
console.time('redos')
console.log(evilRe.test('a'.repeat(30) + '!')) // false
console.timeEnd('redos') // 耗时视引擎而定，随 n 指数增长（勿在生产输入上试验更长串）
```

防护要点：

- 避免 `(a+)+`、`(a*)*` 这类嵌套量词，等价改写为单层量词或加界（如 `a{1,100}`）
- 进正则前先限制输入长度；长文本匹配移出主线程
- 用户输入的字面量用 `RegExp.escape`（ES2025）转义后再拼 pattern，不要裸拼
- 交叉链接：ReDoS 攻击面与输入校验的实战防御，归安全系列的 Web 安全篇（本库 security 模块，后续补充）

### Date：可变的时间对象

三个设计原罪：**月份从 0 起**（沿袭 C `tm_mon`/Java `java.util.Date` 的历史）、**setX 原地修改**（返回值是新时间戳）、**字符串解析实现定义**（规范只标准化了 ISO 8601 子集，其余格式交由引擎）。

```js
// 原罪一：月份是 0-11
const d = new Date(2026, 7, 4) // 2026-08-04（本地时间）
console.log(d.getMonth()) // 7，不是 8

// 原罪二：setX 原地修改原对象
const d2 = new Date('2026-08-04T10:00:00Z')
const ts = d2.setUTCFullYear(2025) // 返回值是新时间戳
console.log(typeof ts, d2.getUTCFullYear()) // 'number' 2025（d2 已被改）
```

解析行为差异（规范：date-only 的 ISO 串按 UTC 解析；无时区后缀的 date-time 按本地时间；其余格式实现定义）：

```js
// 以下输出均以本地时区 UTC+8 为例
console.log(new Date('2026-08-04').getHours()) // 8（UTC 零点 = 本地早上 8 点）
console.log(new Date('2026-08-04 00:00').getHours()) // 0（非 ISO 格式，按本地时间解析）
console.log(new Date('2026-08-04T10:00:00').getHours()) // 10（ISO 无 Z，本地时间）
console.log(new Date('2026-08-04T10:00:00Z').getHours()) // 18（Z 后缀，UTC → 本地）
```

输出 API 的差异在于「说哪个时区的话」：

```js
const d = new Date('2026-08-04T02:00:00Z')
console.log(d.toISOString()) // '2026-08-04T02:00:00.000Z'（永远 UTC，带 Z）
console.log(d.getUTCHours()) // 2
console.log(d.getHours()) // 10（UTC+8 本地时间）
```

替代方案是 Temporal：2026-03 达 Stage 4、预期收录 ES2027，Chrome 144+ / Firefox 139+ 可用（提案进度与版本地图交叉链接 01 语言与规范演进，doc/01-language-and-spec-evolution.md）。核心改进：不可变、Plain/Instant/Zoned 显式分离、月份从 1 起。

```js
// Temporal 需要运行时支持（Chrome 144+ / Firefox 139+ 或对应版本 Bun）
if (typeof Temporal !== 'undefined') {
  const day = Temporal.PlainDate.from('2026-08-04')
  console.log(day.month) // 8（从 1 起）
  console.log(day.add({ days: 30 }).toString()) // '2026-09-03'
  console.log(day.toString()) // '2026-08-04'（原对象不变，不可变设计）
}
```

### JSON：序列化钩子链

`JSON.stringify` 的丢弃规则（规范 JSONSerialize）：`undefined`、函数、Symbol 值**在对象中被跳过、在数组中变 null**；`NaN`/`Infinity` 变 `null`；`BigInt` 直接抛 TypeError。

```js
const obj = {
  a: 1,
  b: undefined,
  c: () => {},
  d: Symbol('x'),
  arr: [undefined, () => {}, Symbol('y'), 1]
}
console.log(JSON.stringify(obj))
// '{"a":1,"arr":[null,null,null,1]}'
```

钩子执行顺序：**`toJSON` → `replacer` → 输出**。

```js
// toJSON：对象自带序列化逻辑（Date 内置）
const range = {
  from: 1,
  to: 10,
  toJSON () {
    return { from: this.from, to: this.to }
  }
}
console.log(JSON.stringify(range)) // '{"from":1,"to":10}'
console.log(JSON.stringify(new Date('2026-08-04T00:00:00Z')))
// '"2026-08-04T00:00:00.000Z"'（Date.prototype.toJSON 返回 ISO 字符串）
```

replacer 有两种形态：**数组 = 属性名白名单**（递归作用于嵌套对象），**函数 = 逐键改写**（根对象也会被调用、key 为 `''`，`this` 指向持有者对象）：

```js
const user = { id: 1, name: 'alice', password: 'secret', nested: { password: 'x' } }

// 数组形态：白名单之外的键直接丢弃
console.log(JSON.stringify(user, ['id', 'name']))
// '{"id":1,"name":"alice"}'

// 函数形态：返回 undefined 即丢弃该键
console.log(JSON.stringify(user, (key, value) => (key === 'password' ? undefined : value), 2))
// {
//   "id": 1,
//   "name": "alice",
//   "nested": {}
// }
```

`JSON.parse` 的 reviver 是逆向钩子：**自底向上**（先内层属性、最后是根对象 key 为 `''`），返回值替换原值：

```js
const json = '{"createdAt":"2026-08-04T00:00:00.000Z","count":3}'
const parsed = JSON.parse(json, (key, value) => {
  if (key === 'createdAt') return new Date(value)
  return value
})
console.log(parsed.createdAt instanceof Date) // true
console.log(parsed.count) // 3
```

### JSON：ES2026 source text access 与 JSON.rawJSON

ES2026（第 17 版，2026-06-30 批准）对 JSON 的两项补强：

**source text access**：`JSON.parse` 的 reviver 收到的每个 JSON 数值被包装为带 `source` 属性的 `Number` 对象，`source` 是**原始源文本**。它解决「解析即失真」的不可逆问题——典型场景是超过 `Number.MAX_SAFE_INTEGER` 的大整数。

```js
// 需要支持 ES2026 的运行时
JSON.parse('{"id":9007199254740993}', (key, value) => {
  if (key === 'id') {
    console.log(value) // 9007199254740992（数值已失真）
    console.log(value.source) // '9007199254740993'（源文本仍在）
  }
  return value
})
```

实用写法：无损还原为 BigInt——

```js
const revived = JSON.parse('{"id":9007199254740993,"count":3}', (key, value) => {
  if (typeof value?.source !== 'string') return value
  const num = Number(value.source)
  return Number.isSafeInteger(num) ? num : BigInt(value.source)
})
console.log(revived.id) // 9007199254740993n
console.log(revived.count) // 3
```

**JSON.rawJSON**：把已序列化好的 JSON 文本直接嵌入 `stringify` 输出，跳过二次序列化；创建时解析校验一次，非法即抛 SyntaxError。适合透传已序列化的大负载。

```js
const payload = JSON.rawJSON('[1,2,3]')
console.log(JSON.isRawJSON(payload)) // true
console.log(JSON.stringify({ data: payload })) // '{"data":[1,2,3]}'

try {
  JSON.rawJSON('{not valid json')
} catch (e) {
  console.log(e.constructor.name) // 'SyntaxError'（创建时即校验）
}
```

### Math：sumPrecise 与浮点累加误差

IEEE 754 双精度无法精确表示 0.1 这类十进制小数；逐次相加意味着每一步都舍入一次，误差随列表长度累积。`Math.sumPrecise`（ES2026）改为「按无限精度求和、**最后只舍入一次**」，消除中间舍入。

```js
console.log(0.1 + 0.2) // 0.30000000000000004（单次相加已是精确和的舍入结果）

const nums = [0.1, 0.2, 0.3]
console.log(nums.reduce((a, b) => a + b, 0)) // 0.6000000000000001（舍入了 3 次）
console.log(Math.sumPrecise(nums)) // 0.6（精确和一次舍入）

// 注意一：只有两个数时与 a + b 无差别（单次加法本身就是"精确和 + 一次舍入"）
console.log(Math.sumPrecise([0.1, 0.2])) // 0.30000000000000004
// 注意二：它对 IEEE 754 双精度求和，不是十进制数类型；货币类十进制语义请勿依赖它
console.log(Math.sumPrecise([])) // 0
```

### Error：cause、自定义错误类与 isError

`cause`（ES2022）：错误包装时保留错误链，替代手写 `err.stack += ...` 的土法。

```js
function loadConfig () {
  try {
    throw new Error('config.json not found')
  } catch (err) {
    throw new Error('failed to load config', { cause: err })
  }
}

try {
  loadConfig()
} catch (err) {
  console.log(err.message) // 'failed to load config'
  console.log(err.cause.message) // 'config.json not found'
}
```

自定义错误类：关键是**设置 name**（stack 首行正确）并保持原型链，让 `instanceof` 可用：

```js
class HttpError extends Error {
  constructor (status, message) {
    super(message)
    this.name = 'HttpError'
    this.status = status
  }
}

try {
  throw new HttpError(404, 'not found')
} catch (e) {
  console.log(e instanceof HttpError, e instanceof Error) // true true
  console.log(e.name, e.status) // 'HttpError' 404
}
```

`Error.isError`（ES2026）：基于内部槽的 brand check。跨 realm（iframe / vm / 不同 Worker，各有各的 Error 构造器）时 `instanceof Error` 会失效，而 `Error.isError` 只认内部槽：

```js
console.log(Error.isError(new Error('x'))) // true
console.log(Error.isError(new TypeError('x'))) // true（子类也算）
console.log(Error.isError({ message: 'fake' })) // false
console.log(Error.isError(Object.create(Error.prototype))) // false（原型对但无内部槽）
```

跨窗口/Worker 消息传递场景，判断错误一律用 `Error.isError` 而不是 `instanceof`。

### TypedArray 与 ArrayBuffer 视图模型

`ArrayBuffer` 是原始字节块（不能直接读写）；`TypedArray`/`DataView` 是它的**视图**，用「元素类型 + 偏移 + 长度」描述如何解读字节。多个视图共享同一 buffer，改一处其它视图可见。

```js
const buf = new ArrayBuffer(8)
const u16 = new Uint16Array(buf)
const u8 = new Uint8Array(buf)

u16[0] = 0x4142
// 小端机器（x86/ARM 主流平台）：低字节在低地址
console.log(u8[0].toString(16), u8[1].toString(16)) // '42' '41'

// 视图可按偏移切片，共享字节
const tail = new Uint8Array(buf, 6) // 最后 2 字节，对应 u16[3]
u16[3] = 0xffff
console.log(tail[0], tail[1]) // 255 255
```

ES2026 给 `Uint8Array` 带来原生 base64/hex（六个 API：实例方法 `toBase64`/`toHex`/`setFromBase64`/`setFromHex`，静态方法 `fromBase64`/`fromHex`），替代 Buffer/atob 的绕路写法：

```js
const bytes = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]) // 'Hello'

console.log(bytes.toHex()) // '48656c6c6f'
console.log(bytes.toBase64()) // 'SGVsbG8='
// 也支持 toBase64({ alphabet: 'base64url', omitPadding: true }) 的 URL 安全变体

console.log(new TextDecoder().decode(Uint8Array.fromHex('48656c6c6f'))) // 'Hello'
console.log(Uint8Array.fromBase64('SGVsbG8=').toHex()) // '48656c6c6f'

// setFromXxx：原地写入已有 buffer，返回值是 { read, written } 对象（read 为读取的源字符数，written 为写入字节数）
const target = new Uint8Array(5)
console.log(target.setFromBase64('SGVsbG8=')) // { read: 8, written: 5 }
console.log(new TextDecoder().decode(target)) // 'Hello'
```

## 常见踩坑点

### 坑 1：g 标志正则复用导致 true/false 交替

```js
const isDigits = /^\d+$/g // 本不该带 g
console.log(isDigits.test('123')) // true
console.log(isDigits.test('123')) // false
console.log(isDigits.test('123')) // true
```

实际结果解释：第一次成功后 `lastIndex` 变 3，第二次从下标 3 起找、`^` 匹配不上立即失败（并把 `lastIndex` 归 0），第三次又回到起点。修复：校验型正则去掉 `g`；必须复用时每次调用前 `re.lastIndex = 0` 或克隆新实例。

### 坑 2：match 带 g 时拿不到捕获组

```js
const re = /(\d+)-(\d+)/g
const m = '2026-08'.match(re)
console.log(m) // ['2026-08'] —— 只有完整匹配
console.log(m[1]) // undefined

const m2 = [...'2026-08'.matchAll(/(\d+)-(\d+)/g)][0]
console.log(m2[1], m2[2]) // '2026' '08'
```

实际结果解释：带 g 的 `match` 只收集完整匹配串；要捕获组用 `matchAll`（或 `re.exec` 循环）。`matchAll` 也因此强制要求 g 标志——用「显式遍历所有匹配」消除 `match` 的双重语义。

### 坑 3：Date setMonth 溢出（月份从 0 + 日期静默进位）

```js
const d = new Date(2026, 0, 31) // 2026-01-31（month 0 = 一月）
d.setMonth(1) // 本意是"设到二月"，但二月没有 31 日
console.log(d.toLocaleDateString('en-CA')) // '2026-03-03'（2 月 31 日溢出到 3 月 3 日，2026 非闰年）
```

实际结果解释：Date 的字段越界会**静默进位**而不是报错，叠加月份从 0 起，`setMonth(1)` 实际含义是「二月」。日期运算前先做归一化，或直接换 Temporal 的 `PlainDate`（越界直接抛 RangeError）。

### 坑 4：同一个日期串，两种时区出身

```js
// 以本地时区 UTC+8 为例
console.log(new Date('2026-08-04').toISOString()) // '2026-08-04T00:00:00.000Z'（date-only ISO → UTC）
console.log(new Date('2026-08-04 00:00').toISOString()) // '2026-08-03T16:00:00.000Z'（非 ISO → 本地时间）
```

实际结果解释：两个都是「8 月 4 日零点」，但一个是 UTC 零点、一个是本地零点，相差 8 小时；序列化入库选错就是「日期差一天」的 bug。约定：跨端传输一律带时区后缀的 ISO 格式（`...Z` 或 `+08:00`）。

### 坑 5：reviver 返回 undefined 会删键

```js
const obj = JSON.parse('{"a":1,"b":2}', (key, value) => {
  return key === 'a' ? undefined : value
})
console.log(obj) // { b: 2 } —— a 被删除，不是变成 undefined
console.log('a' in obj) // false
```

实际结果解释：规范规定 reviver 返回 `undefined` 时**删除该属性**（根对象返回 undefined 则整个解析结果为 undefined），不是「值变成 undefined」的语义。过滤字段是副作用，注意别误删。

## 面试高频问题

- `exec`/`test`/`match`/`matchAll` 有何区别？`lastIndex` 在哪些 API 中读写？
- 具名捕获组怎么取值？`replace` 回调里 groups 在第几个参数？
- v 标志比 u 标志多了什么？（集合运算、更严格的类语法）
- 什么样的正则会灾难性回溯？如何防护？
- Date 月份为什么从 0 起？`new Date(string)` 哪些是实现定义？
- `JSON.stringify` 会丢哪些值？钩子执行顺序是什么？
- 如何无损序列化超过 2^53 的大整数？（ES2026 source text access / 字符串传输）
- `Math.sumPrecise` 与 reduce 累加的区别是什么？
- 什么时候用 `Error.cause`？跨 realm 为什么不能用 `instanceof Error`？
- TypedArray 与 ArrayBuffer 是什么关系？多视图为什么互相可见？

## 面试回答模板

> **问：同一个 g 标志正则多次调用 test/exec 会发生什么？**
>
> g 标志正则是带状态的对象：实例上的 lastIndex 记录下一次匹配的起点。exec/test 开始匹配时读取 lastIndex，成功后写成匹配末尾位置，失败时归零。所以同一实例反复调用会出现「一次 true 一次 false」的交替，`^...$` 这类锚定正则最容易中招。字符串侧的 match/matchAll/replace 会在内部管理甚至克隆这个状态，不受污染。工程上：校验型正则不开 g；必须复用就每次调用前把 lastIndex 重置为 0。

> **问：Date 有哪些设计缺陷？新项目你会用什么？**
>
> 三个原罪：一，月份 0-11，是沿袭 C 的 tm_mon 的历史包袱；二，它是可变对象，setX 原地修改并返回时间戳，容易产生副作用 bug；三，new Date(string) 只标准化了 ISO 8601 子集——date-only 按 UTC、无 Z 的 date-time 按本地、其余格式实现定义，跨浏览器坑很大。替代方案是 Temporal：2026 年 3 月达 Stage 4、预期收录 ES2027，Chrome 144+ 和 Firefox 139+ 已可用，设计不可变、Plain/Instant/Zoned 显式分离、月份从 1 起。不可用时用官方 polyfill，或约定全程 UTC + ISO 传输。

> **问：JSON.stringify 会丢哪些值？怎么定制序列化？**
>
> 丢弃规则：undefined、函数、Symbol 在对象属性中被跳过、在数组中变 null；NaN 和 Infinity 变 null；BigInt 直接抛 TypeError。钩子链顺序是 toJSON → replacer → 输出：toJSON 让对象自带序列化逻辑（Date 内置，返回 ISO 字符串）；replacer 有数组和函数两种形态，数组是属性名白名单、函数逐键改写并可返回 undefined 丢键，根对象也会以空字符串 key 被调用；parse 侧的 reviver 自底向上遍历，返回 undefined 会删除该键。工程里常用函数 replacer 过滤敏感字段、用 reviver 把日期字符串还原成 Date。

> **问：JSON 里的大整数精度丢失怎么解决？**
>
> JSON 数字受 IEEE 754 双精度限制，超过 2^53 的整数在解析阶段就会失真且不可逆。ES2026 的 source text access 解决了这一点：JSON.parse 的 reviver 收到的每个数值是带 source 属性的 Number 对象，source 保存原始源文本，可以据此无损还原成 BigInt。配套的 JSON.rawJSON 则把已序列化的文本直接嵌入 stringify 输出、创建时校验一次，适合大负载透传。老环境的兜底是约定后端把大整数以字符串传输。

> **问：什么样的正则会引发灾难性回溯？怎么防？**
>
> JS 正则引擎是回溯式 NFA：量词先贪婪展开，失败后逐字符回退重试。(a+)+ 这类嵌套量词遇到永远匹配不上的输入（如 a 串结尾跟一个 !）时，会把字符序列的每一种切分方案都试一遍，路径数约 2^n，秒级到分钟级卡死，这就是 ReDoS 的原理。防护：避免嵌套量词、改写为单层量词或加界；先限制输入长度；用户输入的字面量走 RegExp.escape（ES2025）而不是裸拼进 pattern；长文本匹配移出主线程。

> **问：TypedArray 是什么？和 ArrayBuffer 什么关系？**
>
> ArrayBuffer 是原始字节块，本身不能读写；TypedArray 与 DataView 是它的视图，用元素类型、偏移和长度描述如何解读这段字节。多个视图共享同一 buffer，写一个视图其它视图立刻可见；多字节元素受字节序影响，主流平台是小端。ES2026 给 Uint8Array 加了原生 base64/hex 支持：实例方法 toBase64/toHex/setFromBase64/setFromHex，静态方法 fromBase64/fromHex，替代过去 Buffer、atob 的绕路写法。

## 练习

### 练习 1：日志行解析器（具名捕获组）

**要求**：实现 `parseLogLine(line)`，用**具名捕获组**把 `'2026-08-04T10:30:00Z [error] db timeout'` 解析为 `{ time, level, message }`；格式不匹配返回 `null`。

**提示**：具名组语法 `(?<name>...)`；`time` 用 `\S+`、`level` 用 `\w+`、`message` 是剩余全部用贪婪的 `.+`；从 `exec` 结果的 `m.groups` 取值。

**预期效果**：bun test 通过——

```ts
import { expect, test } from 'bun:test'

const parseLogLine = (line: string) => {
  const re = /^(?<time>\S+) \[(?<level>\w+)\] (?<message>.+)$/
  const m = re.exec(line)
  if (!m || !m.groups) return null
  return {
    time: m.groups.time,
    level: m.groups.level,
    message: m.groups.message
  }
}

test('解析合法日志行', () => {
  expect(parseLogLine('2026-08-04T10:30:00Z [error] db timeout')).toEqual({
    time: '2026-08-04T10:30:00Z',
    level: 'error',
    message: 'db timeout'
  })
})

test('非法格式返回 null', () => {
  expect(parseLogLine('garbage line')).toBeNull()
})
```

### 练习 2：精确金额求和（Math.sumPrecise）

**要求**：实现 `sumAmounts(amounts)`，对浮点金额列表求和且不产生累积误差（使用 `Math.sumPrecise`）。

**提示**：`reduce` 每步舍入一次、误差累积；`Math.sumPrecise` 按精确和只舍入一次。需要支持 ES2026 的运行时；TS 类型定义缺失时用 `(Math as any).sumPrecise` 断言。

**预期效果**：bun test 通过——

```ts
import { expect, test } from 'bun:test'

const sumAmounts = (amounts: number[]): number => {
  return (Math as any).sumPrecise(amounts)
}

test('reduce 存在累积误差', () => {
  const amounts = [0.1, 0.2, 0.3]
  expect(amounts.reduce((a, b) => a + b, 0)).toBe(0.6000000000000001)
})

test('sumAmounts 精确求和', () => {
  expect(sumAmounts([0.1, 0.2, 0.3])).toBe(0.6)
  expect(sumAmounts([])).toBe(0)
})
```

### 练习 3：JSON 往返（敏感字段过滤 + Date 还原）

**要求**：实现 `dump(user)`（序列化时丢弃 `password` 键）与 `restore(json)`（把 `createdAt` 字符串还原为 `Date` 对象）。

**提示**：`dump` 用函数形态 replacer、对 `password` 返回 `undefined`；`restore` 用 reviver 按 key 判断；`Date` 内置 `toJSON`，序列化时自动输出 ISO 字符串，无需额外处理。

**预期效果**：bun test 通过——

```ts
import { expect, test } from 'bun:test'

const dump = (user: Record<string, unknown>): string => {
  return JSON.stringify(user, (key, value) => (key === 'password' ? undefined : value))
}

const restore = (json: string): Record<string, unknown> => {
  return JSON.parse(json, (key, value) => {
    if (key === 'createdAt' && typeof value === 'string') return new Date(value)
    return value
  })
}

test('序列化时丢弃敏感字段', () => {
  const json = dump({ name: 'alice', password: 'secret' })
  expect(json).not.toContain('secret')
  expect(json).toContain('alice')
})

test('解析后还原 Date', () => {
  const user = { name: 'alice', createdAt: new Date('2026-08-04T00:00:00Z') }
  const back = restore(dump(user))
  expect(back.createdAt).toBeInstanceOf(Date)
  expect((back.createdAt as Date).toISOString()).toBe('2026-08-04T00:00:00.000Z')
})
```

## 本模块完成标准

- [ ] 能解释 lastIndex 状态机，写出 g 标志正则复用 test 的交替输出与两种修复
- [ ] 会用具名捕获组与 v 标志集合运算，能说清灾难性回溯的成因与防护手段
- [ ] 能说清 Date 三个原罪与 Temporal 替代路线（Stage 4 / 预期 ES2027）
- [ ] 会用 replacer/reviver/toJSON 控制 JSON 序列化，并能演示 ES2026 source text access 与 rawJSON
- [ ] 能解释 TypedArray-ArrayBuffer 视图模型，会用 ES2026 的 toBase64/fromHex 等 API
