'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Plus, Trash2, X } from 'lucide-react'
import Card from '@/components/card'
import { useCenterStore } from '@/hooks/use-center'
import { useConfigStore } from './stores/config-store'
import { HomeDraggableLayer } from './home-draggable-layer'
import { cn } from '@/lib/utils'

type Todo = {
	id: string
	text: string
	done: boolean
}

const STORAGE_KEY = 'yuvex-home-todos'

function loadTodos(): Todo[] {
	if (typeof localStorage === 'undefined') return []

	try {
		const raw = localStorage.getItem(STORAGE_KEY)
		if (!raw) return []
		const parsed = JSON.parse(raw)
		if (!Array.isArray(parsed)) return []
		return parsed
			.filter(item => item && typeof item.id === 'string' && typeof item.text === 'string')
			.map(item => ({ id: item.id, text: item.text, done: Boolean(item.done) }))
	} catch {
		return []
	}
}

function createId(): string {
	if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
		return crypto.randomUUID()
	}
	return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export default function TodoCard() {
	const center = useCenterStore()
	const { cardStyles } = useConfigStore()
	const styles = cardStyles.todoCard

	const [todos, setTodos] = useState<Todo[]>([])
	const [hydrated, setHydrated] = useState(false)
	const [draft, setDraft] = useState('')
	const [editingId, setEditingId] = useState<string | null>(null)
	const [editingText, setEditingText] = useState('')
	const cancelEditRef = useRef(false)

	useEffect(() => {
		setTodos(loadTodos())
		setHydrated(true)
	}, [])

	useEffect(() => {
		if (!hydrated || typeof localStorage === 'undefined') return
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
		} catch {
			// 忽略存储配额或隐私模式导致的写入失败
		}
	}, [todos, hydrated])

	const remaining = todos.filter(todo => !todo.done).length
	const completed = todos.length - remaining

	const addTodo = () => {
		const text = draft.trim()
		if (!text) return
		setTodos(prev => [{ id: createId(), text, done: false }, ...prev])
		setDraft('')
	}

	const toggleTodo = (id: string) => {
		setTodos(prev => prev.map(todo => (todo.id === id ? { ...todo, done: !todo.done } : todo)))
	}

	const removeTodo = (id: string) => {
		setTodos(prev => prev.filter(todo => todo.id !== id))
	}

	const clearCompleted = () => {
		setTodos(prev => prev.filter(todo => !todo.done))
	}

	const startEditing = (todo: Todo) => {
		cancelEditRef.current = false
		setEditingId(todo.id)
		setEditingText(todo.text)
	}

	const commitEditing = () => {
		if (cancelEditRef.current) {
			cancelEditRef.current = false
			return
		}
		if (!editingId) return
		const text = editingText.trim()
		if (text) {
			setTodos(prev => prev.map(todo => (todo.id === editingId ? { ...todo, text } : todo)))
		}
		setEditingId(null)
		setEditingText('')
	}

	const x = styles.offsetX !== null ? center.x + styles.offsetX : center.x - styles.width / 2
	const y = styles.offsetY !== null ? center.y + styles.offsetY : center.y + 245

	return (
		<HomeDraggableLayer cardKey='todoCard' x={x} y={y} width={styles.width} height={styles.height}>
			<Card order={styles.order} width={styles.width} height={styles.height} x={x} y={y} className='flex flex-col p-4 max-sm:static max-sm:translate-0'>
				<div className='flex items-center justify-between gap-2'>
					<div className='flex min-w-0 items-baseline gap-2'>
						<h2 className='text-secondary shrink-0 text-sm'>待办清单</h2>
						<p className='text-secondary/80 text-[10px] whitespace-nowrap'>
							{remaining} 项未完成 / 共 {todos.length} 项
						</p>
					</div>
					<button
						type='button'
						onClick={clearCompleted}
						disabled={completed === 0}
						data-card-tap='ignore'
						title='清除已完成'
						aria-label='清除已完成'
						className='text-secondary hover:text-brand shrink-0 rounded-lg p-1 transition-colors disabled:cursor-not-allowed disabled:opacity-30'>
						<Trash2 className='size-3.5' />
					</button>
				</div>

				<form
					className='mt-2 flex items-center gap-1.5'
					onSubmit={event => {
						event.preventDefault()
						addTodo()
					}}>
					<input
						value={draft}
						onChange={event => setDraft(event.target.value)}
						placeholder='添加待办，回车确认'
						aria-label='添加待办'
						enterKeyHint='done'
						className='bg-secondary/10 min-w-0 flex-1 rounded-xl border px-2.5 py-1.5 text-xs'
					/>
					<button
						type='submit'
						disabled={!draft.trim()}
						aria-label='添加'
						className='bg-linear grid size-7 shrink-0 place-items-center rounded-xl text-white transition-opacity disabled:opacity-40'>
						<Plus className='size-3.5' />
					</button>
				</form>

				<div className='mt-2 min-h-0 flex-1'>
					{todos.length === 0 ? (
						<div className='text-secondary/70 grid h-full place-items-center text-xs'>还没有待办，添加一件吧</div>
					) : (
						<ul className='thin-scrollbar h-full space-y-1 overflow-y-auto overscroll-contain pr-1'>
							{todos.map(todo => (
								<li key={todo.id} className='group flex items-center gap-2 rounded-xl px-1 py-1 transition-colors hover:bg-white/40'>
									<button
										type='button'
										onClick={() => toggleTodo(todo.id)}
										data-card-tap='ignore'
										aria-label={todo.done ? '标记为未完成' : '标记为已完成'}
										className={cn(
											'flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors',
											todo.done ? 'bg-linear border-transparent text-white' : 'hover:border-brand text-transparent'
										)}>
										<Check className='size-3' />
									</button>

									{editingId === todo.id ? (
										<input
											autoFocus
											value={editingText}
											onChange={event => setEditingText(event.target.value)}
											onBlur={commitEditing}
											onKeyDown={event => {
												if (event.key === 'Enter') {
													event.preventDefault()
													commitEditing()
												}
												if (event.key === 'Escape') {
													cancelEditRef.current = true
													setEditingId(null)
													setEditingText('')
												}
											}}
											aria-label='编辑待办'
											className='bg-secondary/10 min-w-0 flex-1 rounded-lg border px-1.5 py-0.5 text-xs'
										/>
									) : (
										<span
											onDoubleClick={() => startEditing(todo)}
											title='双击编辑'
											className={cn('min-w-0 flex-1 cursor-text text-xs break-words', todo.done && 'text-secondary line-through opacity-60')}>
											{todo.text}
										</span>
									)}

									<button
										type='button'
										onClick={() => removeTodo(todo.id)}
										data-card-tap='ignore'
										title='删除'
										aria-label='删除'
										className='text-secondary/50 hover:text-brand shrink-0 rounded-lg p-0.5 opacity-0 transition-all group-hover:opacity-100 focus-visible:opacity-100 max-sm:opacity-100'>
										<X className='size-3.5' />
									</button>
								</li>
							))}
						</ul>
					)}
				</div>
			</Card>
		</HomeDraggableLayer>
	)
}
