// jsx-runtime 出口：automatic 模式编译器的 import 入口（篇 12 编译器切换）
// 用法：在 .tsx 文件首行加 /* @jsxImportSource ../src */，JSX 就编译到本文件
// 真实源码对照：packages/react/jsx-runtime.js（一行出口转发到 src/jsx/ReactJSX）
import type {
  ComponentType,
  MemoType,
  Props,
  ProviderType,
  SuspenseType
} from './jsx'
import type { ReactElement } from './jsx'
import { jsx, jsxs } from './jsx'

export { jsx, jsxs }
export type {
  ComponentType,
  MemoType,
  Props,
  ProviderType,
  ReactElement,
  SuspenseType
}

// JSX 命名空间：@types/react 19 移除了全局 JSX，自研 runtime 需自带声明。
// ElementType 除宿主标签与函数组件外，还要容纳 memo/Provider/Suspense
// 这类「对象形态」的元素 type（$$typeof 符号识别，见 jsx/index.ts）
export namespace JSX {
  export type Element = ReactElement
  export type ElementType =
    | string
    | ComponentType<never>
    | MemoType
    | ProviderType<unknown>
    | SuspenseType
  export interface IntrinsicElements {
    // input 的 onChange 补事件形态：原生事件（无合成事件系统），让受控
    // 输入的回调参数获得推断；其余标签走索引签名（props 形态见 jsx/index.ts）
    input: Props & {
      onChange?: (event: { target: { value: string } }) => void
    }
    [element: string]: Props
  }
  // Suspense 等对象形态的 type 不是函数：props 按 IntrinsicAttributes 检查
  export interface IntrinsicAttributes extends Props {}
}
