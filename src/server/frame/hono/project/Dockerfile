# 教程 §8 原样：deps（frozen install）→ build（generate + bundle）→ slim 运行时
# Prisma 7 无 Rust 引擎：generate 产物随 bun build 打进 dist，运行时不下载 binary engines
FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM oven/bun:1 AS build
WORKDIR /app
COPY --from=deps /app/node_modules node_modules
COPY . .
# prisma.config.ts 在加载期即解析 env('DATABASE_URL')（Prisma 7 config 约定）；
# generate 不连库，占位值只需格式合法——真实值由运行时 compose/部署环境注入
ENV DATABASE_URL=postgres://placeholder:placeholder@localhost:5432/placeholder
RUN bunx prisma generate
RUN bun build ./src/index.ts --target bun --outdir dist

FROM oven/bun:1-slim
WORKDIR /app
COPY --from=build /app/dist dist
# 迁移目录：migrate deploy 需要
COPY --from=build /app/prisma prisma
COPY --from=build /app/prisma.config.ts ./
# prisma CLI 已移入 dependencies
COPY --from=build /app/node_modules node_modules
EXPOSE 3000
CMD ["bun", "dist/index.js"]
