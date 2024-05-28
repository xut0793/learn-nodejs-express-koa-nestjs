/*
 * @Date         : 2024-05-28 14:19:35 星期2
 * @Author       : xut
 * @Description  :
 */
import mysql from "mysql"

const MYSQL_CONFIG = {
  host: "localhost",
  port: 3306,
  user: "root",
  password: "Mysql_12345",
  database: "learn-node-blog",
}

// 创建连接对象，建立连接
let connection = mysql.createConnection(MYSQL_CONFIG)

/**
 * mysql 健康检查接口
 */
export function onMysqlHealthCheck() {
  return new Promise((resolve, reject) => {
    connection.query("SELECT 1", (err) => {
      if (err) {
        return reject(err)
      }

      return resolve()
    })
  })
}

export function mysqlConnect() {
  return new Promise((resolve, reject) => {
    connection.connect((err) => {
      if (err) {
        console.error("mysql connection error", err.stack)
        return reject(err)
      }

      console.log("mysql connected")
      resolve()
    })
  })
}

/**
 * 调用 end()方法确保在数据库连接关闭之前始终执行所有剩余的查询。
 * 调用 destroy()方法强制关闭，不会像end那样触发回调或事件。 connection.destroy()
 */
export function mysqlDisconnect() {
  return new Promise((resolve, reject) => {
    connection.end((err) => {
      if (err) {
        console.error("mysql error during disconnection ", err.stack)
        return reject(err)
      }

      console.log("mysql disconnected")
      resolve()
    })
  })
}

export function exec(sql, values = []) {
  return new Promise((resolve, reject) => {
    connection.query(sql, values, (err, result) => {
      if (err) {
        reject(err)
      } else {
        resolve(result)
      }
    })
  })
}

export const mysqlEscape = mysql.escape

export default connection
