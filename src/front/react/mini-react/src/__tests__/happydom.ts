// bun test 的 DOM 环境预载（bunfig.toml [test].preload 指向本文件）
// GlobalRegistrator 把 happy-dom 的 window / document / Node 等挂上 globalThis
import { GlobalRegistrator } from '@happy-dom/global-registrator'

GlobalRegistrator.register()
