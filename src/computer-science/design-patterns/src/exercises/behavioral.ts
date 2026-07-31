import type { Exercise } from '../types';

export const behavioralExercises: Exercise[] = [
  {
    id: 'chain-of-responsibility',
    name: '责任链模式',
    nameEn: 'Chain of Responsibility',
    priority: 'P0',
    category: '行为型',
    docPath: '../doc/chain-of-responsibility.md',
    task: '实现 Express 风格的中间件链。创建 auth、rateLimit、handler 三个中间件，通过 next() 传递控制权。auth 中间件检查 token 是否存在，不存在则短路返回 401；rateLimit 检查请求次数是否超限；handler 返回最终响应。',
    hints: [
      '每个中间件是 (ctx, next) => void 形式的函数',
      'compose 函数将中间件数组组合成一个调用链，next() 调用下一个中间件',
      '不调用 next() 即可实现短路',
    ],
    starterCode: `type Context = { token?: string; requestCount: number; body?: string; status?: number };
type Next = () => void;
type Middleware = (ctx: Context, next: Next) => void;

function compose(middlewares: Middleware[]): (ctx: Context) => void {
  // TODO: 你的实现 - 将中间件数组组合为一个函数
}

const auth: Middleware = (ctx, next) => {
  // TODO: 你的实现 - 检查 ctx.token，无则设置 status=401 并短路
};

const rateLimit: Middleware = (ctx, next) => {
  // TODO: 你的实现 - requestCount > 100 则设置 status=429 并短路
};

const handler: Middleware = (ctx, next) => {
  ctx.status = 200;
  ctx.body = 'Hello World';
};

const app = compose([auth, rateLimit, handler]);

const ctx1: Context = { token: 'abc', requestCount: 1 };
app(ctx1);
console.log('正常请求:', ctx1.status, ctx1.body); // 200 Hello World

const ctx2: Context = { requestCount: 1 };
app(ctx2);
console.log('无 token:', ctx2.status); // 401

const ctx3: Context = { token: 'abc', requestCount: 101 };
app(ctx3);
console.log('超限:', ctx3.status); // 429`,
  },
  {
    id: 'command',
    name: '命令模式',
    nameEn: 'Command',
    priority: 'P1',
    category: '行为型',
    docPath: '../doc/command.md',
    task: '实现 TextEditor 的命令系统。创建 InsertCommand 和 DeleteCommand，每个命令支持 execute() 和 undo()。用 CommandHistory 管理已执行命令，支持 undo/redo 操作。',
    hints: [
      'Command 接口包含 execute() 和 undo() 两个方法',
      'InsertCommand 的 undo 就是删除刚插入的文本，DeleteCommand 的 undo 就是恢复删除的文本',
      'History 用两个栈分别存储已执行和已撤销的命令',
    ],
    starterCode: `interface Command {
  execute(): void;
  undo(): void;
}

class TextEditor {
  content = '';

  insert(position: number, text: string): void {
    this.content = this.content.slice(0, position) + text + this.content.slice(position);
  }

  delete(position: number, length: number): string {
    const removed = this.content.slice(position, position + length);
    this.content = this.content.slice(0, position) + this.content.slice(position + length);
    return removed;
  }
}

class InsertCommand implements Command {
  // TODO: 你的实现 - 构造函数接收 editor, position, text
  execute(): void {
    // TODO: 你的实现
  }
  undo(): void {
    // TODO: 你的实现
  }
}

class DeleteCommand implements Command {
  // TODO: 你的实现 - 构造函数接收 editor, position, length
  execute(): void {
    // TODO: 你的实现
  }
  undo(): void {
    // TODO: 你的实现
  }
}

class CommandHistory {
  // TODO: 你的实现 - undoStack 和 redoStack
  execute(cmd: Command): void {
    // TODO: 你的实现
  }
  undo(): void {
    // TODO: 你的实现
  }
  redo(): void {
    // TODO: 你的实现
  }
}

const editor = new TextEditor();
const history = new CommandHistory();

history.execute(new InsertCommand(editor, 0, 'Hello'));
console.log(editor.content); // Hello

history.execute(new InsertCommand(editor, 5, ' World'));
console.log(editor.content); // Hello World

history.undo();
console.log(editor.content); // Hello

history.redo();
console.log(editor.content); // Hello World`,
  },
  {
    id: 'interpreter',
    name: '解释器模式',
    nameEn: 'Interpreter',
    priority: 'P2',
    category: '行为型',
    docPath: '../doc/interpreter.md',
    task: '实现简单的四则运算表达式解释器。定义 AST 节点类型（NumberLiteral 和 BinaryOp），实现 evaluate() 函数对表达式树求值。构造 (2 + 3) * 4 的 AST 并求值得到 20。',
    hints: [
      'AST 节点用联合类型表示：NumberLiteral | BinaryOp',
      'BinaryOp 包含 operator、left、right 三个字段',
      'evaluate 用递归处理，根据节点类型分别计算',
    ],
    starterCode: `type NumberLiteral = { type: 'number'; value: number };
type BinaryOp = {
  type: 'binary';
  operator: '+' | '-' | '*' | '/';
  left: Expression;
  right: Expression;
};
type Expression = NumberLiteral | BinaryOp;

function num(value: number): NumberLiteral {
  return { type: 'number', value };
}

function binary(op: BinaryOp['operator'], left: Expression, right: Expression): BinaryOp {
  return { type: 'binary', operator: op, left, right };
}

function evaluate(expr: Expression): number {
  // TODO: 你的实现 - 递归求值表达式树
}

// 构造 (2 + 3) * 4
const ast = binary('*', binary('+', num(2), num(3)), num(4));
console.log('(2 + 3) * 4 =', evaluate(ast)); // 20

// 构造 10 - 2 * 3
const ast2 = binary('-', num(10), binary('*', num(2), num(3)));
console.log('10 - 2 * 3 =', evaluate(ast2)); // 4`,
  },
  {
    id: 'iterator',
    name: '迭代器模式',
    nameEn: 'Iterator',
    priority: 'P1',
    category: '行为型',
    docPath: '../doc/iterator.md',
    task: '用 Generator 实现 fibonacci() 无限序列生成器和 take() 组合函数。fibonacci() 返回一个可迭代的斐波那契数列，take(iterable, n) 取前 n 个元素。输出前 10 个斐波那契数。',
    hints: [
      'Generator 函数用 function* 声明，yield 产出值',
      'fibonacci 内部用 while(true) 无限循环，维护 a, b 两个变量',
      'take 也是 Generator，用 for...of 消费源迭代器并 yield 前 n 个',
    ],
    starterCode: `function* fibonacci(): Generator<number> {
  // TODO: 你的实现 - 无限生成斐波那契数列 0, 1, 1, 2, 3, 5, 8...
}

function* take<T>(iterable: Iterable<T>, n: number): Generator<T> {
  // TODO: 你的实现 - 取前 n 个元素
}

const first10 = [...take(fibonacci(), 10)];
console.log('前 10 个斐波那契数:', first10);
// [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]

const first5 = [...take(fibonacci(), 5)];
console.log('前 5 个:', first5);
// [0, 1, 1, 2, 3]`,
  },
  {
    id: 'mediator',
    name: '中介者模式',
    nameEn: 'Mediator',
    priority: 'P2',
    category: '行为型',
    docPath: '../doc/mediator.md',
    task: '实现 ChatRoom 中介者。支持 addUser 注册用户、broadcast 广播消息给所有人、send 私聊指定用户。用户不直接互相引用，而是通过 ChatRoom 通信。',
    hints: [
      'ChatRoom 维护一个 users Map，key 是用户名',
      'User 持有 mediator 引用，通过 mediator 发送消息',
      'broadcast 遍历所有用户，send 查找目标用户并调用其 receive',
    ],
    starterCode: `interface Mediator {
  addUser(user: User): void;
  broadcast(sender: User, message: string): void;
  send(sender: User, to: string, message: string): void;
}

class User {
  constructor(public name: string, private mediator: Mediator) {}

  sendToAll(message: string): void {
    // TODO: 你的实现 - 通过 mediator 广播
  }

  sendTo(to: string, message: string): void {
    // TODO: 你的实现 - 通过 mediator 私聊
  }

  receive(from: string, message: string): void {
    console.log(\`[\${this.name}] 收到来自 \${from} 的消息: \${message}\`);
  }
}

class ChatRoom implements Mediator {
  private users = new Map<string, User>();

  addUser(user: User): void {
    // TODO: 你的实现
  }

  broadcast(sender: User, message: string): void {
    // TODO: 你的实现 - 给除发送者外的所有人发消息
  }

  send(sender: User, to: string, message: string): void {
    // TODO: 你的实现 - 查找目标用户并发送
  }
}

const room = new ChatRoom();
const alice = new User('Alice', room);
const bob = new User('Bob', room);
const charlie = new User('Charlie', room);

room.addUser(alice);
room.addUser(bob);
room.addUser(charlie);

alice.sendToAll('大家好!');
bob.sendTo('Charlie', '你好 Charlie!');`,
  },
  {
    id: 'memento',
    name: '备忘录模式',
    nameEn: 'Memento',
    priority: 'P2',
    category: '行为型',
    docPath: '../doc/memento.md',
    task: '实现 TextEditor 的快照系统。TextEditor 支持 save() 生成 Memento 和 restore() 从 Memento 恢复。History 管理器存储 Memento 列表，支持 undo/redo。',
    hints: [
      'Memento 是一个不可变对象，保存 content 的快照',
      'save() 返回当前状态的 Memento，restore() 接收 Memento 恢复状态',
      'History 用数组存储快照，undo 回退到上一个快照，redo 前进到下一个',
    ],
    starterCode: `interface Memento {
  readonly content: string;
}

class TextEditor {
  content = '';

  save(): Memento {
    // TODO: 你的实现 - 返回当前状态的快照
  }

  restore(memento: Memento): void {
    // TODO: 你的实现 - 从快照恢复
  }

  type(text: string): void {
    this.content += text;
  }
}

class History {
  // TODO: 你的实现 - 管理快照列表和当前位置
  save(editor: TextEditor): void {
    // TODO: 你的实现 - 保存快照
  }
  undo(editor: TextEditor): void {
    // TODO: 你的实现 - 回退到上一个快照
  }
  redo(editor: TextEditor): void {
    // TODO: 你的实现 - 前进到下一个快照
  }
}

const editor = new TextEditor();
const history = new History();

history.save(editor);
editor.type('Hello');
history.save(editor);
editor.type(' World');
history.save(editor);

console.log(editor.content); // Hello World

history.undo(editor);
console.log(editor.content); // Hello

history.undo(editor);
console.log(editor.content); // (空字符串)

history.redo(editor);
console.log(editor.content); // Hello`,
  },
  {
    id: 'observer',
    name: '观察者模式',
    nameEn: 'Observer',
    priority: 'P0',
    category: '行为型',
    docPath: '../doc/observer.md',
    task: '实现类型安全的 TypedEventEmitter。支持 on(event, handler) 订阅、off(event, handler) 取消订阅、emit(event, data) 触发、once(event, handler) 只触发一次。用泛型约束事件名和 payload 类型。',
    hints: [
      '用 Map<string, Set<Function>> 存储事件到处理器的映射',
      'once 可以用包装函数实现，触发后自动 off',
      '泛型 Events 接口定义事件名到 payload 类型的映射',
    ],
    starterCode: `type EventHandler<T> = (data: T) => void;

class TypedEventEmitter<Events extends Record<string, unknown>> {
  private listeners = new Map<keyof Events, Set<EventHandler<any>>>();

  on<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): void {
    // TODO: 你的实现
  }

  off<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): void {
    // TODO: 你的实现
  }

  emit<K extends keyof Events>(event: K, data: Events[K]): void {
    // TODO: 你的实现
  }

  once<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): void {
    // TODO: 你的实现 - 触发一次后自动取消订阅
  }
}

// 定义事件类型
interface AppEvents {
  login: { userId: string };
  error: { code: number; message: string };
}

const emitter = new TypedEventEmitter<AppEvents>();

const onLogin = (data: { userId: string }) => console.log('用户登录:', data.userId);
emitter.on('login', onLogin);
emitter.emit('login', { userId: 'u001' }); // 用户登录: u001

emitter.off('login', onLogin);
emitter.emit('login', { userId: 'u002' }); // 无输出

emitter.once('error', (data) => console.log('错误:', data.message));
emitter.emit('error', { code: 500, message: '服务器错误' }); // 错误: 服务器错误
emitter.emit('error', { code: 404, message: '未找到' }); // 无输出`,
  },
  {
    id: 'state',
    name: '状态模式',
    nameEn: 'State',
    priority: 'P1',
    category: '行为型',
    docPath: '../doc/state.md',
    task: '实现订单状态机。状态包括 Pending → Paid → Shipped，每个状态定义合法转换。调用非法转换时输出提示信息而不是抛异常。',
    hints: [
      '每个状态是一个对象，定义 pay()、ship() 等方法',
      'Order 持有当前 state 引用，调用方法时委托给 state',
      '非法转换在 state 方法中打印提示，合法转换修改 order.state',
    ],
    starterCode: `interface OrderState {
  pay(order: Order): void;
  ship(order: Order): void;
}

class PendingState implements OrderState {
  pay(order: Order): void {
    // TODO: 你的实现 - 合法转换到 PaidState
  }
  ship(order: Order): void {
    // TODO: 你的实现 - 非法，输出提示
  }
}

class PaidState implements OrderState {
  pay(order: Order): void {
    // TODO: 你的实现 - 非法，输出提示
  }
  ship(order: Order): void {
    // TODO: 你的实现 - 合法转换到 ShippedState
  }
}

class ShippedState implements OrderState {
  pay(order: Order): void {
    // TODO: 你的实现 - 非法，输出提示
  }
  ship(order: Order): void {
    // TODO: 你的实现 - 非法，输出提示
  }
}

class Order {
  state: OrderState = new PendingState();

  pay(): void {
    this.state.pay(this);
  }

  ship(): void {
    this.state.ship(this);
  }
}

const order = new Order();
order.ship();  // 提示: 待付款订单不能发货
order.pay();   // 状态: Pending -> Paid
order.pay();   // 提示: 已付款，请勿重复操作
order.ship();  // 状态: Paid -> Shipped
order.ship();  // 提示: 已发货，请勿重复操作`,
  },
  {
    id: 'strategy',
    name: '策略模式',
    nameEn: 'Strategy',
    priority: 'P0',
    category: '行为型',
    docPath: '../doc/strategy.md',
    task: '实现商品排序策略。定义 Product 类型和三种排序策略函数（byPrice/byRating/byName），ProductList.display(strategy) 接受策略函数返回排序后的商品列表。',
    hints: [
      '策略就是 (a: Product, b: Product) => number 形式的比较函数',
      'display 方法内部调用 Array.sort(strategy) 即可',
      '策略函数是独立的，可以自由组合和替换',
    ],
    starterCode: `interface Product {
  name: string;
  price: number;
  rating: number;
}

type SortStrategy = (a: Product, b: Product) => number;

const byPrice: SortStrategy = (a, b) => {
  // TODO: 你的实现 - 价格升序
};

const byRating: SortStrategy = (a, b) => {
  // TODO: 你的实现 - 评分降序
};

const byName: SortStrategy = (a, b) => {
  // TODO: 你的实现 - 名称字母序
};

class ProductList {
  constructor(private products: Product[]) {}

  display(strategy: SortStrategy): Product[] {
    // TODO: 你的实现 - 用策略排序并返回
  }
}

const list = new ProductList([
  { name: 'Banana', price: 30, rating: 4.5 },
  { name: 'Apple', price: 50, rating: 4.8 },
  { name: 'Cherry', price: 20, rating: 4.2 },
]);

console.log('按价格:', list.display(byPrice).map(p => p.name));
// ['Cherry', 'Banana', 'Apple']

console.log('按评分:', list.display(byRating).map(p => p.name));
// ['Apple', 'Banana', 'Cherry']

console.log('按名称:', list.display(byName).map(p => p.name));
// ['Apple', 'Banana', 'Cherry']`,
  },
  {
    id: 'template-method',
    name: '模板方法模式',
    nameEn: 'Template Method',
    priority: 'P2',
    category: '行为型',
    docPath: '../doc/template-method.md',
    task: '实现 DataExporter 抽象类，定义导出流程模板：validate → transform → format。CsvExporter 和 JsonExporter 分别实现各步骤，将数据导出为不同格式。',
    hints: [
      '抽象类的 export() 方法是模板，固定调用顺序',
      'validate/transform/format 是抽象方法，由子类实现',
      'transform 可以做数据清洗，format 决定最终输出格式',
    ],
    starterCode: `abstract class DataExporter {
  export(data: Record<string, unknown>[]): string {
    // 模板方法 - 固定流程
    const valid = this.validate(data);
    const transformed = this.transform(valid);
    return this.format(transformed);
  }

  protected abstract validate(data: Record<string, unknown>[]): Record<string, unknown>[];
  protected abstract transform(data: Record<string, unknown>[]): Record<string, unknown>[];
  protected abstract format(data: Record<string, unknown>[]): string;
}

class CsvExporter extends DataExporter {
  protected validate(data: Record<string, unknown>[]): Record<string, unknown>[] {
    // TODO: 你的实现 - 过滤掉缺少 name 字段的记录
  }
  protected transform(data: Record<string, unknown>[]): Record<string, unknown>[] {
    // TODO: 你的实现 - 将 name 转为大写
  }
  protected format(data: Record<string, unknown>[]): string {
    // TODO: 你的实现 - 输出 CSV 格式（表头 + 数据行）
  }
}

class JsonExporter extends DataExporter {
  protected validate(data: Record<string, unknown>[]): Record<string, unknown>[] {
    // TODO: 你的实现 - 过滤掉缺少 name 字段的记录
  }
  protected transform(data: Record<string, unknown>[]): Record<string, unknown>[] {
    // TODO: 你的实现 - 添加 exportedAt 字段
  }
  protected format(data: Record<string, unknown>[]): string {
    // TODO: 你的实现 - JSON.stringify 输出
  }
}

const data = [
  { name: 'Alice', age: 30 },
  { age: 25 },
  { name: 'Bob', age: 28 },
];

console.log('CSV 导出:');
console.log(new CsvExporter().export(data));

console.log('JSON 导出:');
console.log(new JsonExporter().export(data));`,
  },
  {
    id: 'visitor',
    name: '访问者模式',
    nameEn: 'Visitor',
    priority: 'P2',
    category: '行为型',
    docPath: '../doc/visitor.md',
    task: '实现 AST 的双重分派访问者。定义 NumberNode 和 BinaryNode 两种节点，实现 EvalVisitor（求值）和 PrintVisitor（打印表达式字符串）。每个节点通过 accept(visitor) 接受访问。',
    hints: [
      '节点类定义 accept(visitor) 方法，内部调用 visitor.visitXxx(this)',
      'Visitor 接口为每种节点类型定义一个 visit 方法',
      '双重分派：节点类型决定调用哪个 visit 方法，visitor 类型决定具体实现',
    ],
    starterCode: `interface Visitor<T> {
  visitNumber(node: NumberNode): T;
  visitBinary(node: BinaryNode): T;
}

interface AstNode {
  accept<T>(visitor: Visitor<T>): T;
}

class NumberNode implements AstNode {
  constructor(public value: number) {}

  accept<T>(visitor: Visitor<T>): T {
    // TODO: 你的实现
  }
}

class BinaryNode implements AstNode {
  constructor(
    public operator: '+' | '-' | '*' | '/',
    public left: AstNode,
    public right: AstNode,
  ) {}

  accept<T>(visitor: Visitor<T>): T {
    // TODO: 你的实现
  }
}

class EvalVisitor implements Visitor<number> {
  visitNumber(node: NumberNode): number {
    // TODO: 你的实现
  }
  visitBinary(node: BinaryNode): number {
    // TODO: 你的实现 - 递归求值左右子树再运算
  }
}

class PrintVisitor implements Visitor<string> {
  visitNumber(node: NumberNode): string {
    // TODO: 你的实现
  }
  visitBinary(node: BinaryNode): string {
    // TODO: 你的实现 - 输出带括号的表达式字符串
  }
}

// 构造 (2 + 3) * 4
const ast = new BinaryNode(
  '*',
  new BinaryNode('+', new NumberNode(2), new NumberNode(3)),
  new NumberNode(4),
);

const evalVisitor = new EvalVisitor();
const printVisitor = new PrintVisitor();

console.log('表达式:', ast.accept(printVisitor)); // ((2 + 3) * 4)
console.log('求值:', ast.accept(evalVisitor)); // 20`,
  },
];
