import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

if (!uri) throw new Error("Missing MONGODB_URI");
if (!dbName) throw new Error("Missing MONGODB_DB");

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function getDb(): Promise<Db> {
  if (cachedDb) return cachedDb;

  if (!cachedClient) {
    cachedClient = new MongoClient(uri!);
    await cachedClient.connect();
  }

  cachedDb = cachedClient.db(dbName);
  return cachedDb;
}

export async function isAdminAllowed(email: string): Promise<boolean> {
  const db = await getDb();
  const col = db.collection("admin_allowlist");
  const found = await col.findOne({ email: email.toLowerCase() });
  return !!found;
}
