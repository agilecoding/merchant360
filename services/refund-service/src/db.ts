import { MongoClient, Db } from 'mongodb';

let client: MongoClient;
let db: Db;

export async function connectDb(): Promise<Db> {
  if (db) return db;
  const { config } = await import('./config.js');
  client = new MongoClient(config.MONGODB_URI);
  await client.connect();
  db = client.db(config.MONGODB_DB);
  return db;
}

export function getDb(): Db {
  if (!db) throw new Error('DB not initialised — call connectDb() first');
  return db;
}

export async function closeDb(): Promise<void> {
  await client?.close();
}
