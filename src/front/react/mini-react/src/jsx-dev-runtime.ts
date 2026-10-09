// jsx-dev-runtime 出口：vite dev 模式编译器的 import 入口。
// dev 编译产物调用 jsxDEV（额外携带 __source/__self 定位参数，本实现忽略——
// 与生产 jsx 同一函数），真实源码对照：packages/react/jsx-dev-runtime.js
export { jsx, jsxs, jsx as jsxDEV } from './jsx'
