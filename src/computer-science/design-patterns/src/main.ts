import { EditorView, basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorState } from '@codemirror/state';
import { keymap } from '@codemirror/view';
import { runCode } from './runner';
import { exercises } from './exercises/index';
import type { Exercise, Priority } from './types';

// ===== 状态 =====
let currentExercise: Exercise = exercises[0];
let editor: EditorView;

// ===== DOM =====
const $tabs = document.getElementById('tabs')!;
const $meta = document.getElementById('exercise-meta')!;
const $task = document.getElementById('exercise-task')!;
const $hints = document.getElementById('exercise-hints')!;
const $docLink = document.getElementById('doc-link') as HTMLAnchorElement;
const $editorWrap = document.getElementById('editor')!;
const $console = document.getElementById('console-output')!;
const $btnRun = document.getElementById('btn-run')!;
const $btnReset = document.getElementById('btn-reset')!;
const $btnClear = document.getElementById('btn-clear')!;

// ===== 初始化 Tabs =====
function renderTabs(): void {
  const groups: Record<Priority, Exercise[]> = { P0: [], P1: [], P2: [] };
  for (const ex of exercises) {
    groups[ex.priority].push(ex);
  }

  $tabs.innerHTML = '';
  for (const priority of ['P0', 'P1', 'P2'] as Priority[]) {
    const group = document.createElement('div');
    group.className = 'tab-group';

    const label = document.createElement('span');
    label.className = `tab-group-label ${priority.toLowerCase()}`;
    label.textContent = priority;
    group.appendChild(label);

    for (const ex of groups[priority]) {
      const btn = document.createElement('button');
      btn.className = 'tab';
      btn.textContent = ex.nameEn;
      btn.dataset.id = ex.id;
      btn.addEventListener('click', () => selectExercise(ex));
      group.appendChild(btn);
    }

    $tabs.appendChild(group);
  }
}

// ===== 选择练习 =====
function selectExercise(ex: Exercise): void {
  currentExercise = ex;

  // 更新 tab 高亮
  $tabs.querySelectorAll('.tab').forEach((tab) => {
    tab.classList.toggle('active', (tab as HTMLElement).dataset.id === ex.id);
  });

  // 更新左侧面板
  $meta.innerHTML = `
    <span class="badge ${ex.priority.toLowerCase()}">${ex.priority}</span>
    <span class="badge-category">${ex.category}</span>
    <strong>${ex.name}（${ex.nameEn}）</strong>
  `;

  $task.innerHTML = `<h3>📝 练习</h3><p>${ex.task}</p>`;

  $hints.innerHTML = `
    <details>
      <summary>💡 提示（点击展开）</summary>
      <ul>${ex.hints.map((h) => `<li>${h}</li>`).join('')}</ul>
    </details>
  `;

  $docLink.href = `/${ex.docPath.replace('../doc/', '')}`;

  // 更新编辑器
  const saved = localStorage.getItem(`dp-exercise-${ex.id}`);
  setEditorContent(saved ?? ex.starterCode);

  // 清空控制台
  $console.innerHTML = '';
}

// ===== 编辑器 =====
function initEditor(): void {
  const runKeymap = keymap.of([
    {
      key: 'Ctrl-Enter',
      mac: 'Cmd-Enter',
      run: () => {
        handleRun();
        return true;
      },
    },
  ]);

  editor = new EditorView({
    parent: $editorWrap,
    state: EditorState.create({
      doc: currentExercise.starterCode,
      extensions: [
        basicSetup,
        javascript({ typescript: true }),
        oneDark,
        runKeymap,
        EditorView.theme({
          '&': { height: '100%' },
          '.cm-scroller': { overflow: 'auto' },
        }),
      ],
    }),
  });
}

function setEditorContent(content: string): void {
  editor.dispatch({
    changes: {
      from: 0,
      to: editor.state.doc.length,
      insert: content,
    },
  });
}

function getEditorContent(): string {
  return editor.state.doc.toString();
}

// ===== 完成状态 =====
function isCompleted(id: string): boolean {
  return localStorage.getItem(`dp-completed-${id}`) === '1';
}

function setCompleted(id: string, done: boolean): void {
  if (done) {
    localStorage.setItem(`dp-completed-${id}`, '1');
  } else {
    localStorage.removeItem(`dp-completed-${id}`);
  }
  updateTabStatus(id, done);
}

function updateTabStatus(id: string, done: boolean): void {
  const tab = $tabs.querySelector(`.tab[data-id="${id}"]`);
  if (tab) {
    tab.classList.toggle('completed', done);
  }
}

function refreshAllTabStatus(): void {
  for (const ex of exercises) {
    updateTabStatus(ex.id, isCompleted(ex.id));
  }
}

// ===== 运行 =====
async function handleRun(): Promise<void> {
  const code = getEditorContent();

  // 保存到 localStorage
  localStorage.setItem(`dp-exercise-${currentExercise.id}`, code);

  const result = await runCode(code);
  $console.innerHTML = result.logs
    .map((l) => `<span class="${l.type}">${escapeHtml(l.text)}</span>`)
    .join('\n');

  // 无错误时自动标记完成
  const hasError = result.logs.some((l) => l.type === 'error');
  if (!hasError) {
    setCompleted(currentExercise.id, true);
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ===== 事件绑定 =====
$btnRun.addEventListener('click', handleRun);

$btnReset.addEventListener('click', () => {
  localStorage.removeItem(`dp-exercise-${currentExercise.id}`);
  setCompleted(currentExercise.id, false);
  setEditorContent(currentExercise.starterCode);
});

$btnClear.addEventListener('click', () => {
  $console.innerHTML = '';
});

// ===== 启动 =====
renderTabs();
refreshAllTabStatus();
initEditor();
selectExercise(exercises[0]);
