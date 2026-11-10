import mammoth from 'mammoth'
import TurndownService from 'turndown'
import { strToU8, zipSync } from 'fflate'

// 4.5 解析链路实跑：生成最小 .docx → Mammoth 转 HTML → Turndown 转 Markdown。
// 不提交二进制 fixture：docx 就是一个 zip，运行时用 fflate 现场打包。
// 依赖：bun install && bun run demo:docx

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced'
})

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`

const ROOT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`

const DOC_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
  </w:style>
</w:styles>`

const DOCUMENT = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
      <w:r><w:t>退款政策</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t>七天无理由退款，退款原路退回。</w:t></w:r></w:p>
  </w:body>
</w:document>`

const buildDocx = (): Buffer =>
  Buffer.from(
    zipSync({
      '[Content_Types].xml': strToU8(CONTENT_TYPES),
      '_rels/.rels': strToU8(ROOT_RELS),
      'word/document.xml': strToU8(DOCUMENT),
      'word/styles.xml': strToU8(STYLES),
      'word/_rels/document.xml.rels': strToU8(DOC_RELS)
    })
  )

const parseDocx = async (buffer: Buffer): Promise<string> => {
  const { value, messages } = await mammoth.convertToHtml({ buffer })
  if (messages.length > 0) {
    console.warn('docx 解析告警：', messages.map((m) => m.message).join('; '))
  }
  return turndown.turndown(value)
}

const assert = (condition: boolean, message: string): void => {
  if (!condition) throw new Error(`断言失败：${message}`)
  console.log(`✅ ${message}`)
}

const main = async (): Promise<void> => {
  const markdown = await parseDocx(buildDocx())
  console.log('\n解析结果：\n' + markdown)

  assert(markdown.startsWith('# 退款政策'), '标题层级保留为 Markdown 一级标题')
  assert(markdown.includes('七天无理由退款'), '正文文本完整保留')
  assert(
    !markdown.includes('<p>') && !markdown.includes('<w:'),
    '输出已是 Markdown，无 HTML/XML 残留'
  )
}

await main()
