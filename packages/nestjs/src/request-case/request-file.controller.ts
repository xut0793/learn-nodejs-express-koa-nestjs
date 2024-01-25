/*
 * @Date         : 2023-12-26 15:28:12 星期2
 * @Author       : xut
 * @Description  : 接收上传文件，nestjs 内置了 express 中 Multer 的实现 MulterModule
 *
 * 一、安装类型依赖包
 * 添加类型依赖 pnpm add -D @types/multer，然后就可以用 Express.Multer.File 标识接收到的文件类型
 * 
 * 
 * 二、multer 包的默认行为：
 * 1. 如果没有指定保存目录，认保存在内存中
 * 2. 为了避免命名冲突，Multer 默认会修改上传的文件名为随机字符串，并且是没有扩展名的。
 *    如果要自定义，需要在配置字段 filename 函数中处理。
 * 3. 文件数据依调用方法不同，保存在 req.file 或 req.files 中。
 *    除文件指定字段之外的key-value值，仍保存到 req.body 中。
 * 
 * 三、使用装饰器
 * multer 中间件针对不同情况，提供了以下几种方法，nestjs 使用对应的装饰器进行了封装。
 * 1. multer.single(fieldname)
 * 2. multer.array(fieldname[, maxCount])
 * 3. multer.fields(fields)
 * 4. multer.any()
 * 5. multer.none()
 * 
 * 1. 接受单个文件 FileInterceptor(field, multerOptions) 和 @UploadedFile()
 *    a. 使用解析文件的前置拦截器，将文件数据解析到 request 对象上，其中 file 是客户端挂载文件数据的 key
 *        @UseInterceptors(FileInterceptor('file'))
 *    b. 可以手动从 req.file 对象获取文件数据，也可以使用内置的参数装饰器 @UploadedFile() 单独提取到已上传的文件对象 file
 * 
 * 2. 接受多个文件，且在同一个 field 上。FilesInterceptor(field, maxCount, multerOptions) 和 @UploadedFiles，注意复数 s
 *    注意此时 @UploadedFiles 提取到 files 是数组 Array<Express.Multer.File>
 * 
 * 3. 接受多个文件，但在不同的 field 上。FileFieldsInterceptor([{name: field, maxCount}, ...]) 和 @UploadedFiles()
 *    注意此时 @UploadedFiles 提取的 files 是对象 {field: Array<Express.Multer.File>, ...}
 * 
 * 4. 接受多个文件，同在任意 field 上。 AnyFilesInterceptor(multerOptions) 和 @UploadedFiles
 *    此时 files 是一个数组 Array<Express.Multer.File>
 * 
 * 5. 没有文件，但使用 multipart/form-data 格式上传了字段，使用 NoFilesInterceptor()，字段值挂载到 @Body 上。
 * 
 * 四、配置对象 multerOptions
 * {
    dest: 'uploads/', // 将上传的文件存储在哪里，如果省略，默认保存在内存中，也可以通过 storage 自定义
    storage: multer.diskStorage {
      destination(req, file,cb){},
      filename(req,file,cb){}}, 
      // 为了避免命名冲突，Multer 默认会修改上传的文件名为随机字符串，并且是没有扩展名的。如果要自定义，需要在这里的 filename 函数中处理。
    },
    limits: {
      // limits 选项内部将传给内部用来实现数据解析的 busboy 依赖包
      fieldNameSize: '100b', // field 名字的最大长度
      fieldSize: '1MB', // field 值的最大长度
      fields:'', // 非文件字段的最大数量，默认无限
      fileSize: '', // 在 multipart 表单中，文件最大长度 (字节单位)，默认无限
      files: '', // 在 multipart 表单中，文件数量，默认无限
      parts: '', // 在 multipart 表单中，part 传输的最大数量(fields + files)
      headerPairs: 2000, // 在 multipart 表单中，键值对最大组数
    },
    fileFilter: (req, file, cb) => {}, // 文件过滤器，控制 cb 回调函数返回布尔值或错误，来控制哪些文件可以被接受
    preservePath: false, // 是否将 multipart 数据中文件名中的路径保留
  }


 五、文件对象属性 file
  {
    fieldname: '', // 由客户端指定的含有文件 buffer 数据的 key
    originalname: '', // 用户计算机上的文件原始名称
    encoding: '', // 文件编码
    minetype: '', 文件 MIME 类型
    size: '', // 文件大小，单位字节
    destination: '', // 选择 DiskStorage 时文件保存的路径
    filename: '', // 已保存在 destination 中文件名称
    path: '', // 已上传文件的完整路径，即 destination + filename
    buffer: Buffer, // 文件数据
  }

  六、自定义存储目录和文件名
    针对 multer 的配置，有两种方法
    1. 局部单个独立配置，在对应的拦截器的 multerOptions 中配置
    2. 全局配置，可以导入 MulterModule 进行注册时配置
    
    为了避免命名冲突，Multer 默认会修改上传的文件名为随机字符串，并且是没有扩展名的。
    如果要自定义，可以在 multerOptions 中的 storage.filename 字段上进行定义，它是函数，
 */
