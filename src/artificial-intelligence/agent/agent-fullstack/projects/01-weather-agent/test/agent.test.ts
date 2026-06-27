import { describe, it, expect, spyOn } from "bun:test";
import { openai, runReAct } from "../src/agent/re-act.js";
import { ShortTermMemory } from "../src/memory/short-term.js";

function createChatCompletion(content: string, toolCalls?: unknown[]) {
  return {
    choices: [
      {
        message: {
          role: "assistant",
          content,
          tool_calls: toolCalls,
        },
      },
    ],
  } as unknown as Awaited<ReturnType<typeof openai.chat.completions.create>>;
}

describe("runReAct", () => {
  it("should return direct response for non-tool query", async () => {
    const spy = spyOn(openai.chat.completions, "create");
    spy.mockResolvedValue(createChatCompletion("你好！有什么可以帮你的？"));

    const result = await runReAct({ query: "你好", useRag: false });
    expect(result.step.response).toBe("你好！有什么可以帮你的？");
    expect(result.step.actions).toHaveLength(0);
    expect(result.usedRag).toBe(false);

    spy.mockRestore();
  });

  it("should execute get_weather tool when requested", async () => {
    const spy = spyOn(openai.chat.completions, "create");
    spy
      .mockResolvedValueOnce(
        createChatCompletion("需要查询北京天气", [
          {
            id: "call_1",
            type: "function",
            function: { name: "get_weather", arguments: '{"city":"北京"}' },
          },
        ])
      )
      .mockResolvedValueOnce(createChatCompletion("北京今天晴，25°C。"));

    const result = await runReAct({ query: "北京天气", useRag: false });
    expect(result.step.actions).toHaveLength(1);
    expect(result.step.actions[0].function.name).toBe("get_weather");
    expect(result.step.observations).toHaveLength(1);
    expect(JSON.parse(result.step.observations[0]).city).toBe("北京");
    expect(result.step.response).toBe("北京今天晴，25°C。");

    spy.mockRestore();
  });

  it("should use memory for context completion", async () => {
    const spy = spyOn(openai.chat.completions, "create");
    spy.mockResolvedValue(createChatCompletion("上海今天多云，22°C。"));

    const memory = new ShortTermMemory();
    memory.setLastQueryCity("上海");

    const result = await runReAct({ query: "今天多少度？", memory, useRag: false });
    expect(memory.getMessages()).toHaveLength(2);
    expect(memory.getMessages()[0].content).toBe("今天多少度？");
    expect(result.step.response).toBe("上海今天多云，22°C。");

    spy.mockRestore();
  });
});
