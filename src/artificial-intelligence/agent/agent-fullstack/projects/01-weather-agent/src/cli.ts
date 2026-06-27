/**
 * CLI 交互入口
 * - 交互式命令行读取用户输入
 * - 调用 ReAct Agent 并打印推理过程
 * - 支持 exit 命令退出
 */
import { runReAct } from "./agent/re-act.js";
import { ShortTermMemory } from "./memory/short-term.js";

const memory = new ShortTermMemory({ maxMessages: 20 });

function printWelcome(): void {
  console.log("🌤️  天气助手已启动，输入问题开始对话（输入 exit 退出）\n");
}

function printStep(label: string, content: string): void {
  console.log(`${label} ${content}`);
}

async function main(): Promise<void> {
  printWelcome();

  while (true) {
    const input = prompt("> ");

    if (input === null || input.trim().toLowerCase() === "exit" || input.trim().toLowerCase() === "quit") {
      console.log("\n👋 再见！");
      break;
    }

    const query = input.trim();
    if (!query) {
      continue;
    }

    try {
      const result = await runReAct({ query, memory });
      const { step, usedRag, ragResults } = result;

      // 只有在真正需要调用工具时才打印思考过程
      // 否则 thought 和 response 会重复（如 FAQ、问候等直接回复场景）
      if (step.thought && step.actions.length > 0) {
        printStep("[思考]", step.thought);
      }

      if (usedRag && ragResults.length > 0) {
        printStep("[检索]", `找到 ${ragResults.length} 条相关 FAQ`);
      }

      for (let i = 0; i < step.actions.length; i++) {
        const action = step.actions[i];
        printStep("[调用]", `${action.function.name}(${action.function.arguments})`);
      }

      for (let i = 0; i < step.observations.length; i++) {
        const observation = step.observations[i];
        try {
          const parsed = JSON.parse(observation);
          printStep("[观察]", `${parsed.city} ${parsed.condition}，${parsed.temperature}°C，湿度 ${parsed.humidity}%`);
        } catch {
          printStep("[观察]", observation);
        }
      }

      printStep("[回复]", step.response);
      console.log();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`❌ 发生错误：${message}\n`);
    }
  }
}

main().catch((error) => {
  console.error("CLI 异常：", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