import * as path from 'node:path';
import type { Express, Request } from 'express';
import { diskStorage } from 'multer';
import {
  Body,
  Controller,
  FileTypeValidator,
  HttpStatus,
  MaxFileSizeValidator,
  ParseFilePipe,
  ParseFilePipeBuilder,
  Post,
  Req,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import {
  FileFieldsInterceptor,
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { createWriteStream } from 'node:fs';
import { finished } from 'node:stream/promises';
import { randomBytes } from 'node:crypto';

const UPLOAD_DIR = path.join(process.cwd(), '/src/request-case/uploads/');

@Controller('/file')
export class RequestFileController {
  /**
   * 默认会修改上传的文件名为随机字符串，并且是没有扩展名的
   *
   * @param file
   * @returns
   */
  @Post('default')
  @UseInterceptors(FileInterceptor('file', { dest: UPLOAD_DIR }))
  getFileDefault(@UploadedFile() file: Express.Multer.File) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { buffer, stream, ...rest } = file;
    return rest;
  }

  /**
   * 单个文件
   *
   * @param file
   * @param body
   * @returns
   */
  @Post('single')
  @UseInterceptors(FileInterceptor('file', { dest: UPLOAD_DIR }))
  getFileSingle(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: Record<string, any>,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { buffer, stream, ...rest } = file;

    return {
      body, // 除文件指定字段之外的key-value值，仍保存到 req.body 中。
      file: rest,
    };
  }

  /**
   * 多个文件，在同一个字段 upload 上，并且自定义了存储规则和文件命名规则
   *
   * @param files
   * @param body
   * @returns
   */
  @Post('multi')
  @UseInterceptors(
    FilesInterceptor('upload', 2, {
      storage: diskStorage({
        // destination 可以是直接字符串，或在函数 cb 中返回保存的路径
        destination: UPLOAD_DIR,
        // destination(req, file, cb) {
        //   cb(null, UPLOAD_DIR)
        // },
        filename(
          req: Request,
          file: Express.Multer.File,
          cb: (error: Error | null, filename: string) => void,
        ) {
          const extname = path.extname(file.originalname);
          const filename = file.originalname.replace(extname, '');
          const savedFilename = `${filename}_${Date.now()}${extname}`;
          cb(null, savedFilename);
        },
      }),
    }),
  )
  getFileMulti(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() body: Record<string, any>,
  ) {
    return {
      body,
      filenames: files.map((f) => f.filename),
    };
  }

  /**
   * 多个文件，且定义不同字段接收，使用全局存储策略
   *
   * @param files
   * @returns
   */
  @Post('fields')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'image', maxCount: 1 },
      { name: 'photos', maxCount: 2 },
    ]),
  )
  getFileFields(
    @UploadedFiles()
    files: {
      image?: Express.Multer.File[];
      photos?: Express.Multer.File[];
    },
  ) {
    // 注意此时 files 的结构为对象，不再是数组了
    const AllFiles = [].concat(files.image, files.photos);

    return AllFiles.map((f) => ({
      field: f.fieldname,
      filename: f.filename,
    }));
  }

  /**
   * 文件校验，比如大小、类型等
   *
   * 一、使用内置管道 ParseFilePipe 和内置的验证类
   *    1. MaxFileSizeValidator - 检查给定文件的大小是否小于提供的值（以 bytes 衡量）
   *    2. FileTypeValidator - 检查给定文件的 mime 类型是否与给定值匹配。
   *    3. 也可以自行实现验证类 [FileValidator](https://nest.nodejs.cn/techniques/file-upload#%E6%96%87%E4%BB%B6%E9%AA%8C%E8%AF%81)
   * 二、使用链式写法 ParseFilePipeBuilder
   * @param file
   */
  @Post('verify/new')
  @UseInterceptors(FileInterceptor('file'))
  fileVerifyByNew(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1000 * 100 }), // 100kb
          new FileTypeValidator({ fileType: 'image/png' }),
          // new CustomFileValidator()
        ],
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      }),
    )
    file: Express.Multer.File,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { buffer, stream, ...rest } = file;

    return rest;
  }

  @Post('verify/build')
  @UseInterceptors(FileInterceptor('file'))
  fileVerifyByBuild(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({ maxSize: 1000 * 100 })
        .addFileTypeValidator({ fileType: 'image/jpeg' })
        // .addValidator([new CustomFileValidator()])
        .build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY }),
    )
    file: Express.Multer.File,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { buffer, stream, ...rest } = file;

    return rest;
  }

  @Post('/raw')
  async handleRaw(@Req() req: Request) {
    // 这里也可以参照 multer 等包的做法，在无法预知客户端会上传什么文件的情况下，直接使用不带后缀名的随机字符串命名
    // TODO: 如何能确切知道文件名和后缀名呢？需要前端通过请求头传入
    const randomFilename = generateRandomString(15);
    const savedPath = path.join(UPLOAD_DIR, randomFilename);
    const writeStream = createWriteStream(savedPath);
    req.pipe(writeStream);
    await finished(writeStream);
    return 'nestjs received raw success';
  }
}

