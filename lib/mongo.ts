import { MongoClient, Db } from 'mongodb'

// Default to local MongoDB; can be overridden via env (recommended for Atlas)
const uri =
  process.env.MONGODB_URI ||
  'mongodb://127.0.0.1:27017/spark-kart-manager'

// Use explicit DB name; can be overridden via env
const dbName = process.env.MONGODB_DB || 'spark-kart-manager'

let client: MongoClient | null = null
let db: Db | null = null

export async function getDb(): Promise<Db> {
  if (db) return db

  if (!client) {
    client = new MongoClient(uri)
  }

  if (!client.topology) {
    await client.connect()
  }

  db = client.db(dbName)
  return db
}


