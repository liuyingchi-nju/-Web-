import { Provide } from '@midwayjs/core';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Provide()
export class PicturesService {
  // Base directory for storing pictures
  private readonly baseDir = path.join(__dirname, '../data/pictures');


  /**
   * Save multiple picture files
   * @param files Array of picture files
   * @returns Array of saved file names
   */
  async savePictures(files: any[]): Promise<string[]> {
    // Ensure the directory exists
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }

    const savedFileNames: string[] = [];
    for (const file of files) {
      const savedFileName = await this.savePicture(file);
      savedFileNames.push(savedFileName);
    }
    return savedFileNames;
  }

  /**
   * Save a single picture file
   * @param file Picture file
   * @returns Saved file name
   */
  private async savePicture(file: any): Promise<string> {
    // Generate unique filename with original extension
    const fileExt = path.extname(file.filename);
    const uniqueFileName = `${uuidv4()}${fileExt}`;
    const filePath = path.join(this.baseDir, uniqueFileName);
    // Read the temporary file and write to destination
    const fileData = fs.readFileSync(file.data);
    fs.writeFileSync(filePath, fileData);
    return uniqueFileName;
  }

  /**
   * Get the full path of a picture by its filename
   * @param fileName The name of the picture file
   * @returns Full path to the picture file
   */
  getPicturePath(fileName: string): string {
    return path.join(this.baseDir, fileName);
  }
}
