import { Provide } from '@midwayjs/core';
import { join } from 'path';
import { ensureDir, pathExists } from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';

@Provide()
export class PicturesService {
  // 图片存储目录（绝对路径）
  private readonly pictureDir = join(__dirname, '../data/pictures');

  /**
   * 保存图片到指定目录
   * @param file 图片文件对象（包含 buffer 和原始文件名）
   * @returns 返回保存后的新文件名（含扩展名）
   */
  async savePicture(file: { buffer: Buffer; originalname: string}): Promise<string> {
    await ensureDir(this.pictureDir);
    const ext = this.getFileExtension(file.originalname);
    const newFilename = await this.generateUniqueFilename(ext);
    const destPath = join(this.pictureDir, newFilename);
    await this.writeFile(file.buffer, destPath);
    return newFilename;
  }

  /**
   * 批量保存图片
   * @param files 图片文件数组
   * @returns 返回保存后的新文件名数组
   */
  async saveMultiplePictures(files: Array<{ buffer: Buffer; originalname: string }>): Promise<string[]> {
    return Promise.all(files.map(file => this.savePicture(file)));
  }


  private getFileExtension(originalname: string): string {
    const extFromName = originalname.split('.').pop()?.toLowerCase() || '';
    const safeExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    if (extFromName && safeExtensions.includes(extFromName)) {
      return extFromName;
    }
    return 'png';
  }

  /**
   * 生成唯一文件名
   */
  private async generateUniqueFilename(ext: string): Promise<string> {
    let newFilename: string;
    let attempts = 0;
    const maxAttempts = 5; // 防止意外无限循环
    do {
      newFilename = `${uuidv4()}.${ext}`;
      attempts++;
      if (attempts >= maxAttempts) {
        throw new Error('无法生成唯一文件名');
      }
    } while (await pathExists(join(this.pictureDir, newFilename)));
    return newFilename;
  }

  /**
   * 写入文件到磁盘
   */
  private async writeFile(buffer: Buffer, destPath: string): Promise<void> {
    try {
      const fs = await import('fs/promises');
      await fs.writeFile(destPath, buffer);
    } catch (err) {
      throw new Error(`文件写入失败: ${err.message}`);
    }
  }
}
