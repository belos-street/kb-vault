-- 02-customer-service 数据底座（bun run db:seed 幂等执行本文件）
--
-- 设计要点：
--   1. 20 条订单种子 = 5 固定用户（u_001~u_005）× 各 4 单，状态覆盖
--      已支付 / 已发货 / 已签收 / 退款中 —— 数据固定，Few-shot 与评估用例的
--      期望输出才能稳定（同 01 项目的 Mock 思想）。
--   2. 刻意留两个数据坑（考察 Agent 是否如实告知矛盾而非编造）：
--      坑 A  SO-2026-0702：状态「已发货」但 tracking_number 为 NULL（缺物流单号）
--      坑 B  SO-2026-0950：created_at 为昨天，状态却已是「已签收」（状态矛盾）
--   3. 时间戳以 seed 运行时刻为基准做相对偏移（now() - INTERVAL），
--      保证「已签收 6 天」「7 天无理由窗口内」等语义不随重跑时间漂移。
--   4. 与 LangGraph checkpoint 表（checkpoints 等 4 张）同库不同表，互不干扰。

DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS orders;

CREATE TABLE orders (
  order_id        TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL,
  item_name       TEXT NOT NULL,
  amount          NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  status          TEXT NOT NULL CHECK (status IN ('已支付', '已发货', '已签收', '退款中')),
  tracking_number TEXT,        -- 坑 A：已发货订单刻意留 NULL
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at    TIMESTAMPTZ, -- 仅已签收（含退款中的历史签收）订单有值
  refund_reason   TEXT         -- 仅退款中订单有值
);

CREATE INDEX idx_orders_user_id ON orders (user_id);

COMMENT ON TABLE orders IS '订单表（seed 固定数据：5 用户 × 4 单，含两个刻意数据坑）';
COMMENT ON COLUMN orders.order_id IS '订单号（SO-2026-XXXX）';
COMMENT ON COLUMN orders.user_id IS '所属用户（u_001~u_005），工具层凭 config.context.userId 做权限约束';
COMMENT ON COLUMN orders.amount IS '实付金额（NUMERIC 字符串返回，避免浮点误差）';
COMMENT ON COLUMN orders.status IS '订单状态：已支付 / 已发货 / 已签收 / 退款中';
COMMENT ON COLUMN orders.tracking_number IS '物流单号（发货后录入；坑 A 为 NULL）';
COMMENT ON COLUMN orders.delivered_at IS '签收时间（退款时效判定的窗口起点）';
COMMENT ON COLUMN orders.refund_reason IS '退款原因（仅退款中订单）';

CREATE TABLE tickets (
  id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    TEXT NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('refund', 'logistics', 'account', 'complaint', 'other')),
  summary    TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'escalated', 'resolved')),
  transcript TEXT,             -- 会话摘要（由模型基于对话生成）
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tickets_user_id ON tickets (user_id);
CREATE INDEX idx_tickets_status ON tickets (status);

COMMENT ON TABLE tickets IS '工单表（初始为空，由 create_ticket 工具写入；bun run tickets:list 查看队列）';
COMMENT ON COLUMN tickets.id IS '自增主键，对外展示为 TK-0001 形态（TK- + 四位补零）';
COMMENT ON COLUMN tickets.status IS '工单状态：open（待处理）/ escalated（已升级人工）/ resolved（已解决）';
COMMENT ON COLUMN tickets.transcript IS '创建工单时的会话摘要';

-- ============ 订单种子（5 用户 × 4 单 = 20 条） ============

INSERT INTO orders (order_id, user_id, item_name, amount, status, tracking_number, created_at, delivered_at, refund_reason) VALUES
-- u_001（CLI 演示用户：SO-2026-0812 空气炸锅为 README 走查主单）
('SO-2026-0812', 'u_001', '空气炸锅',     299.00, '已签收', 'SF2026081200', now() - INTERVAL '12 days', now() - INTERVAL '6 days',  NULL),
('SO-2026-0755', 'u_001', '无线蓝牙耳机', 199.00, '已发货', 'SF2026075500', now() - INTERVAL '5 days',  NULL,                       NULL),
('SO-2026-0901', 'u_001', '保温杯',       59.00,  '已支付', NULL,           now() - INTERVAL '1 day',   NULL,                       NULL),
('SO-2026-0833', 'u_001', '电动牙刷',     129.00, '退款中', 'SF2026083300', now() - INTERVAL '8 days',  now() - INTERVAL '4 days',  '七天无理由退货'),
-- u_002
('SO-2026-0760', 'u_002', '运动水壶',     45.00,  '已签收', 'YT2026076000', now() - INTERVAL '15 days', now() - INTERVAL '10 days', NULL), -- 签收超 7 天：不可无理由退
('SO-2026-0702', 'u_002', '桌面加湿器',   89.00,  '已发货', NULL,           now() - INTERVAL '4 days',  NULL,                       NULL), -- 坑 A：已发货但缺物流单号
('SO-2026-0855', 'u_002', '手机壳',       29.00,  '已支付', NULL,           now() - INTERVAL '2 days',  NULL,                       NULL),
('SO-2026-0915', 'u_002', '充电宝',       99.00,  '退款中', 'YT2026091500', now() - INTERVAL '3 days',  now() - INTERVAL '1 day',   '发错颜色'),
-- u_003
('SO-2026-0950', 'u_003', '游戏鼠标',     149.00, '已签收', 'JD2026095000', now() - INTERVAL '1 day',   now() - INTERVAL '3 hours', NULL), -- 坑 B：昨天下单今天已签收（状态矛盾）
('SO-2026-0870', 'u_003', '咖啡机',       599.00, '已发货', 'JD2026087000', now() - INTERVAL '3 days',  NULL,                       NULL),
('SO-2026-0820', 'u_003', '鼠标垫',       25.00,  '已签收', 'JD2026082000', now() - INTERVAL '8 days',  now() - INTERVAL '4 days',  NULL),
('SO-2026-0801', 'u_003', '显示器支架',   119.00, '已支付', NULL,           now() - INTERVAL '2 days',  NULL,                       NULL),
-- u_004
('SO-2026-0910', 'u_004', '蓝牙音箱',     179.00, '已签收', 'EMS2026091000', now() - INTERVAL '9 days', now() - INTERVAL '3 days',  NULL),
('SO-2026-0880', 'u_004', '电子书阅读器', 899.00, '已发货', 'EMS2026088000', now() - INTERVAL '6 days', NULL,                       NULL),
('SO-2026-0840', 'u_004', 'USB-C 扩展坞', 159.00, '退款中', 'EMS2026084000', now() - INTERVAL '6 days', now() - INTERVAL '2 days',  '兼容性问题'),
('SO-2026-0790', 'u_004', '桌面收纳盒',   39.00,  '已支付', NULL,            now() - INTERVAL '3 days', NULL,                       NULL),
-- u_005
('SO-2026-0905', 'u_005', '智能手环',     249.00, '已签收', 'YT2026090500', now() - INTERVAL '6 days',  now() - INTERVAL '1 day',   NULL),
('SO-2026-0875', 'u_005', '无线充电板',   79.00,  '已发货', 'YT2026087500', now() - INTERVAL '2 days',  NULL,                       NULL),
('SO-2026-0835', 'u_005', '便携小风扇',   49.00,  '已支付', NULL,           now() - INTERVAL '1 day',   NULL,                       NULL),
('SO-2026-0780', 'u_005', '防蓝光眼镜',   69.00,  '退款中', 'YT2026078000', now() - INTERVAL '9 days',  now() - INTERVAL '5 days',  '镜片度数不符');
