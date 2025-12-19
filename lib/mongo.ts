import { MongoClient, Db } from 'mongodb'

// Prefer env vars, but default to provided Atlas connection string for now
const uri =
  process.env.MONGODB_URI ||
  'mongodb+srv://shehansilva2013_db_user:9pgXxokttGHB88Yx@cluster0.dwzgfvc.mongodb.net/?appName=Cluster0'

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


