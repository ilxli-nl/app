import { prisma } from '@/prisma'

const Database = async () => {
  const users = await prisma.user.findMany()

  console.log(users)

  return (
    <div>
      <h1>Users</h1>
      <ul>
        {users?.map((user) => (
          <li key={user.id}>{user.email}</li>
        ))}
      </ul>
    </div>
  )
}
export default Database
