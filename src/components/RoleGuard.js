'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function RoleGuard({ children, allowedRoles }) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated' && !allowedRoles.includes(session.user.role)) {
      router.push('/')
    }
  }, [status, session, allowedRoles, router])

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  if (status === 'authenticated' && allowedRoles.includes(session.user.role)) {
    return <>{children}</>
  }

  return null
} 