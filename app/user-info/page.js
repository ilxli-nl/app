import { auth } from '@/auth'
import Image from 'next/image'

export default async function UserInfo() {
  const session = await auth()
  return (
    <div>
      {' '}
      <h1> NextAuth v5 + Next 15</h1>
      <p> User signed in with name: {session?.user?.name}</p>
      <p> User signed in with email: {session?.user?.email}</p>
      {session?.user?.image && (
        <Image
          src={session.user.image}
          width={48}
          height={48}
          alt={session.user.name ?? 'Avatar'}
          style={{ borderRadius: '50%' }}
        />
      )}
    </div>
  )
}
