import { Controller, Get, Inject, Param } from '@midwayjs/core';
import { join } from 'path';
import { readFileSync } from 'fs';
import { Context } from '@midwayjs/koa';
import * as mime from 'mime-types';

@Controller('/pictures')
export class PictureController {
  @Inject()
  ctx: Context;

  @Get('/:name')
  async getPicture(@Param('name') name: string) {
    const filePath = join(__dirname, '../data/pictures', name);
    const image = readFileSync(filePath);

    // 自动检测MIME类型
    const mimeType = mime.lookup(name) || 'application/octet-stream';
    this.ctx.type = mimeType;

    return image;
  }
}
