import { useEffect, useState } from 'react'

/** 写入 localStorage 失败时由 progress.ts 派发事件，这里统一提示。 */
export function StorageWarning() {
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const onError = () => setFailed(true)
    window.addEventListener('lexio:storage-error', onError)
    return () => window.removeEventListener('lexio:storage-error', onError)
  }, [])

  if (!failed) return null

  return (
    <p className="notice storage-warning" role="alert">
      本地存储写入失败：刚才的记录没有保存。请先导出
      JSON，再检查浏览器空间或无痕模式。
    </p>
  )
}
