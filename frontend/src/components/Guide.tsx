import { useNavigate } from 'react-router'
import { guideTasks } from '@/lib/guide'
import { hi } from '@/lib/vocab'
import { Bi } from './Bi'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'

export default function Guide({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const navigate = useNavigate()
  const tasks = guideTasks()
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="guide-drawer top-0 right-0 left-auto h-dvh w-[420px] max-w-[92vw] translate-x-0 translate-y-0 gap-2 overflow-y-auto rounded-none border-l border-border p-6 sm:max-w-[420px] data-open:slide-in-from-right-4 data-closed:slide-out-to-right-4">
      <DialogHeader>
        <DialogTitle className="text-lg"><Bi en="Guide" hi={hi.guide} /></DialogTitle>
        <DialogDescription>What an investigator does here, one step at a time. Each step opens the right page with the right records.</DialogDescription>
      </DialogHeader>
      <ol className="guide-tasks">{tasks.map((task, i) => <li key={task.title}>
        <button type="button" className="guide-task" disabled={!task.to} onClick={() => { if (task.to) { navigate(task.to); onOpenChange(false) } }}>
          <span className="step">Step {i + 1}</span><b>{task.title}</b><span>{task.to ? task.blurb : 'Nothing in these records fits this task yet.'}</span>
        </button>
      </li>)}</ol>
    </DialogContent>
  </Dialog>
}
