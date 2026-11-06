import { test } from 'bun:test'

/**
 * 第 1 步验收：裸循环与工具编排。
 * 全部用假模型驱动，不需要 API Key。
 */
test.todo('一次任务里连续两次工具调用，最后返回 final')
test.todo('未知工具不中断循环，observation 含 Unknown tool')
test.todo('arguments 非法 JSON 时转成 observation，不抛栈')
test.todo('一轮多个 tool_calls，每个结果单独回填且顺序正确')