/**
 * 随机产生字符串的几种原生方法
 * 参考链接 [在JavaScript中如何生成随机字符串](https://juejin.cn/post/6844903665522704398)
 *
 * 方法一：利用 32 进制
 * Math.random() // 生成随机数字 0.123456
 * .toString(36) // 转化成 36进制 “0.4fzyo82mvyr”
 * .slice(-8) // 取最后八位 "yo82mvyr"
 *
 * 延伸知识
 * 10进制包含的字符为为 0-9
 * 16进制包含的字符为 0-9，a-f
 * 36进制包含的字符为 0-9，a-z。
 *
 * 缺点
 * 1. 只能生成有 0-9、a-z字符组成的字符串
 * 2. 由于 Math.random() 生成的18位小数，可能无法填充36位，最后几个字符串，只能在指定的几个字符中选择。导致随机性降低。
 * 3. 某些情况下会返回空值。例如，当随机数为 0, 0.5, 0.25, 0.125...时，返回为空值，但是概率极少，几千万次计算中随机值为空值
 *
 * 方法二：固定字符集
 *
 * const character = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ' // 0-9a-zA-Z
 * function randomString(length) {
 *     var result = '';
 *     for (var i = length; i > 0; --i) result += character[Math.floor(Math.random() * character.length)];
 *     return result;
 * }
 *
 * 方法三：crypto
 *
 * function generateRandomString(len) {
 *  // 判断是否为有限数值
 *  if (!Number.isFinite(len)) throw new TypeError('Expected a finite number')
 *  return crypto.randomBytes(Math.ceil(len / 2)).toString('hex').slice(0, len)
 * }
 *
 * crypto.randomBytes(size[, callback]) 生成加密强伪随机数据. size参数是指示要生成的字节数的数值，1个字节8位，16进制2个字节8位，所以随机字节数为长度的一半
 */
function generateRandomString(len: number) {
  if (!Number.isFinite(len))
    throw new TypeError(`Expected a finite number, got is ${len}`);
  return randomBytes(Math.ceil(len / 2))
    .toString('hex')
    .slice(0, len);
}
