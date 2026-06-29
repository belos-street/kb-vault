/**
 * 系统 Prompt 与 Few-shot 示例
 */
import type { Message } from './type'
import { CITY_ALIASES } from '../services/const'

/**
 * 从 CITY_ALIASES 动态生成城市提示字符串
 */
function buildCityHint(): string {
  const cityNicknames = new Map<string, string[]>()

  for (const [key, canonical] of Object.entries(CITY_ALIASES)) {
    if (!cityNicknames.has(canonical)) {
      cityNicknames.set(canonical, [])
    }
    // 只收集中文别名（非 ASCII），排除城市名本身
    if (key !== canonical && /[\u4e00-\u9fff]/.test(key)) {
      cityNicknames.get(canonical)!.push(key)
    }
  }

  return Array.from(cityNicknames.entries())
    .sort(([a], [b]) => a.localeCompare(b, 'zh-CN'))
    .map(([city, nicknames]) =>
      nicknames.length > 0 ? `${city}（${nicknames.join('、')}）` : city
    )
    .join('、')
}

/**
 * 天气助手系统 Prompt
 */
export const SYSTEM_PROMPT = `你是天气助手，一个专业的天气预报助手。你的职责是：

1. 当用户询问天气时，调用 get_weather 工具获取实时天气数据
2. 如果用户省略了城市名（如"那上海呢？"），根据上下文推断城市
3. 如果用户询问天气相关常识（如"台风天注意什么？"），直接回答，不需要调用工具
4. 如果用户问候或闲聊，直接回复，不需要调用工具

回答要求：
- 使用与用户相同的语言（中文或英文）
- 温度使用摄氏度（°C）
- 语气友好、专业、简洁
- 可以结合天气数据给出生活建议（如"适合户外运动"）`

/**
 * Few-shot 示例：帮助 LLM 理解工具调用模式
 */
export const FEWSHOT_EXAMPLES: Message[] = [
  // --- 场景1：直接查天气 ---
  {
    role: 'user',
    content: '北京今天天气怎么样？'
  },
  {
    role: 'assistant',
    content: '',
    tool_calls: [
      {
        id: 'call_example_1',
        type: 'function',
        function: {
          name: 'get_weather',
          arguments: JSON.stringify({ city: '北京' })
        }
      }
    ]
  },
  {
    role: 'tool',
    content:
      '{"city":"北京","temperature":25,"feelsLike":27,"humidity":45,"windSpeed":3,"condition":"晴","updateTime":"2024-01-15T10:30:00Z"}',
    name: 'get_weather',
    tool_call_id: 'call_example_1'
  },
  {
    role: 'assistant',
    content:
      '北京今天天气晴朗，气温 25°C，体感温度 27°C，湿度 45%，东南风 3 级。天气条件良好，适合外出活动。'
  },

  // --- 场景2：上下文推断城市 ---
  {
    role: 'user',
    content: '那上海呢？'
  },
  {
    role: 'assistant',
    content: '',
    tool_calls: [
      {
        id: 'call_example_2',
        type: 'function',
        function: {
          name: 'get_weather',
          arguments: JSON.stringify({ city: '上海' })
        }
      }
    ]
  },
  {
    role: 'tool',
    content:
      '{"city":"上海","temperature":22,"feelsLike":24,"humidity":60,"windSpeed":5,"condition":"多云","updateTime":"2024-01-15T10:30:00Z"}',
    name: 'get_weather',
    tool_call_id: 'call_example_2'
  },
  {
    role: 'assistant',
    content:
      '上海今天多云，气温 22°C，体感温度 24°C，湿度 60%，东风 5 级。比北京凉快一些，建议外出带件薄外套。'
  },

  // --- 场景3：多工具同时调用 ---
  {
    role: 'user',
    content: '北京和上海哪个更暖和？'
  },
  {
    role: 'assistant',
    content: '',
    tool_calls: [
      {
        id: 'call_example_3',
        type: 'function',
        function: {
          name: 'get_weather',
          arguments: JSON.stringify({ city: '北京' })
        }
      },
      {
        id: 'call_example_4',
        type: 'function',
        function: {
          name: 'get_weather',
          arguments: JSON.stringify({ city: '上海' })
        }
      }
    ]
  },
  {
    role: 'tool',
    content:
      '{"city":"北京","temperature":25,"feelsLike":27,"humidity":45,"windSpeed":3,"condition":"晴","updateTime":"2024-01-15T10:30:00Z"}',
    name: 'get_weather',
    tool_call_id: 'call_example_3'
  },
  {
    role: 'tool',
    content:
      '{"city":"上海","temperature":22,"feelsLike":24,"humidity":60,"windSpeed":5,"condition":"多云","updateTime":"2024-01-15T10:30:00Z"}',
    name: 'get_weather',
    tool_call_id: 'call_example_4'
  },
  {
    role: 'assistant',
    content:
      '北京比上海暖和。北京气温 25°C，上海气温 22°C，相差 3°C。北京今天还是晴天，上海则是多云，体感差异更明显。'
  },

  // --- 场景4：闲聊，不需要调用工具 ---
  {
    role: 'user',
    content: '你好！'
  },
  {
    role: 'assistant',
    content: '你好！我是天气助手，有什么天气问题需要我帮忙吗？'
  },

  // --- 场景5：天气常识，不需要调用工具 ---
  {
    role: 'user',
    content: '台风天要注意什么？'
  },
  {
    role: 'assistant',
    content:
      '台风天请注意以下几点：\n1. 尽量避免外出，待在室内安全的地方\n2. 关好门窗，加固易被风吹动的搭建物\n3. 储备必要的食品、饮用水和应急药品\n4. 远离广告牌、大树和临时搭建物\n5. 关注气象部门发布的预警信息\n需要我帮你查询某个城市的天气吗？'
  }
]

/**
 * 构建完整的消息列表
 * @param userMessage 最新用户消息
 * @param history 聊天历史
 * @param ragContext 可选的 RAG 检索上下文
 */
export function buildMessages(
  userMessage: string,
  history: Message[] = [],
  ragContext?: string
): Message[] {
  const cityHint = `\n\n支持的城市（可使用中文名、英文名或别名）：\n${buildCityHint()}`

  const systemContent = ragContext
    ? `${SYSTEM_PROMPT}${cityHint}\n\n---\n${ragContext}\n---`
    : `${SYSTEM_PROMPT}${cityHint}`

  const systemMessage: Message = {
    role: 'system',
    content: systemContent
  }

  // 多轮对话中，只有 history 为空（首轮）时才带 few-shot 示例
  const messages: Message[] = [systemMessage]
  if (history.length === 0) {
    messages.push(...FEWSHOT_EXAMPLES)
  }
  messages.push(...history, { role: 'user', content: userMessage })

  return messages
}
