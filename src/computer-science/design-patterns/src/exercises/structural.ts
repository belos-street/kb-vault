import type { Exercise } from '../types'

export const structuralExercises: Exercise[] = [
  {
    id: 'adapter',
    name: '适配器模式',
    nameEn: 'Adapter',
    priority: 'P1',
    category: '结构型',
    docPath: '../doc/adapter.md',
    task: '将第三方日志库 ThirdPartyLogger（接口为 writeLog(severity, msg, timestamp)）适配为内部统一的 Logger 接口（log(level, message)）。实现 LoggerAdapter 类包装 ThirdPartyLogger，在内部完成参数转换（level 映射为 severity，自动补充 timestamp）。',
    hints: [
      'Adapter 类持有 ThirdPartyLogger 实例，在 log() 方法内部调用 writeLog() 并做参数映射',
      'timestamp 可用 Date.now() 自动生成，level 直接作为 severity 传递即可'
    ],
    starterCode: `interface Logger {
  log(level: string, message: string): void;
}

// 第三方库（不可修改）
class ThirdPartyLogger {
  writeLog(severity: string, msg: string, timestamp: number): void {
    console.log(\`[\${severity}] \${msg} @ \${timestamp}\`);
  }
}

class LoggerAdapter implements Logger {
  // TODO: 你的实现 —— 构造函数接收 ThirdPartyLogger 实例
  // TODO: 你的实现 —— log(level, message) 内部调用 writeLog，timestamp 用 Date.now()

  log(level: string, message: string): void {
    throw new Error('Not implemented');
  }
}

const thirdParty = new ThirdPartyLogger();
const logger: Logger = new LoggerAdapter(thirdParty);

logger.log('WARN', 'Memory usage high');
// 期望输出格式: [WARN] Memory usage high @ <timestamp>
`
  },
  {
    id: 'bridge',
    name: '桥接模式',
    nameEn: 'Bridge',
    priority: 'P2',
    category: '结构型',
    docPath: '../doc/bridge.md',
    task: '实现消息系统的桥接结构：Message 抽象层（TextMessage、UrgentMessage）与 Channel 实现层（EmailChannel、SMSChannel）分离。Message 持有 Channel 引用，通过 send() 方法委托具体发送逻辑给 Channel，两个维度可独立扩展。',
    hints: [
      'Channel 接口定义 send(content: string) 方法，Email/SMS 各自实现不同的输出格式',
      'Message 基类构造函数接收 Channel，UrgentMessage 在 send 时给内容加 "[URGENT] " 前缀'
    ],
    starterCode: `interface Channel {
  send(content: string): void;
}

class EmailChannel implements Channel {
  // TODO: 你的实现 —— send 输出 "[Email] content"
  send(content: string): void { throw new Error('Not implemented'); }
}

class SMSChannel implements Channel {
  // TODO: 你的实现 —— send 输出 "[SMS] content"
  send(content: string): void { throw new Error('Not implemented'); }
}

abstract class Message {
  protected channel: Channel;

  constructor(channel: Channel) {
    this.channel = channel;
  }

  abstract send(content: string): void;
}

class TextMessage extends Message {
  // TODO: 你的实现 —— send 直接委托 channel.send(content)
  send(content: string): void { throw new Error('Not implemented'); }
}

class UrgentMessage extends Message {
  // TODO: 你的实现 —— send 委托 channel.send("[URGENT] " + content)
  send(content: string): void { throw new Error('Not implemented'); }
}

const email = new EmailChannel();
const sms = new SMSChannel();

new TextMessage(email).send('Hello'); // 期望输出: [Email] Hello
new UrgentMessage(sms).send('Server down'); // 期望输出: [SMS] [URGENT] Server down
`
  },
  {
    id: 'composite',
    name: '组合模式',
    nameEn: 'Composite',
    priority: 'P1',
    category: '结构型',
    docPath: '../doc/composite.md',
    task: '实现文件系统树结构。定义 FileSystemNode 接口（含 size() 和 print(indent) 方法），File 为叶子节点，Directory 为容器节点可包含子节点。Directory 的 size() 递归累加所有子节点大小，print() 递归打印树形结构。',
    hints: [
      'File 的 size() 返回自身大小，print() 输出缩进 + 文件名',
      'Directory 维护 children 数组，size() 用 reduce 累加，print() 先打印自身再递归打印子节点'
    ],
    starterCode: `interface FileSystemNode {
  size(): number;
  print(indent?: string): void;
}

class File implements FileSystemNode {
  constructor(private name: string, private fileSize: number) {}

  // TODO: 你的实现 —— size() 返回 fileSize
  // TODO: 你的实现 —— print(indent) 输出 "indent + name (fileSize bytes)"
  size(): number { throw new Error('Not implemented'); }
  print(indent: string = ''): void { throw new Error('Not implemented'); }
}

class Directory implements FileSystemNode {
  private children: FileSystemNode[] = [];

  constructor(private name: string) {}

  add(node: FileSystemNode): void {
    this.children.push(node);
  }

  // TODO: 你的实现 —— size() 递归累加所有子节点 size
  // TODO: 你的实现 —— print(indent) 输出 "indent + name/"，然后子节点用 indent + "  " 递归打印
  size(): number { throw new Error('Not implemented'); }
  print(indent: string = ''): void { throw new Error('Not implemented'); }
}

const root = new Directory('root');
const src = new Directory('src');
src.add(new File('index.ts', 200));
src.add(new File('utils.ts', 150));
root.add(src);
root.add(new File('README.md', 100));

console.log(root.size()); // 期望输出: 450
root.print();
// 期望输出:
// root/
//   src/
//     index.ts (200 bytes)
//     utils.ts (150 bytes)
//   README.md (100 bytes)
`
  },
  {
    id: 'decorator',
    name: '装饰器模式',
    nameEn: 'Decorator',
    priority: 'P0',
    category: '结构型',
    docPath: '../doc/decorator.md',
    task: '实现 DataSource 装饰器链。基础 SimpleDataSource 直接读写字符串，Base64EncodingDecorator 在写入时做 Base64 编码、读取时解码，CompressionDecorator 在写入时压缩（模拟为反转字符串）、读取时解压。装饰器可自由组合嵌套。',
    hints: [
      '所有装饰器实现 DataSource 接口并持有被装饰对象的引用，write/read 中先处理再委托',
      '组合顺序：new CompressionDecorator(new Base64EncodingDecorator(new SimpleDataSource()))，写入时从外到内处理'
    ],
    starterCode: `interface DataSource {
  write(data: string): void;
  read(): string;
}

class SimpleDataSource implements DataSource {
  private data: string = '';

  write(data: string): void {
    this.data = data;
  }

  read(): string {
    return this.data;
  }
}

class Base64EncodingDecorator implements DataSource {
  // TODO: 你的实现 —— 构造函数接收 DataSource
  // TODO: 你的实现 —— write 时先 Base64 编码再委托（用 btoa）
  // TODO: 你的实现 —— read 时先委托读取再 Base64 解码（用 atob）
  constructor(private wrappee: DataSource) {}
  write(data: string): void { throw new Error('Not implemented'); }
  read(): string { throw new Error('Not implemented'); }
}

class CompressionDecorator implements DataSource {
  // TODO: 你的实现 —— 构造函数接收 DataSource
  // TODO: 你的实现 —— write 时先"压缩"（反转字符串）再委托
  // TODO: 你的实现 —— read 时先委托读取再"解压"（反转字符串）
  constructor(private wrappee: DataSource) {}
  write(data: string): void { throw new Error('Not implemented'); }
  read(): string { throw new Error('Not implemented'); }
}

const source = new CompressionDecorator(
  new Base64EncodingDecorator(new SimpleDataSource())
);

source.write('Hello Design Patterns');
const result = source.read();
console.log(result); // 期望输出: Hello Design Patterns
console.log(result === 'Hello Design Patterns'); // 期望输出: true
`
  },
  {
    id: 'facade',
    name: '外观模式',
    nameEn: 'Facade',
    priority: 'P2',
    category: '结构型',
    docPath: '../doc/facade.md',
    task: '实现 VideoConverter 外观类，将视频转换的复杂流程（读取文件 → 解码 → 编码 → 写入文件）封装为一个简单的 convert(filename, format) 方法。内部聚合 FileReader、VideoCodec、FileWriter 三个子系统，客户端无需了解各子系统的交互细节。',
    hints: [
      '各子系统类各自实现单一职责方法（read/decode/encode/write），Facade 按顺序编排调用',
      'convert() 返回最终输出文件名，格式为 "原文件名.目标格式"'
    ],
    starterCode: `class FileReader {
  read(filename: string): string {
    console.log(\`Reading file: \${filename}\`);
    return \`raw-data-of-\${filename}\`;
  }
}

class VideoCodec {
  decode(data: string): string {
    console.log('Decoding video data...');
    return \`decoded(\${data})\`;
  }

  encode(data: string, format: string): string {
    console.log(\`Encoding to \${format}...\`);
    return \`\${format}(\${data})\`;
  }
}

class FileWriter {
  write(data: string, filename: string): void {
    console.log(\`Writing \${data} to \${filename}\`);
  }
}

class VideoConverter {
  // TODO: 你的实现 —— 构造函数中初始化三个子系统
  // TODO: 你的实现 —— convert(filename, format) 编排完整流程并返回输出文件名

  convert(filename: string, format: string): string {
    throw new Error('Not implemented');
  }
}

const converter = new VideoConverter();
const output = converter.convert('movie.avi', 'mp4');
console.log(output); // 期望输出: movie.mp4
// 控制台还应依次输出:
// Reading file: movie.avi
// Decoding video data...
// Encoding to mp4...
// Writing mp4(decoded(raw-data-of-movie.avi)) to movie.mp4
`
  },
  {
    id: 'flyweight',
    name: '享元模式',
    nameEn: 'Flyweight',
    priority: 'P2',
    category: '结构型',
    docPath: '../doc/flyweight.md',
    task: '实现 CharFlyweightFactory 字符样式享元工厂。每个字符样式（如 bold、italic）对应一个 Flyweight 对象，工厂通过 Map 缓存已创建的样式。验证渲染 10000 个字符时，只创建了有限数量的 Flyweight 实例（本例中为 2 个：bold 和 normal）。',
    hints: [
      '工厂用 Map<string, CharFlyweight> 缓存，getFlyweight(style) 先查缓存再创建',
      'Flyweight 存储共享状态（style），渲染时接收外部状态（字符内容）作为参数'
    ],
    starterCode: `class CharFlyweight {
  constructor(private style: string) {}

  render(char: string): string {
    return \`<\${this.style}>\${char}</\${this.style}>\`;
  }
}

class CharFlyweightFactory {
  private pool: Map<string, CharFlyweight> = new Map();

  getFlyweight(style: string): CharFlyweight {
    // TODO: 你的实现 —— 缓存命中则返回，否则创建新实例并存入缓存
    throw new Error('Not implemented');
  }

  get poolSize(): number {
    return this.pool.size;
  }
}

const factory = new CharFlyweightFactory();
const text = 'a'.repeat(5000) + 'b'.repeat(5000);
const styles = ['bold', 'normal'];

const results: string[] = [];
for (let i = 0; i < text.length; i++) {
  const style = styles[i % 2];
  const flyweight = factory.getFlyweight(style);
  results.push(flyweight.render(text[i]));
}

console.log(factory.poolSize); // 期望输出: 2
console.log(results[0]); // 期望输出: <bold>a</bold>
console.log(results[1]); // 期望输出: <normal>a</normal>
console.log(results.length); // 期望输出: 10000
`
  },
  {
    id: 'proxy',
    name: '代理模式',
    nameEn: 'Proxy',
    priority: 'P0',
    category: '结构型',
    docPath: '../doc/proxy.md',
    task: '使用 JavaScript Proxy 实现一个缓存代理，包装 fibonacci 函数。首次计算时执行真实逻辑并缓存结果，后续相同参数的调用直接返回缓存值。通过计数器验证缓存命中，避免重复计算。',
    hints: [
      '用 new Proxy(target, handler) 拦截函数调用（apply trap），在 handler 中维护 Map 缓存',
      '缓存 key 用参数的 JSON 序列化，命中则直接返回，未命中则调用原始函数并存入缓存'
    ],
    starterCode: `let computeCount = 0;

function fibonacci(n: number): number {
  computeCount++;
  if (n <= 1) return n;
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
    [a, b] = [b, a + b];
  }
  return b;
}

function createCachedProxy<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map<string, any>();

  // TODO: 你的实现 —— 返回 new Proxy(fn, { apply(...) })
  // apply trap 中：序列化参数为 key，命中缓存直接返回，否则调用 fn 并缓存结果
  throw new Error('Not implemented');
}

const cachedFib = createCachedProxy(fibonacci);

console.log(cachedFib(40)); // 期望输出: 102334155
console.log(cachedFib(40)); // 期望输出: 102334155（缓存命中）
console.log(cachedFib(40)); // 期望输出: 102334155（缓存命中）
console.log(computeCount); // 期望输出: 1（只真正计算了一次）
`
  }
]
