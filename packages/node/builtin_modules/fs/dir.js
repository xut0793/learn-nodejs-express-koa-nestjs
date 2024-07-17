/*
 * @Date         : 2024-07-17 18:48:29 星期3
 * @Author       : xut
 * @Description  :
 */
// fs.mkdir           创建目录
// fs.mkdtemp         创建临时目录
// fs.rmdir           删除空目录
// fs.rmd             删除文件和目录
// fs.readdir         读取一个文件目录的内容
// fs.opendir         打开文件目录
// fs.glob            按指定模式匹配文件
import {
  mkdir,
  mkdtemp,
  rmdir,
  rm,
  opendir,
  readdir,
  glob,
} from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
/*********************************************************************************
 * mkdir 是 make directory 缩写，创建目录
 * fsPromises.mkdir(path[, options])
 * path <string> | <Buffer> | <URL>
 * options <Object> | <integer>
 *    recursive <boolean> 默认值：false
 *    mode <string> | <integer> Windows 上不支持。默认值：0o777，即 drwxrwxrwx
 * 返回：<Promise> 成功后，如果 recursive 为 false，则使用 undefined 履行；如果 recursive 为 true，则使用创建的第一个目录路径履行。
 ******************************************************************************/

async function createDirectory(dirPath) {
  try {
    const ret = await mkdir(dirPath)
    console.log(`Directory created at ${dirPath}, return: `, ret) // undefined
  } catch (err) {
    console.error("Error creating directory:", err)
  }
}

// createDirectory("./dir")

async function createNestedDirectory(dirPath) {
  try {
    const ret = await mkdir(dirPath, { recursive: true })
    console.log(`Directory nested created at ${dirPath}, return: `, ret) // f:\develop\xx\dir\a
  } catch (err) {
    console.error("Error creating nested directory:", err)
  }
}

// createNestedDirectory("./dir/a/b")

/*********************************************************************************
 * 创建唯一的临时目录。通过在所提供的 prefix 的末尾附加六个随机字符来生成唯一的目录名称。
 * 由于平台的不一致，请避免在 prefix 中尾随 X 字符。某些平台，尤其是 BSD，可能返回六个以上的随机字符，并将 prefix 中的尾随 X 字符替换为随机字符。
 *
 * fsPromises.mkdtemp(prefix[, options])
 * prefix <string> | <Buffer> | <URL>
 * options <Object> | <integer>
 *    encoding <string> 默认值 utf8
 * 返回：<Promise> 成功后，用包含新创建的临时目录的文件系统路径的字符串来满足。
 ******************************************************************************/

async function createTempDirectory() {
  try {
    // os.tmpdir 返回当前系统的临时目录
    const tempDirPrefix = join(tmpdir(), "myApp-")
    console.log("🚀 ~ createTempDirectory ~ tempDirPrefix:", tempDirPrefix)
    const tempDir = await mkdtemp(tempDirPrefix)
    console.log("🚀 ~ createTempDirectory ~ tempDir:", tempDir)
    return tempDir
  } catch (err) {
    console.error("Error creating temp directory:", err)
  }
}

// const tempDir = createTempDirectory()

/*********************************************************************************
 * 用于删除空的目录，如果尝试删除包含文件的目录，操作将失败。如果用于删除文件，也会失败。
 *
 * 自 Node.js 版本 14.14.0 起，建议使用 fsPromises.rm() 替代 fsPromises.rmdir() 来删除目录，因为 rm() 提供了更丰富的功能，包括递归删除目录和force的能力。
 * 而且 rmdir 在未来的版本中可能废弃
 *
 * fsPromises.rmdir(path[, options])
 * path <string> | <Buffer> | <URL>
 * options <Object> | <integer>
 *     maxRetries <integer> 如果遇到 EBUSY、EMFILE、ENFILE、ENOTEMPTY 或 EPERM 错误，Node.js 将在每次尝试时以 retryDelay 毫秒的线性退避等待时间重试该操作。此选项表示重试次数。如果 recursive 选项不为 true，则忽略此选项。默认值：0。
 *     recursive <boolean> 如果为 true，则执行递归目录删除。在递归模式下，操作将在失败时重试。默认值：false。已弃用。
 *     retryDelay <integer> 重试之间等待的时间（以毫秒为单位）。如果 recursive 选项不为 true，则忽略此选项。默认值：100。
 * 返回：<Promise> 成功时将使用 undefined 履行。
 ******************************************************************************/
async function deleteDirectory(dirPath) {
  try {
    await rmdir(dirPath, { recursive: true })
    console.log("Directory deleted successfully")
  } catch (error) {
    console.error("Error deleting directory:", error) // Error: ENOENT: no such file or directory
  }
}

// const dirPath = "./dir"
// deleteDirectory(dirPath)

