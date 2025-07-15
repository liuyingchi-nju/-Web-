import {Controller, Get, Inject, Param,} from '@midwayjs/core';
import {join} from 'path';
import {readFileSync} from 'fs';
import {Context} from '@midwayjs/koa';
import * as mime from 'mime-types';
@Controller('/pictures')
export class PictureController {
  @Inject()
  ctx: Context;

  private readonly pictureDir = join(__dirname, '../data/pictures');

  @Get('/:name')
  async getPicture(@Param('name') name: string) {
    const filePath = join(this.pictureDir, name);
    const image = readFileSync(filePath);
    this.ctx.type = mime.lookup(name) || 'application/octet-stream';
    return image;
  }
 }
