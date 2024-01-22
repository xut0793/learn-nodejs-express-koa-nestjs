// import { Inject, Injectable, Logger } from '@nestjs/common';
// import { REQUEST } from '@nestjs/core';
// import { CustomLogger } from '../common/utils/custom-logger';
// import type { Request } from 'express';
import { Inject, Injectable, Logger, LoggerService } from '@nestjs/common';

@Injectable()
export class LogCaseService {
  // private readonly logger: CustomLogger;
  // constructor(
  //   @Inject(REQUEST)
  //   private readonly request: Request & { logger: CustomLogger },
  // ) {}

  // logMsg() {
  //   // this.logger.info('log msg >>>');
  //   // const logger = req['logger'] as CustomLogger;
  //   this.request.logger.debug('log msg >>>', { stage: 'LogCaseService' });

  //   return {
  //     method: this.request.method,
  //     url: this.request.url,
  //     reqId: this.request['reqId'],
  //   };
  // }
  // constructor(private readonly logger: Logger) {}
  constructor(@Inject(Logger) private readonly logger: LoggerService) {}
  logMsg() {
    this.logger.debug('LogCaseService >>>', 'LogCaseService');
    return 'logCaseService';
  }
}
