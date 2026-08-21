-- ============================================================
-- 电商订单系统 · 主线库 schema（终版）
-- 第 4 章定稿；之后所有章节都在此库上动手
-- 适用版本：PostgreSQL 18+（uuidv7() 为 PG18 内置）
-- 执行：psql -U shop_app -h localhost -d shop -f schema.sql
-- ============================================================

-- ---------- users：用户 ----------
CREATE TABLE users (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email        text NOT NULL,
  display_name text NOT NULL DEFAULT '',
  role         text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz                                -- NULL = 未删除（软删除）
);

-- 软删除 + 唯一约束的配合：只保证"未删除用户"的 email 唯一
CREATE UNIQUE INDEX users_email_unique_active
  ON users (email) WHERE deleted_at IS NULL;

-- ---------- products：商品 ----------
CREATE TABLE products (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name         text NOT NULL,
  price        numeric(12, 2) NOT NULL CHECK (price >= 0),
  is_on_sale   boolean NOT NULL DEFAULT true,
  attributes   jsonb NOT NULL DEFAULT '{}',               -- 商品属性，第 11 章详解
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz
);

-- ---------- inventory：库存（与商品 1:1） ----------
CREATE TABLE inventory (
  product_id bigint PRIMARY KEY REFERENCES products(id),
  stock      integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- orders：订单 ----------
CREATE TABLE orders (
  id           uuid PRIMARY KEY DEFAULT uuidv7(),         -- 对外暴露 → UUIDv7（PG18+）
  user_id      bigint NOT NULL REFERENCES users(id),
  status       text NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'paid', 'cancelled')),
  total_amount numeric(12, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX orders_user_id_idx ON orders (user_id);
CREATE INDEX orders_status_idx ON orders (status);

-- ---------- order_items：订单项（M:N 中间表 + 快照） ----------
CREATE TABLE order_items (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id     uuid NOT NULL REFERENCES orders(id),
  product_id   bigint NOT NULL REFERENCES products(id),
  product_name text NOT NULL,                              -- 快照：下单时的商品名
  unit_price   numeric(12, 2) NOT NULL,                    -- 快照：下单时的单价
  quantity     integer NOT NULL CHECK (quantity > 0),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX order_items_order_id_idx ON order_items (order_id);

-- ---------- payments：支付 ----------
CREATE TABLE payments (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id   uuid NOT NULL REFERENCES orders(id),
  method     text NOT NULL DEFAULT 'card'
             CHECK (method IN ('card', 'alipay', 'wechat')),
  amount     numeric(12, 2) NOT NULL CHECK (amount >= 0),
  status     text NOT NULL DEFAULT 'success'
             CHECK (status IN ('success', 'refunded', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX payments_order_id_idx ON payments (order_id);

-- ---------- updated_at 自动更新（PG 无 ON UPDATE 语法，用触发器） ----------
-- 示例：users / orders。products、inventory、payments 同法补全。
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();