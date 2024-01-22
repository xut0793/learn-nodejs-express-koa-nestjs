/*
 * @Date         : 2024-01-22 01:00:36 星期1
 * @Author       : xut
 * @Description  :
 */
import { resolve } from 'node:path';
import * as winston from 'winston';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import 'winston-daily-rotate-file';

const NODE_ENV = process.env.NODE_ENV;
const logDir = resolve(process.cwd(), './logs');

const { combine, timestamp, json, errors, ms } = winston.format;
const errorLogFilter = winston.format((info) =>
  info.level === 'error' ? info : false,
);

const errorFileRotateTransportOptions = {
  level: 'error',
  format: combine(
    errorLogFilter(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    errors({ stack: true }),
    json(),
  ),
  dirname: logDir,
  filename: 'error-%DATE%.log', // %DATE% = datePattern 模式的值
  frequency: NODE_ENV === 'development' ? '1m' : null, // 定时分割文件，如果为 null，则使用 datePattern 属性
  datePattern: 'YYYY-MM-DD', // 默认值 YYYY-MM-DD，按天分割文件模式，以 moment.js 的时间格式表示，当 frequency 未启用时生效
  zippedArchive: false, // 默认值 false, 是否对存档的日志文件进行 gzip 压缩
  maxSize: '10M', // 默认值 null，当文件大小超过该值时，分割文件
  maxFiles: '30d', // 当日志文件超过 30 天后自动删除
};

export const winstonLogger = winston.createLogger({
  levels: winston.config.npm.levels,
  format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }), json()),
  defaultMeta: {
    service: 'learn-winston',
    env: NODE_ENV,
  },
  transports: [
    new winston.transports.File({
      level: 'debug',
      dirname: logDir,
      filename: 'combined.log', // 默认 info
    }),
    new winston.transports.DailyRotateFile(errorFileRotateTransportOptions),
  ],

  // 记录全局异常日志
  exitOnError: true, // 默认true
  exceptionHandlers: [
    new winston.transports.DailyRotateFile({
      ...errorFileRotateTransportOptions,
      filename: 'exception-%DATE%.log',
    }),
  ],
  rejectionHandlers: [
    new winston.transports.DailyRotateFile({
      ...errorFileRotateTransportOptions,
      filename: 'rejection-%DATE%.log',
    }),
  ],
});

if (NODE_ENV === 'development') {
  winstonLogger.add(
    new winston.transports.Console({
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        ms(),
        // winston-logger 实现
        // winston.format.printf(({ level, message, context, timestamp, meta }) => {
        //   return `${timestamp} - ${level} - ${context}: ${message} - ${JSON.stringify(
        //     meta,
        //   )}`;
        // }),
        nestWinstonModuleUtilities.format.nestLike('learn-nestjs', {
          colors: true,
          prettyPrint: true,
        }),
      ),
      level: 'debug',
    }),
  );
}
