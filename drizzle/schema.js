import { mysqlTable, varchar, int } from 'drizzle-orm/mysql-core';

export const users = mysqlTable('users', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }),
});
