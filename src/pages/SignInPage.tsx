import { useNavigate } from 'react-router-dom'
import { AuthForm } from '@/components/auth/AuthForm'

export default function SignInPage() {
  const navigate = useNavigate()

  const handleSuccess = () => {
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <AuthForm mode="signin" onSuccess={handleSuccess} />
    </div>
  )
}