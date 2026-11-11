import type { Chapter } from '../data/types.ts'
import { projects } from '../data/projects.ts'
import {
  allLessons,
  depthCounts,
  liveLessons,
  totalMinutes
} from '../data/syllabus.ts'

export function Home({
  chapters,
  done,
  onOpen
}: {
  chapters: Chapter[]
  done: Set<string>
  onOpen: (id: string) => void
}) {
  const first = liveLessons[0]
  const slices = liveLessons

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-copy">
          <div className="hero-kicker">
            AI Agent 全栈工程师养成计划 · 工程实战版
          </div>
          <h1>
            从「能跑」到「能上线」
            <br />
            <span>一次只加一个变量</span>
          </h1>
          <p className="hero-lead">
            49 篇规划。阶段一已完结：1.1 调用 → 1.2 服务 → 1.3 Prompt 契约 → 1.4
            工具循环；另有 2.3 工具与输出契约、3.1 零中间件检索两篇纵切。
            每篇只回答一个问题：这一章新增的变量是什么，上一章的代码还差哪一块。
          </p>
          <div className="hero-actions">
            {first ? (
              <button
                type="button"
                className="hero-cta"
                onClick={() => onOpen(first.id)}>
                从 {first.number} 开始
                <span aria-hidden="true">→</span>
              </button>
            ) : null}
            <button
              type="button"
              className="hero-secondary"
              onClick={() => {
                document
                  .getElementById('slice')
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}>
              先看已上线 {liveLessons.length} 篇
            </button>
          </div>
          <div className="hero-stats">
            <div>
              <strong>{chapters.length}</strong>
              <span>阶段</span>
            </div>
            <div>
              <strong>{allLessons.length}</strong>
              <span>篇规划</span>
            </div>
            <div>
              <strong>{depthCounts.精讲}</strong>
              <span>精讲</span>
            </div>
            <div>
              <strong>{liveLessons.length}</strong>
              <span>篇已上线</span>
            </div>
            <div>
              <strong>{Math.round(totalMinutes / 60)}</strong>
              <span>小时课程</span>
            </div>
            <div>
              <strong>{projects.length}</strong>
              <span>实战项目</span>
            </div>
          </div>
        </div>

        <aside className="hero-card" aria-label="每篇的五栏执行卡">
          <div className="hero-card-head">
            <span className="hero-card-tag">每篇一张执行卡</span>
            <span className="hero-card-dot" />
          </div>
          <div className="hero-card-row">
            <span>本篇变量</span>
            <strong>只加一个</strong>
          </div>
          <div className="hero-card-row">
            <span>不改什么</span>
            <strong>上一章代码</strong>
          </div>
          <div className="hero-card-row">
            <span>产物</span>
            <strong>可运行 + 可演示</strong>
          </div>
          <div className="hero-card-row">
            <span>验收</span>
            <strong>3 条可断言</strong>
          </div>
          <div className="hero-card-row">
            <span>面试</span>
            <strong>能说出取舍</strong>
          </div>
          <div className="hero-card-foot">
            阶段一 1.1–1.4 已完结，2.3 / 3.1 纵切已上线
          </div>
        </aside>
      </section>

      <section className="slice" id="slice" aria-labelledby="slice-title">
        <div className="section-head">
          <div>
            <span className="section-kicker">已上线</span>
            <h2 id="slice-title">{liveLessons.length} 篇先跑通三个阶段</h2>
          </div>
          <span className="section-note">
            阶段一 4 篇 · 工具契约 · 零中间件
          </span>
        </div>

        <div className="slice-grid">
          {slices.map((item, index) => (
            <button
              type="button"
              key={item.id}
              className="slice-card"
              onClick={() => onOpen(item.id)}>
              <span className="slice-index">0{index + 1}</span>
              <span className="slice-number">{item.number}</span>
              <strong>{item.title}</strong>
              <p>{item.tagline}</p>
              <span className="slice-meta">
                {item.depth} · {item.minutes} 分钟 · {item.points.length}{' '}
                个知识点
              </span>
              <span className="slice-variable">变量：{item.variable}</span>
              <span className="slice-arrow" aria-hidden="true">
                →
              </span>
            </button>
          ))}
        </div>
      </section>

      <section
        className="projects"
        id="projects"
        aria-labelledby="projects-title">
        <div className="section-head">
          <div>
            <span className="section-kicker">项目生长链</span>
            <h2 id="projects-title">8 个项目，两条生长链</h2>
          </div>
          <span className="section-note">每版只加一个变量</span>
        </div>

        <div className="project-grid">
          {projects.map((project) => (
            <button
              key={project.id}
              type="button"
              className="project-card"
              onClick={() => onOpen(project.startLessonId)}>
              <div className="project-card-head">
                <span className={`project-kind ${project.kind}`}>
                  {project.kind === 'growth' ? '生长链' : '独立项目'}
                </span>
                <span className="project-stages">
                  {project.stages.join(' → ')}
                </span>
              </div>
              <strong>{project.name}</strong>
              <p>{project.description}</p>
              <div className="project-card-foot">
                <span>{project.landingCount} 篇落点</span>
                <span>{project.artifact}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="how" aria-labelledby="how-title">
        <div className="section-head">
          <div>
            <span className="section-kicker">阅读方式</span>
            <h2 id="how-title">每篇按同一节奏推进</h2>
          </div>
        </div>
        <div className="how-grid">
          <div className="how-card">
            <span>01</span>
            <strong>先跑通</strong>
            <p>照抄最小示例，改一个参数，观察输出怎么变。</p>
          </div>
          <div className="how-card">
            <span>02</span>
            <strong>再看边界</strong>
            <p>看五栏卡：本篇变量、不改什么、3 条验收与面试可答。</p>
          </div>
          <div className="how-card">
            <span>03</span>
            <strong>最后做练习</strong>
            <p>按基础 / 改造 / 排障 / 设计四级递进，先自测再看解析。</p>
          </div>
        </div>
      </section>

      <section className="map" aria-labelledby="map-title">
        <div className="section-head">
          <div>
            <span className="section-kicker">课程地图</span>
            <h2 id="map-title">11 个阶段，49 篇</h2>
          </div>
          <span className="section-note">
            阶段一 4 篇已完结，其余按阶段补齐
          </span>
        </div>

        <div className="chapter-grid">
          {chapters.map((chapter) => {
            const live = chapter.lessons.filter((item) => item.live).length
            const finished = chapter.lessons.filter((item) =>
              done.has(item.id)
            ).length
            return (
              <article key={chapter.id} className="chapter-card">
                <header className="chapter-head">
                  <div>
                    <div className="chapter-label">
                      {chapter.label}
                      <span
                        className={`chapter-status${live > 0 ? ' live' : ''}`}>
                        {live > 0 ? `${live} 篇已上线` : '待更新'}
                      </span>
                    </div>
                    <h3>{chapter.title}</h3>
                    <p>{chapter.goal}</p>
                  </div>
                  <div className="chapter-progress">
                    <strong>
                      {finished}
                      <i>/{chapter.lessons.length}</i>
                    </strong>
                    <span>篇完成</span>
                  </div>
                </header>

                <ul className="lesson-list">
                  {chapter.lessons.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        className={`lesson-row${
                          done.has(item.id) ? ' done' : ''
                        }`}
                        onClick={() => onOpen(item.id)}>
                        <span className="lesson-num">{item.number}</span>
                        <span className="lesson-main">
                          <strong>
                            {item.title}
                            <span
                              className={`depth-badge depth-${item.depth === '精讲' ? 'deep' : item.depth === '速过' ? 'fast' : 'intro'}`}>
                              {item.depth}
                            </span>
                            {done.has(item.id) ? (
                              <i className="lesson-check">✓</i>
                            ) : null}
                          </strong>
                          <small>{item.tagline}</small>
                        </span>
                        <span className="lesson-meta">
                          {item.points.length} 个知识点 · {item.minutes} 分钟
                        </span>
                        {item.live ? (
                          <span className="lesson-arrow" aria-hidden="true">
                            →
                          </span>
                        ) : (
                          <span className="lesson-badge">待更新</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
