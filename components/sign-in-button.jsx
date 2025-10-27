'use client'
import { login } from '@/lib/actions/auth'

export const SignInButton = () => {
  return <button onClick={() => login()}>Please Sign In</button>
}
