import { test } from 'bun:test'

/**
 * 第 1 步验收：业务规则（纯函数，不依赖模型）。
 */
test.todo('越权查单返回不存在，不泄露订单信息')
test.todo('已签收订单第 7 天仍可退，第 8 天拒绝')
test.todo('refunding / refunded 状态直接拒绝')
test.todo('状态与 deliveredAt 矛盾时如实说明，不编造')
