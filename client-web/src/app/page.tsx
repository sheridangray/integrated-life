import { redirect } from 'next/navigation'
import { AuthRedirect } from '@/components/features/auth-redirect'

export default function HomePage() {
	return <AuthRedirect />
}
