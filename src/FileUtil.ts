import * as fs from "fs";
import LogUtil from "./LogUtil";
const { info, warn, error, debug } = LogUtil;

class FileUtil {
  public static writeFileSync(filePath: string, fileData: string) {
    // 如果输出文件夹不存在，则创建
    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(filePath);
    }
    fs.writeFileSync(filePath, fileData);
    info("保存文件成功: ", filePath);
  }

  public static readFileSync(filePath: string): string {
    const fileData = fs.readFileSync(filePath, "utf-8");
    return fileData;
  }
}

export default FileUtil;