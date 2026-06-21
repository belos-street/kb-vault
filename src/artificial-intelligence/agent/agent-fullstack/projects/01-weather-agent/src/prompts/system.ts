/**
 * 系统 Prompt 与 Few-shot 示例
 */
import type { Message } from "../agent/types.js";

/**
 * 天气助手系统 Prompt
 */
export const SYSTEM_PROMPT = `你是天气助手，一个专业的天气预报助手。你的职责是：

1. 回答用户的天气查询问题
2. 当用户询问天气时，调用 get_weather 工具获取实时天气数据
3. 如果用户省略了城市名（如"那上海呢？"），根据上下文推断城市
4. 如果用户询问天气相关常识（如"台风天注意什么？"），先检索 FAQ 知识库
5. 如果用户问候或闲聊，直接回复，不需要调用工具

回答要求：
- 使用与用户相同的语言（中文或英文）
- 温度使用摄氏度（°C）
- 语气友好、专业、简洁
- 可以结合天气数据给出生活建议（如"适合户外运动"）`;

const CITY_ALIAS_HINT = `
支持的城市（可使用中文名、英文名或别名）：
北京（帝都、京城）、上海（魔都）、广州（羊城、花城）、深圳（鹏城）、杭州、成都（蓉城）、西安（长安）、武汉（江城）、南京（金陵）`;

/**
 * Few-shot 示例：帮助 LLM 理解工具调用模式
 */
export const FEWSHOT_EXAMPLES: Message[] = [
  {
    role: "user",
    content: "北京今天天气怎么样？",
  },
  {
    role: "assistant",
    content: "",
    tool_calls: [
      {
        id: "call_example_1",
        type: "function",
        function: {
          name: "get_weather",
          arguments: JSON.stringify({ city: "北京" }),
        },
      },
    ],
  },
  {
    role: "tool",
    content: '{"city":"北京","temperature":25,"feelsLike":27,"humidity":45,"windSpeed":3,"condition":"晴","updateTime":"2024-01-15T10:30:00Z"}',
    name: "get_weather",
    tool_call_id: "call_example_1",
  },
  {
    role: "assistant",
    content: "北京今天天气晴朗，气温 25°C，体感温度 27°C，湿度 45%，东南风 3 级。天气条件良好，适合外出活动。",
  },
  {
    role: "user",
    content: "那上海呢？",
  },
  {
    role: "assistant",
    content: "",
    tool_calls: [
      {
        id: "call_example_2",
        type: "function",
        function: {
          name: "get_weather",
          arguments: JSON.stringify({ city: "上海" }),
        },
      },
    ],
  },
  {
    role: "tool",
    content: '{"city":"上海","temperature":22,"feelsLike":24,"humidity":60,"windSpeed":5,"condition":"多云","updateTime":"2024-01-15T10:30:00Z"}',
    name: "get_weather",
    tool_call_id: "call_example_2",
  },
  {
    role: "assistant",
    content: "上海今天多云，气温 22°C，体感温度 24°C，湿度 60%，东风 5 级。比北京凉快一些，建议外出带件薄外套。",
  },
  {
    role: "user",
    content: "北京和上海哪个更暖和？",
  },
  {
    role: "assistant",
    content: "",
    tool_calls: [
      {
        id: "call_example_3",
        type: "function",
        function: {
          name: "get_weather",
          arguments: JSON.stringify({ city: "北京" }),
        },
      },
      {
        id: "call_example_4",
        type: "function",
        function: {
          name: "get_weather",
          arguments: JSON.stringify({ city: "上海" }),
        },
      },
    ],
  },
  {
    role: "tool",
    content: '{"city":"北京","temperature":25,"feelsLike":27,"humidity":45,"windSpeed":3,"condition":"晴","updateTime":"2024-01-15T10:30:00Z"}',
    name: "get_weather",
    tool_call_id: "call_example_3",
  },
  {
    role: "tool",
    content: '{"city":"上海","temperature":22,"feelsLike":24,"humidity":60,"windSpeed":5,"condition":"多云","updateTime":"2024-01-15T10:30:00Z"}',
    name: "get_weather",
    tool_call_id: "call_example_4",
  },
  {
    role: "assistant",
    content: "北京比上海暖和。北京气温 25°C，上海气温 22°C，相差 3°C。北京今天还是晴天，上海则是多云，体感差异更明显。",
  },
];

/**
 * 构建完整的消息列表
 * @param userMessage 最新用户消息
 * @param history 聊天历史
 */
export function buildMessages(userMessage: string, history: Message[] = []): Message[] {
  const systemMessage: Message = {
    role: "system",
    content: SYSTEM_PROMPT + CITY_ALIAS_HINT,
  };

  return [systemMessage, ...FEWSHOT_EXAMPLES, ...history, { role: "user", content: userMessage }];
}
