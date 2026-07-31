import type { Exercise } from '../types'

export const creationalExercises: Exercise[] = [
  {
    id: 'singleton',
    name: '单例模式',
    nameEn: 'Singleton',
    priority: 'P1',
    category: '创建型',
    docPath: '../doc/singleton.md',
    task: '实现一个 DatabaseConnection 单例类，确保整个应用中只有一个数据库连接实例。通过私有构造函数和静态 getInstance() 方法控制实例化，验证多次调用 getInstance() 返回的是同一个对象引用。',
    hints: [
      '使用 private 构造函数阻止外部 new，用静态属性保存唯一实例',
      'getInstance() 中判断实例是否已存在，不存在才创建（懒汉式）'
    ],
    starterCode: `class DatabaseConnection {
  private static instance: DatabaseConnection | null = null;
  public readonly id: number;

  // TODO: 你的实现 —— 私有构造函数，生成随机 id
  // TODO: 你的实现 —— 静态方法 getInstance()，返回唯一实例

  query(sql: string): string {
    return \`[Connection \${this.id}] Executing: \${sql}\`;
  }
}

const db1 = DatabaseConnection.getInstance();
const db2 = DatabaseConnection.getInstance();

console.log(db1 === db2); // 期望输出: true
console.log(db1.query('SELECT * FROM users'));
`
  },
  {
    id: 'factory-method',
    name: '工厂方法模式',
    nameEn: 'Factory Method',
    priority: 'P0',
    category: '创建型',
    docPath: '../doc/factory-method.md',
    task: '实现一个函数式日志工厂 createLogger，根据 type 参数（"console" 或 "file"）创建对应的 Logger 实例。所有 Logger 实现统一的 Logger 接口，包含 info 和 error 方法。',
    hints: [
      '先定义 Logger 接口约束 info/error 方法签名，再分别实现 ConsoleLogger 和 FileLogger',
      '工厂函数用 switch 或 Record 映射 type 到具体类，未知 type 抛出错误'
    ],
    starterCode: `interface Logger {
  info(message: string): void;
  error(message: string): void;
}

class ConsoleLogger implements Logger {
  // TODO: 你的实现 —— info 输出 "[INFO] message"，error 输出 "[ERROR] message"
}

class FileLogger implements Logger {
  // TODO: 你的实现 —— info 输出 "[FILE:INFO] message"，error 输出 "[FILE:ERROR] message"
}

type LoggerType = 'console' | 'file';

function createLogger(type: LoggerType): Logger {
  // TODO: 你的实现 —— 根据 type 返回对应 Logger 实例
  throw new Error('Not implemented');
}

const logger1 = createLogger('console');
logger1.info('Server started'); // 期望输出: [INFO] Server started

const logger2 = createLogger('file');
logger2.error('Disk full'); // 期望输出: [FILE:ERROR] Disk full
`
  },
  {
    id: 'abstract-factory',
    name: '抽象工厂模式',
    nameEn: 'Abstract Factory',
    priority: 'P1',
    category: '创建型',
    docPath: '../doc/abstract-factory.md',
    task: '实现一个 UI 主题抽象工厂。定义 UIFactory 接口，包含 createButton() 和 createInput() 方法。分别实现 LightThemeFactory 和 DarkThemeFactory，生产对应主题的 Button 和 Input 组件，每个组件有 render() 方法输出带主题标识的字符串。',
    hints: [
      '先定义 Button 和 Input 接口（含 render 方法），再为 Light/Dark 各实现两个组件类',
      'UIFactory 接口约束 createButton/createInput 的返回类型，两个主题工厂分别实现该接口'
    ],
    starterCode: `interface Button {
  render(): string;
}

interface Input {
  render(): string;
}

interface UIFactory {
  createButton(): Button;
  createInput(): Input;
}

// TODO: 你的实现 —— LightButton, DarkButton (render 返回 "[Light] Button" / "[Dark] Button")
// TODO: 你的实现 —— LightInput, DarkInput (render 返回 "[Light] Input" / "[Dark] Input")

class LightThemeFactory implements UIFactory {
  // TODO: 你的实现
  createButton(): Button { throw new Error('Not implemented'); }
  createInput(): Input { throw new Error('Not implemented'); }
}

class DarkThemeFactory implements UIFactory {
  // TODO: 你的实现
  createButton(): Button { throw new Error('Not implemented'); }
  createInput(): Input { throw new Error('Not implemented'); }
}

function renderUI(factory: UIFactory): void {
  console.log(factory.createButton().render());
  console.log(factory.createInput().render());
}

renderUI(new LightThemeFactory());
// 期望输出:
// [Light] Button
// [Light] Input

renderUI(new DarkThemeFactory());
// 期望输出:
// [Dark] Button
// [Dark] Input
`
  },
  {
    id: 'builder',
    name: '建造者模式',
    nameEn: 'Builder',
    priority: 'P1',
    category: '创建型',
    docPath: '../doc/builder.md',
    task: '实现一个 RequestBuilder 链式构建器，用于构建 HTTP 请求配置对象。支持设置 method、header、body、timeout，调用 build() 时校验 method 为必填项（未设置则抛出错误），返回不可变的请求配置对象。',
    hints: [
      '每个 setter 方法返回 this 实现链式调用，内部用私有字段暂存各配置项',
      'build() 中做校验逻辑，通过后返回一个冻结的对象（Object.freeze）'
    ],
    starterCode: `interface RequestConfig {
  method: string;
  headers: Record<string, string>;
  body?: string;
  timeout: number;
}

class RequestBuilder {
  private method: string = '';
  private headers: Record<string, string> = {};
  private body?: string;
  private timeout: number = 5000;

  // TODO: 你的实现 —— setMethod(method: string): this
  // TODO: 你的实现 —— setHeader(key: string, value: string): this
  // TODO: 你的实现 —— setBody(body: string): this
  // TODO: 你的实现 —— setTimeout(ms: number): this
  // TODO: 你的实现 —— build(): RequestConfig（校验 method 必填，未设置抛 Error）

  build(): RequestConfig {
    throw new Error('Not implemented');
  }
}

const request = new RequestBuilder()
  .setMethod('POST')
  .setHeader('Content-Type', 'application/json')
  .setBody('{"name": "test"}')
  .setTimeout(3000)
  .build();

console.log(request.method); // 期望输出: POST
console.log(request.headers['Content-Type']); // 期望输出: application/json
console.log(request.timeout); // 期望输出: 3000

try {
  new RequestBuilder().build();
} catch (e) {
  console.log((e as Error).message); // 期望输出: method is required
}
`
  },
  {
    id: 'prototype',
    name: '原型模式',
    nameEn: 'Prototype',
    priority: 'P2',
    category: '创建型',
    docPath: '../doc/prototype.md',
    task: '实现 GameUnit 类的 clone() 方法，对 position 对象和 inventory 数组进行深拷贝。验证修改克隆对象的嵌套属性不会影响原始对象。',
    hints: [
      'position 是对象引用，需要逐字段拷贝或使用展开运算符创建新对象',
      'inventory 是数组，使用 slice() 或 [...arr] 创建新数组，避免共享引用'
    ],
    starterCode: `interface Position {
  x: number;
  y: number;
}

class GameUnit {
  name: string;
  position: Position;
  inventory: string[];

  constructor(name: string, position: Position, inventory: string[]) {
    this.name = name;
    this.position = position;
    this.inventory = inventory;
  }

  clone(): GameUnit {
    // TODO: 你的实现 —— 返回深拷贝的新 GameUnit（position 和 inventory 不能共享引用）
    throw new Error('Not implemented');
  }
}

const original = new GameUnit('Knight', { x: 10, y: 20 }, ['sword', 'shield']);
const cloned = original.clone();

cloned.position.x = 99;
cloned.inventory.push('potion');

console.log(original.position.x); // 期望输出: 10（未被修改）
console.log(original.inventory.length); // 期望输出: 2（未被修改）
console.log(cloned.position.x); // 期望输出: 99
console.log(cloned.inventory.length); // 期望输出: 3
console.log(original !== cloned); // 期望输出: true
`
  }
]
