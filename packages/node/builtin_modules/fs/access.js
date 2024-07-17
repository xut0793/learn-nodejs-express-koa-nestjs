/*
 * @Date         : 2024-07-17 20:34:54 星期3
 * @Author       : xut
 * @Description  :
 */
import { chmod, chown, access, constants } from "node:fs/promises"
import { fchmod, fchown, fchownSync, fchmodSync } from "node:fs"

/****************************************************************
 * 更改文件的所有权
 * 更改文件或目录的所有者是一个敏感操作，通常需要管理员权限。如果你尝试运行这段代码没有相应权限，可能会遇到错误。
 * 此外，不同的操作系统可能对用户 ID 和组 ID 有不同的指定方式。在非 UNIX 系统（如 Windows）上，这些概念可能不适用，因此该功能可能不起作用或有不同的行为。
 *
 * fsPromises.chown(path, uid, gid)
 * path <string> | <Buffer> | <URL>
 * uid <integer>
 * gid <integer>
 * 返回：<Promise> 成功时将使用 undefined 履行。
 ***************************************************************/

async function changeOwner(filePath, userId, groupId) {
  try {
    await chown(filePath, userId, groupId)
    console.log(`所有权已更改为用户ID：${userId} 和组ID: ${groupId}`)
  } catch (error) {
    console.error("更改所有权时出错:", error.message)
  }
}

/****************************************************************
 * 更改文件的访问权限。
 *
 *
 * 权限模式mode的构成基于三组权限：所有者(owner)、组(group) 和 其他(other) 的权限。每组包含三个权限：读（r）、写（w）和执行（x）。比如默认值 0o755：
 * 左边的 7 代表所有者 owner 的权限：7 (二进制 111) 允许读4、写2、执行1（rwx）
 * 中间的 5 代表所有组 group 的权限：5 (二进制 101) 代表读4、执行1（r-x）
 * 右边的 5 代表其它组 other 的权限：5 (二进制 101) 代表读4、执行1（r-x）
 *
 * 注意事项：在 Windows 上只能修改写权限，没有实现 group、owner、其他权限的区分。
 *
 * fsPromises.chmod(path, mode)
 * path <string> | <Buffer> | <URL>
 * mode <string> | <integer> 这是一个整数参数，指定了文件或目录的新权限。通常，这个权限值是八进制（以 0 开头的数字）表示的，比如 0o755。
 * 返回：<Promise> 成功时将使用 undefined 履行。
 ***************************************************************/
async function changeFilePermissions(path, mode) {
  try {
    await chmod(path, mode)
    console.log("Permissions changed successfully.")
  } catch (error) {
    console.error("Error changing permissions:", error)
  }
}

// changeFilePermissions("example.txt", 0o755)

/****************************************************************
 * 更改文件的访问权限。
 *
 * fsPromises.access(path[, mode])
 * path <string> | <Buffer> | <URL>
 * mode <string> | <integer>
 *
 * 文件访问常量 fs.constants
 * F_OK	指示该文件对调用进程可见的标志。这对于确定文件是否存在很有用，但没有提及 rwx 权限。如果未指定模式，则使用它作为默认值。
 * R_OK	指示文件可以被调用进程读取的标志。
 * W_OK	指示文件可以被调用进程写入的标志。
 * X_OK	指示该文件可以由调用进程执行的标志。这对 Windows 没有影响（将像 fs.constants.F_OK 一样运行）。
 *
 * 返回：<Promise> 成功时将使用 undefined 履行。失败将拒绝，在 error 查看信息
 ***************************************************************/
async function checkFileReadableAndWritable(filePath) {
  try {
    console.log(
      "🚀 ~ checkFileReadableAndWritable ~ constants:",
      constants.F_OK, // 0  00000000
      constants.R_OK, // 4  00000100
      constants.W_OK, // 2  00000010
      constants.X_OK // 1  00000001
    )
    await access(filePath, constants.R_OK | constants.W_OK) // | 按位或  00000100 | 00000010 = 00000110
    console.log(`${filePath} is readable and writable`)
  } catch {
    console.error("cannot access")
  }
}

// checkFileReadableAndWritable(".vscode/launch.json")

async function checkFileExists(filePath) {
  try {
    await access(filePath, constants.F_OK)
    console.log(`${filePath} is exists`)
  } catch {
    console.error("is not exists")
  }
}

checkFileExists(".vscode/launch.json")
