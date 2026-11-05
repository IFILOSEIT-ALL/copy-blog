'use client'

import { ANIMATION_DELAY } from '@/consts'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { useEffect, useRef, useState } from 'react'
import { useSize } from '@/hooks/use-size'

interface Props {
	className?: string
	order: number
	width: number
	height?: number
	x: number
	y: number
	children: React.ReactNode
}

export default function Card({ children, order, width, height, x, y, className }: Props) {
	const { maxSM, init } = useSize()
	const cardRef = useRef<HTMLDivElement>(null)
	let [show, setShow] = useState(false)
	if (maxSM && init) order = 0

	useEffect(() => {
		if (show) return
		if (x === 0 && y === 0) return
		setTimeout(
			() => {
				setShow(true)
			},
			order * ANIMATION_DELAY * 1000
		)
	}, [x, y, show])

	useEffect(() => {
		if (!show) return
		const card = cardRef.current
		if (!card) return

		const blockCardTap = (event: PointerEvent) => {
			const target = event.target
			if (target instanceof Element && target.closest('[data-card-tap="ignore"]')) {
				event.stopImmediatePropagation()
			}
		}

		card.addEventListener('pointerdown', blockCardTap, true)
		return () => card.removeEventListener('pointerdown', blockCardTap, true)
	}, [show])

	if (show)
		return (
			<motion.div
				ref={cardRef}
				className={cn('card squircle', className)}
				initial={{ opacity: 0, scale: 0.6, left: x, top: y, width, height }}
				animate={{ opacity: 1, scale: 1, left: x, top: y, width, height }}
				whileHover={{ scale: 1.05 }}
				whileTap={{ scale: 0.95 }}>
				{children}
			</motion.div>
		)

	return null
}
