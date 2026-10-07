# 数据结构 Playground —— 408 备考练习册
# 用法（在 playground 目录下）：
#   make                          编译全部练习（不含 solutions —— 先做再看）
#   make run EX=ex01-complexity-lab  编译并运行单个练习（自动在各章查找）
#   make solutions                编译并运行全部答案自检（全绿 = 练习可解）
#   make clean                    清理 build/

CC     := clang
CFLAGS := -std=c11 -Wall -g
BUILD  := build

EX_SRCS := $(wildcard ch0*/*.c)
EX_BINS := $(EX_SRCS:%.c=$(BUILD)/%)

.PHONY: all run solutions clean

all: $(EX_BINS)

$(BUILD)/%: %.c
	@mkdir -p $(dir $@)
	$(CC) $(CFLAGS) $< -o $@

run:
ifndef EX
	$(error 用法: make run EX=ex01-complexity-lab)
endif
	@mkdir -p $(BUILD)
	@src=$$(find ch0* -name "$(EX).c" | head -n 1); \
	if [ -z "$$src" ]; then echo "❌ 找不到练习 $(EX).c"; exit 1; fi; \
	echo "── 编译并运行 $$src ──"; \
	$(CC) $(CFLAGS) $$src -o $(BUILD)/$(EX) && ./$(BUILD)/$(EX)

# 答案自检：solutions 不进默认构建范围，"先做再看"靠机制不靠自觉
solutions:
	@mkdir -p $(BUILD)
	@pass=0; fail=0; \
	for src in solutions/*.c; do \
		bin=$(BUILD)/$$(basename $$src .c); \
		if $(CC) $(CFLAGS) $$src -o $$bin && $$bin > /dev/null; then \
			pass=$$((pass + 1)); \
		else \
			fail=$$((fail + 1)); echo "❌ 自检失败: $$src"; \
		fi; \
	done; \
	echo "── solutions 自检: $$pass 通过 / $$fail 失败 ──"; \
	[ $$fail -eq 0 ]

clean:
	rm -rf $(BUILD)
