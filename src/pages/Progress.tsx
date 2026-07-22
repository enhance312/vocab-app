import { useApp } from '../store/AppContext'

const DAYS = Array.from({ length: 30 }, (_, i) => i + 1)
const weekHeaders = ['一', '二', '三', '四', '五', '六', '日']

export default function Progress() {
  const { progress, jumpToDay } = useApp()

  if (!progress) return null

  function getStatus(day: number): 'done' | 'partial' | 'future' | 'current' {
    if (progress!.completedDays.includes(day)) return 'done'
    if (day < progress!.currentDay) return 'partial'
    if (day === progress!.currentDay) return 'current'
    return 'future'
  }

  function statusColor(status: ReturnType<typeof getStatus>) {
    switch (status) {
      case 'done': return 'bg-[var(--color-success)] text-white'
      case 'partial': return 'bg-amber-50 text-[var(--color-accent)] border border-amber-200'
      case 'current': return 'bg-[var(--color-accent)] text-white'
      case 'future': return 'bg-stone-100 text-stone-300'
    }
  }

  return (
    <div className="flex flex-col gap-6 pt-4">
      <header>
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">学习进度</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          已完成 {progress.completedDays.length} / 30 天
        </p>
      </header>

      <div>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {weekHeaders.map(w => (
            <div key={w} className="text-center text-xs text-stone-300 py-1">{w}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: (DAYS[0] - 1) % 7 }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {DAYS.map(day => {
            const status = getStatus(day)
            return (
              <button
                key={day}
                onClick={() => jumpToDay(day)}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm font-medium transition-all active:scale-95 ${statusColor(status)}`}
              >
                <span className="text-xs">{day}</span>
                {status === 'done' && <span className="text-[10px]">✓</span>}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex gap-4 justify-center text-xs text-[var(--color-text-secondary)]">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-[var(--color-success)]" /> 已完成
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-amber-50 border border-amber-200" /> 未完成
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-[var(--color-accent)]" /> 今天
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-stone-100" /> 未开始
        </span>
      </div>

      <div className="bg-[var(--color-card-bg)] rounded-xl p-4 shadow-sm border border-[var(--color-border)]">
        <p className="text-sm text-[var(--color-text-secondary)] mb-2">总体进度</p>
        <div className="w-full bg-stone-200 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-[var(--color-success)] rounded-full transition-all"
            style={{ width: `${(progress.completedDays.length / 30) * 100}%` }}
          />
        </div>
        <p className="text-xs text-[var(--color-text-secondary)] mt-2 text-right">
          {Math.round((progress.completedDays.length / 30) * 100)}%
        </p>
      </div>
    </div>
  )
}
