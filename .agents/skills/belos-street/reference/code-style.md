# Code Style

个人编码习惯 - 代码风格配置

## Prettier Configuration

```json
{
  "$schema": "https://json.schemastore.org/prettierrc",
  "arrowParens": "always",
  "bracketSpacing": true,
  "embeddedLanguageFormatting": "auto",
  "htmlWhitespaceSensitivity": "ignore",
  "insertPragma": false,
  "bracketSameLine": true,
  "jsxSingleQuote": false,
  "printWidth": 80,
  "proseWrap": "preserve",
  "quoteProps": "as-needed",
  "requirePragma": false,
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "none",
  "useTabs": false,
  "endOfLine": "lf"
}
```

## Rule Explanations

### quotes

使用单引号：

```ts
// ✅ Good
const name = 'John'
const obj = { name: 'John' }

// ❌ Bad
const name = "John"
const obj = { name: "John" }
```

### semi

不使用分号：

```ts
// ✅ Good
const count = 0
const increment = () => {
  count++
}

// ❌ Bad
const count = 0;
const increment = () => {
  count++;
};
```

### trailingComma

不使用尾随逗号：

```ts
// ✅ Good
const obj = {
  name: 'John',
  age: 30
}

const fn = (a, b, c) => {
  return a + b + c
}

// ❌ Bad
const obj = {
  name: 'John',
  age: 30,
}

const fn = (a, b, c,) => {
  return a + b + c
}
```

### tabWidth

使用 2 空格缩进：

```ts
// ✅ Good
function greet() {
  const message = 'Hello'
  console.log(message)
}

// ❌ Bad (4 spaces)
function greet() {
    const message = 'Hello'
    console.log(message)
}
```

### useTabs

不使用 Tab，使用空格：

```ts
// ✅ Good (spaces)
const indent = '  '

// ❌ Bad (tab)
const indent = '\t'
```

### printWidth

行宽限制 80 字符：

```ts
// ✅ Good (≤ 80 chars)
const greeting = 'Hello, welcome to my application!'

// ❌ Bad (> 80 chars)
const greeting = 'Hello, welcome to my application! Thanks for using our service.'
```

### arrowParens

箭头函数参数始终加括号：

```ts
// ✅ Good
const add = (a, b) => a + b
const greet = (name) => `Hello, ${name}`

// ❌ Bad
const add = a, b => a + b
const greet = name => `Hello, ${name}`
```

### bracketSpacing

对象括号内加空格：

```ts
// ✅ Good
const obj = { name: 'John', age: 30 }

// ❌ Bad
const obj = {name: 'John', age: 30}
```

### bracketSameLine

多行 JSX 标签闭合括号放在同一行：

```tsx
// ✅ Good
<Component
  prop1="value"
  prop2="value">
  {children}
</Component>

// ❌ Bad (括号单独放一行)
<Component
  prop1="value"
  prop2="value"
>
  {children}
</Component>
```

### jsxSingleQuote

JSX 使用双引号：

```tsx
// ✅ Good
<Input type="text" placeholder="Enter name" />

// ❌ Bad
<Input type='text' placeholder='Enter name' />
```

### quoteProps

对象属性引号按需使用：

```ts
// ✅ Good (不需要引号时省略)
const obj = { name: 'John', age: 30 }

// ✅ Good (需要引号时添加)
const obj = { 'my-property': 'value', 'with-dash': true }
```

### htmlWhitespaceSensitivity

HTML 空格敏感度设置为 "ignore"：

```html
<!-- 空格不影响渲染 -->
<span>Hello</span> <span>World</span>
```

### proseWrap

Markdown 不自动换行：

```markdown
<!-- 保持原样，不强制换行 -->
这是一段很长的文字，会按照原始格式保留，不会被 Prettier 自动换行。
```

### endOfLine

使用 LF 换行符（Unix/Linux/Mac）：

| 系统 | 换行符 |
|------|--------|
| Windows | CRLF (\r\n) |
| Unix/Linux/Mac | LF (\n) |

### embeddedLanguageFormatting

自动格式化嵌入的语言（如 Vue SFC 中的 TypeScript）：

```vue
// ✅ Good
<script setup lang="ts">
const name: string = 'John'
</script>
```

## ESLint 配合

如果使用 ESLint，建议关闭与 Prettier 冲突的规则：

```js
// .eslintrc.js
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier' // 必须在最后，用于关闭冲突规则
  ],
  rules: {
    'prettier/prettier': 'error'
  }
}
```

## VS Code 配置

在 VS Code 中启用 Prettier：

```json
// .vscode/settings.json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[jsonc]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

## 风格速查表

| 规则 | 值 | 说明 |
|------|-----|------|
| `singleQuote` | `true` | 使用单引号 |
| `semi` | `false` | 不使用分号 |
| `trailingComma` | `none` | 不使用尾随逗号 |
| `tabWidth` | `2` | 2 空格缩进 |
| `printWidth` | `80` | 行宽 80 字符 |
| `arrowParens` | `always` | 箭头函数始终加括号 |
| `bracketSpacing` | `true` | 对象括号内加空格 |
| `bracketSameLine` | `true` | 多行 JSX 闭合括号同 line |
| `jsxSingleQuote` | `false` | JSX 使用双引号 |
| `endOfLine` | `lf` | Unix 换行符 |
