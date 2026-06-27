import { describe, it, expect } from "bun:test";
import { ShortTermMemory } from "../src/memory/short-term.js";

describe("ShortTermMemory", () => {
  it("should store and retrieve messages", () => {
    const memory = new ShortTermMemory();
    memory.addUserMessage("北京天气怎么样？");
    memory.addAssistantMessage("北京今天晴，25°C。");

    const messages = memory.getMessages();
    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe("user");
    expect(messages[1].role).toBe("assistant");
  });

  it("should track lastQueryCity when city is found in query", () => {
    const memory = new ShortTermMemory();
    const cityFinder = (q: string) => (q.includes("北京") ? "北京" : null);

    const completed = memory.completeQuery("北京今天天气怎么样？", cityFinder);
    expect(completed).toBe("北京今天天气怎么样？");
    expect(memory.getLastQueryCity()).toBe("北京");
  });

  it("should complete omitted city with context", () => {
    const memory = new ShortTermMemory();
    memory.setLastQueryCity("上海");
    const cityFinder = () => null;

    const completed = memory.completeQuery("今天多少度？", cityFinder);
    expect(completed).toContain("上海");
    expect(memory.getLastQueryCity()).toBe("上海");
  });

  it("should add tool results with correct structure", () => {
    const memory = new ShortTermMemory();
    memory.addToolResult("call_1", "get_weather", '{"city":"北京"}');

    const messages = memory.getMessages();
    expect(messages).toHaveLength(1);
    expect(messages[0].role).toBe("tool");
    expect(messages[0].tool_call_id).toBe("call_1");
    expect(messages[0].name).toBe("get_weather");
  });

  it("should trim old messages when exceeding capacity", () => {
    const memory = new ShortTermMemory({ maxMessages: 3 });
    memory.addUserMessage("a");
    memory.addUserMessage("b");
    memory.addUserMessage("c");
    memory.addUserMessage("d");

    expect(memory.getMessages()).toHaveLength(3);
    expect(memory.getMessages()[0].content).toBe("b");
  });

  it("should clear all messages and city", () => {
    const memory = new ShortTermMemory();
    memory.addUserMessage("hi");
    memory.setLastQueryCity("北京");
    memory.clear();

    expect(memory.getMessages()).toHaveLength(0);
    expect(memory.getLastQueryCity()).toBeUndefined();
  });
});