/*********************************************************************************
 * 删除文件和目录（在标准 POSIX rm 实用工具上建模）。
 *
 * 要获得类似于 rm -rf Unix 命令的行为，则使用具有选项 { recursive: true, force: true } 的 fsPromises.rm()。
 *
 * fsPromises.rm(path[, options])
 * path <string> | <Buffer> | <URL>
 * options <Object> | <integer>
 *     force <boolean> 当为 true 时，如果 path 不存在，则异常将被忽略。默认值：false。
 *     maxRetries <integer> 如果遇到 EBUSY、EMFILE、ENFILE、ENOTEMPTY 或 EPERM 错误，Node.js 将在每次尝试时以 retryDelay 毫秒的线性退避等待时间重试该操作。此选项表示重试次数。如果 recursive 选项不为 true，则忽略此选项。默认值：0。
 *     recursive <boolean> 如果为 true，则执行递归目录删除。在递归模式下，操作将在失败时重试。默认值：false。已弃用。
 *     retryDelay <integer> 重试之间等待的时间（以毫秒为单位）。如果 recursive 选项不为 true，则忽略此选项。默认值：100。
 * 返回：<Promise> 成功时将使用 undefined 履行。
 ******************************************************************************/
async function removeDirectory(dirPath) {
  try {
    await rm(dirPath, { recursive: true, force: true })
    console.log("Directory removed successfully")
  } catch (error) {
    console.error("Error removing directory:", error)
  }
}

// removeDirectory("C:\\Users\\03975\\AppData\\Local\\Temp\\myApp-XXXXXXVqqJqv")

/*********************************************************************************
 * 异步地打开目录进行迭代扫描。有关更多详细信息，请参阅 POSIX opendir(3) 文档。
 * 一旦目录被成功打开，你可以遍历目录中的每一项（文件或子目录），并打印出其名称。
 *
 * 推荐使用 readdir
 *
 * fsPromises.opendir(path[, options])
 * path <string> | <Buffer> | <URL>
 * options <Object> | <integer>
 *     encoding <string> | <null> 默认值：'utf8'
 *     bufferSize <number> 当从目录读取时，在内部缓冲的目录条目数。值越大，性能越好，但内存使用率越高。默认值：32
 *     recursive <boolean> 已解析的 Dir 将是包含所有子文件和目录的 <AsyncIterable>。默认值：false
 * 返回：<Promise> fs.dir 对象
 ******************************************************************************/
async function listDirectoryContents(directoryPath) {
  const dir = await opendir(directoryPath)
  console.log("🚀 ~ listDirectoryContents ~ dir:", dir) // 可迭代的 dirent 的 fs.dir 对象
  for await (const dirent of dir) {
    console.log(dirent)
  }
}

// listDirectoryContents(".vscode")

/*********************************************************************************
 * 异步地打开目录进行迭代扫描。有关更多详细信息，请参阅 POSIX opendir(3) 文档。
 * 一旦目录被成功打开，你可以遍历目录中的每一项（文件或子目录），并打印出其名称。
 *
 * fsPromises.readdir(path[, options])
 * path <string> | <Buffer> | <URL>
 * options <Object> | <integer>
 *     encoding <string> | <null> 默认值：'utf8'
 *     withFileTypes <boolean> 默认值：false， 只返回文件名称的数组，类似 [ 'launch.json', 'settings.json' ]，如果 withFileTypes: tru，则返回 [dirent, dirent] 对象数组（dirent 对象包含文件的更多信息，比如是文件还是目录）
 *     recursive <boolean> 如果是 true，则递归读取目录的内容。在递归模式下，它将列出所有文件、子文件和目录。默认值：false。
 * 返回：<Promise> fs.dir 对象
 ******************************************************************************/
async function listFilesInDirectory(directoryPath) {
  try {
    const files = await readdir(directoryPath, { withFileTypes: true })
    console.log("🚀 ~ listFilesInDirectory ~ files:", files) // 如果 withFleTypes=false，只返回文件名称的数组 [ 'launch.json', 'settings.json' ]，如果 withFileTypes: tru，则返回 [fs.dirent] 对象数组
  } catch (err) {
    console.error("🚀 ~ listFilesInDirectory ~ err:", err)
  }
}

// listFilesInDirectory(".vscode")

/*********************************************************************************
 * 检索与指定模式匹配的文件 v22.2.0 新增
 *
 * fsPromises.glob(pattern[, options])
 * pattern <string> | <string[]>
 * options <Object>
 *    cwd <string> 当前工作目录。默认值：process.cwd()
 *    exclude <Function> 过滤文件/目录的功能。返回 true 以排除该项目，返回 false 以包含该项目。默认值：undefined。
 *    withFileTypes <boolean> 如果 glob 应将路径返回为 Dirents，则为 true，否则为 false。默认值：false。
 * 返回：<AsyncIterator> 一个 AsyncIterator，它生成与模式匹配的文件的路径。
 ******************************************************************************/
async function matchFiles() {
  try {
    const matched = glob("**/*.json", { cwd: ".vscode", withFileTypes: true })
    for await (const dirent of matched) {
      // 如果 withFileTypes: false，输出 launch.json launch.json
      console.log("🚀 ~ for await ~ dirent:", dirent)
    }
  } catch (err) {
    console.error("🚀 ~ matchFiles ~ err:", err)
  }
}
matchFiles()
