import { creationalExercises } from './creational'
import { structuralExercises } from './structural'
import { behavioralExercises } from './behavioral'
import { modernExercises } from './modern'
import type { Exercise } from '../types'

const priorityOrder = { P0: 0, P1: 1, P2: 2 } as const

export const exercises: Exercise[] = [
  ...creationalExercises,
  ...structuralExercises,
  ...behavioralExercises,
  ...modernExercises
].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
