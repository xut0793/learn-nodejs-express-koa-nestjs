/*
 * @Date         : 2024-05-28 14:49:46 星期2
 * @Author       : xut
 * @Description  :
 */
import { MongoClient } from "mongodb"

let client, db

export function onMongodbHealthCheck() {
  return db.command({ ping: 1 })
}

export async function mongodbConnect() {
  client = await MongoClient.connect("mongodb://localhost:27017")
  db = client.db("learn-node")
  console.log("db connected")
}

export async function mongodbDisconnect() {
  return client
    .close()
    .then(() => console.log("client has disconnected"))
    .catch((err) =>
      console.error("mongodb error during disconnection", err.stack)
    )
}

export default db.collection
