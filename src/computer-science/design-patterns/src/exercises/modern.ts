import type { Exercise } from '../types'

export const modernExercises: Exercise[] = [
  {
    id: 'dependency-injection',
    name: '依赖注入',
    nameEn: 'Dependency Injection',
    priority: 'P0',
    category: '现代工程',
    docPath: '../doc/dependency-injection.md',
    task: '实现简易 DI Container。支持 bind(token, factory) 注册工厂函数、resolve(token) 解析实例。支持 singleton scope（同一 token 只创建一次实例）。验证依赖注入：ServiceA 依赖 ServiceB，通过容器自动注入。',
    hints: [
      'Container 内部用 Map 存储 token → factory 的映射',
      'singleton 用另一个 Map 缓存已创建的实例',
      'resolve 时先检查缓存，没有则调用 factory 创建并缓存'
    ],
    starterCode: `type Factory<T> = (container: Container) => T;

class Container {
  private factories = new Map<string, Factory<any>>();
  private singletons = new Map<string, any>();

  bind<T>(token: string, factory: Factory<T>, singleton = false): void {
    // TODO: 你的实现 - 注册工厂函数，记录是否为 singleton
  }

  resolve<T>(token: string): T {
    // TODO: 你的实现 - 解析实例，singleton 需要缓存
  }
}

class Database {
  query(sql: string): string {
    return \`结果: \${sql}\`;
  }
}

class UserService {
  constructor(private db: Database) {}

  getUser(id: string): string {
    return this.db.query(\`SELECT * FROM users WHERE id = \${id}\`);
  }
}

const container = new Container();

container.bind('Database', () => new Database(), true);
container.bind('UserService', (c) => new UserService(c.resolve<Database>('Database')));

const service1 = container.resolve<UserService>('UserService');
const service2 = container.resolve<UserService>('UserService');

console.log(service1.getUser('u001')); // 结果: SELECT * FROM users WHERE id = u001

const db1 = container.resolve<Database>('Database');
const db2 = container.resolve<Database>('Database');
console.log('Database 是单例:', db1 === db2); // true`
  },
  {
    id: 'repository',
    name: '仓储模式',
    nameEn: 'Repository',
    priority: 'P2',
    category: '现代工程',
    docPath: '../doc/repository.md',
    task: '实现 InMemoryUserRepository，提供 findById/findByEmail/save/delete 方法。UserRegistrationService 通过构造函数注入 Repository 接口，实现用户注册逻辑（检查邮箱唯一性）。',
    hints: [
      'Repository 接口定义数据访问契约，InMemory 实现用 Map 存储',
      'Service 依赖接口而非具体实现，方便替换存储层',
      'save 方法同时处理新增和更新'
    ],
    starterCode: `interface User {
  id: string;
  name: string;
  email: string;
}

interface UserRepository {
  findById(id: string): User | undefined;
  findByEmail(email: string): User | undefined;
  save(user: User): void;
  delete(id: string): void;
}

class InMemoryUserRepository implements UserRepository {
  private store = new Map<string, User>();

  findById(id: string): User | undefined {
    // TODO: 你的实现
  }

  findByEmail(email: string): User | undefined {
    // TODO: 你的实现 - 遍历 store 查找
  }

  save(user: User): void {
    // TODO: 你的实现
  }

  delete(id: string): void {
    // TODO: 你的实现
  }
}

class UserRegistrationService {
  constructor(private repo: UserRepository) {}

  register(id: string, name: string, email: string): string {
    // TODO: 你的实现 - 检查邮箱是否已存在，存在返回错误，否则保存
  }
}

const repo = new InMemoryUserRepository();
const service = new UserRegistrationService(repo);

console.log(service.register('u1', 'Alice', 'alice@example.com'));
// 注册成功: Alice

console.log(service.register('u2', 'Bob', 'alice@example.com'));
// 注册失败: 邮箱已存在

console.log(service.register('u3', 'Charlie', 'charlie@example.com'));
// 注册成功: Charlie

repo.delete('u1');
console.log(repo.findById('u1')); // undefined`
  },
  {
    id: 'cqrs',
    name: 'CQRS',
    nameEn: 'CQRS',
    priority: 'P1',
    category: '现代工程',
    docPath: '../doc/cqrs.md',
    task: '实现读写分离的 CQRS 模式。CommandHandler 处理 CREATE_TASK 和 COMPLETE_TASK 命令修改写模型；QueryHandler 处理 GET_SUMMARIES 查询从读模型返回数据。写操作后同步更新读模型。',
    hints: [
      '写模型是规范化的数据存储，读模型是为查询优化的视图',
      'Command 只负责修改状态，不返回查询结果',
      'Query 只读取数据，不产生副作用'
    ],
    starterCode: `interface Task {
  id: string;
  title: string;
  completed: boolean;
}

type Command =
  | { type: 'CREATE_TASK'; id: string; title: string }
  | { type: 'COMPLETE_TASK'; id: string };

type Query = { type: 'GET_SUMMARIES' };

interface Summary {
  total: number;
  completed: number;
  pending: number;
}

class CommandHandler {
  private tasks = new Map<string, Task>();

  handle(command: Command): void {
    // TODO: 你的实现 - 根据 command.type 处理创建和完成任务
  }

  getTasks(): Map<string, Task> {
    return this.tasks;
  }
}

class QueryHandler {
  constructor(private commandHandler: CommandHandler) {}

  handle(query: Query): Summary {
    // TODO: 你的实现 - 从写模型读取数据，返回汇总信息
  }
}

const commandHandler = new CommandHandler();
const queryHandler = new QueryHandler(commandHandler);

commandHandler.handle({ type: 'CREATE_TASK', id: 't1', title: '学习设计模式' });
commandHandler.handle({ type: 'CREATE_TASK', id: 't2', title: '写练习代码' });
commandHandler.handle({ type: 'CREATE_TASK', id: 't3', title: '复习' });
commandHandler.handle({ type: 'COMPLETE_TASK', id: 't1' });

const summary = queryHandler.handle({ type: 'GET_SUMMARIES' });
console.log('汇总:', summary);
// { total: 3, completed: 1, pending: 2 }`
  },
  {
    id: 'event-sourcing',
    name: '事件溯源',
    nameEn: 'Event Sourcing',
    priority: 'P1',
    category: '现代工程',
    docPath: '../doc/event-sourcing.md',
    task: '实现 BankAccount 聚合根。操作（open/deposit/withdraw）产生领域事件存入 EventStore。账户状态不直接存储，而是通过重放事件重建。支持从事件历史恢复账户状态。',
    hints: [
      'EventStore 只追加事件，永不修改',
      '聚合根通过 apply(event) 方法将事件应用到当前状态',
      '重建状态：创建空聚合根，依次 apply 所有历史事件'
    ],
    starterCode: `type DomainEvent =
  | { type: 'ACCOUNT_OPENED'; accountId: string; owner: string }
  | { type: 'DEPOSITED'; accountId: string; amount: number }
  | { type: 'WITHDRAWN'; accountId: string; amount: number };

class EventStore {
  private events: DomainEvent[] = [];

  append(event: DomainEvent): void {
    // TODO: 你的实现
  }

  getEvents(accountId: string): DomainEvent[] {
    // TODO: 你的实现 - 返回指定账户的所有事件
  }
}

class BankAccount {
  accountId = '';
  owner = '';
  balance = 0;

  apply(event: DomainEvent): void {
    // TODO: 你的实现 - 根据事件类型更新状态
  }

  // 从事件历史重建状态
  static rehydrate(events: DomainEvent[]): BankAccount {
    // TODO: 你的实现
  }
}

const store = new EventStore();

// 执行操作 → 产生事件 → 存储
store.append({ type: 'ACCOUNT_OPENED', accountId: 'acc1', owner: 'Alice' });
store.append({ type: 'DEPOSITED', accountId: 'acc1', amount: 1000 });
store.append({ type: 'WITHDRAWN', accountId: 'acc1', amount: 200 });
store.append({ type: 'DEPOSITED', accountId: 'acc1', amount: 500 });

// 从事件重建状态
const account = BankAccount.rehydrate(store.getEvents('acc1'));
console.log('账户:', account.owner); // Alice
console.log('余额:', account.balance); // 1300

// 验证事件不可变
console.log('事件数量:', store.getEvents('acc1').length); // 4`
  },
  {
    id: 'middleware-pipeline',
    name: '中间件管道',
    nameEn: 'Middleware Pipeline',
    priority: 'P0',
    category: '现代工程',
    docPath: '../doc/middleware-pipeline.md',
    task: '实现 Koa 风格的 compose() 函数（洋葱模型）。中间件签名为 async (ctx, next) => void，next() 调用下一层。组合 logger → auth → handler 三个中间件，验证洋葱模型执行顺序。',
    hints: [
      'compose 返回一个 async 函数，内部递归调用中间件',
      'next 是一个函数，调用时执行下一个中间件，返回 Promise',
      '洋葱模型：请求从外到内，响应从内到外，next() 前后的代码分别在两个阶段执行'
    ],
    starterCode: `type Context = { path: string; token?: string; body?: string; logs: string[] };
type Next = () => Promise<void>;
type Middleware = (ctx: Context, next: Next) => Promise<void>;

function compose(middlewares: Middleware[]): (ctx: Context) => Promise<void> {
  // TODO: 你的实现 - 返回一个函数，按洋葱模型执行所有中间件
}

const logger: Middleware = async (ctx, next) => {
  ctx.logs.push('logger: 请求开始');
  await next();
  ctx.logs.push('logger: 请求结束');
};

const auth: Middleware = async (ctx, next) => {
  if (!ctx.token) {
    ctx.body = '401 Unauthorized';
    return; // 短路，不调用 next
  }
  ctx.logs.push('auth: 验证通过');
  await next();
  ctx.logs.push('auth: 清理');
};

const handler: Middleware = async (ctx, next) => {
  ctx.logs.push('handler: 处理请求');
  ctx.body = '200 OK';
  await next();
};

const app = compose([logger, auth, handler]);

// 正常请求
const ctx1: Context = { path: '/api', token: 'secret', logs: [] };
app(ctx1).then(() => {
  console.log('响应:', ctx1.body); // 200 OK
  console.log('执行顺序:', ctx1.logs);
  // ['logger: 请求开始', 'auth: 验证通过', 'handler: 处理请求', 'auth: 清理', 'logger: 请求结束']
});

// 未授权请求
const ctx2: Context = { path: '/api', logs: [] };
app(ctx2).then(() => {
  console.log('响应:', ctx2.body); // 401 Unauthorized
  console.log('执行顺序:', ctx2.logs);
  // ['logger: 请求开始', 'logger: 请求结束']
});`
  }
]
