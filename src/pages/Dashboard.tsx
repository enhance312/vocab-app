import { useNavigate } from 'react-router-dom'
import { useApp } from '../store/AppContext'

const sessionIcons: Record<string, string> = {
  morning: '🌅',
  noon: '☀️',
  evening: '🌙',
}

export default function Dashboard() {
  const { progress, tasks, loading } = useApp()
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-[var(--color-text-secondary)] animate-pulse">加载中...</p>
      </div>
    )
  }

  if (!progress) return null

  const allDone = tasks.every(t => t.completed)

  return (
    <div className="flex flex-col gap-6">
      <header className="text-center pt-2">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">托福必考 2000 词</h1>
        <p className="text-[var(--color-text-secondary)] mt-1 text-sm">
          第 <span className="text-[var(--color-accent)] font-bold text-lg">{progress.currentDay}</span> / 30 天
        </p>
        <div className="mt-3 w-full bg-stone-200 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-[var(--color-progress)] rounded-full transition-all duration-700"
            style={{ width: `${((progress.currentDay - 1 + (
              progress.sessionStatus.morning ? 0.33 : 0) +
              (progress.sessionStatus.noon ? 0.33 : 0) +
              (progress.sessionStatus.evening ? 0.34 : 0)
            ) / 30) * 100}%` }}
          />
        </div>
      </header>

      <section>
        <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-3 uppercase tracking-wider">
          今日任务
        </h2>
        <div className="flex flex-col gap-3">
          {tasks.map(task => (
            <button
              key={task.type}
              onClick={() => navigate(`/study/${task.type}`)}
              disabled={task.completed}
              className={`flex items-center gap-4 p-4 rounded-xl text-left transition-all active:scale-[0.98] ${
                task.completed
                  ? 'bg-stone-100 text-stone-300'
                  : 'bg-[var(--color-card-bg)] text-[var(--color-text-primary)] shadow-sm border border-[var(--color-border)] active:bg-stone-50'
              }`}
            >
              <span className="text-2xl">{sessionIcons[task.type]}</span>
              <div className="flex-1">
                <p className="font-medium">{task.label}</p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  List {task.listNumbers.join(', ')}
                  {task.type === 'evening' && task.listNumbers.length === 0 && ' 暂无复习内容'}
                </p>
              </div>
              <span className={`text-xl ${task.completed ? 'text-[var(--color-success)]' : 'text-stone-300'}`}>
                {task.completed ? '✓' : '→'}
              </span>
            </button>
          ))}
        </div>
      </section>

      {allDone && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
          <p className="text-emerald-700 font-medium">🎉 今日任务全部完成！</p>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1">明天继续加油</p>
        </div>
      )}

      {!allDone && (
        <p className="text-center text-xs text-[var(--color-text-secondary)] mt-2">
          按早 → 中 → 晚顺序完成
        </p>
      )}
    </div>
  )
}
