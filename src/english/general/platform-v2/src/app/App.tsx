import { GrammarPage } from './pages/GrammarPage.tsx'
import { HomePage } from './pages/HomePage.tsx'
import { LessonPage } from './pages/LessonPage.tsx'
import { ReviewPage } from './pages/ReviewPage.tsx'
import { useRoute } from './router.ts'

export function App() {
  const route = useRoute()

  if (route.name === 'grammar') {
    return <GrammarPage />
  }

  if (route.name === 'review') {
    return <ReviewPage />
  }

  if (route.name === 'lesson') {
    return <LessonPage key={route.id} id={route.id} />
  }

  return <HomePage />
}
