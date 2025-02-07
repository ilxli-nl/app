import { auth } from '@/auth';
//import Image from 'next/image';

import db from '../../drizzle/db';
import { users } from '../../drizzle/schema';

async function getDB() {
  const result = await db.select().from(users);

  console.log(result);
  return {
    props: {
      users: result,
    },
  };
}

export default async function Home({ users }) {
  users = await getDB();
  console.log(users);
  return (
    <div>
      <h1>Users</h1>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            {user.name} - {user.email}
          </li>
        ))}
      </ul>
    </div>
  );
}
