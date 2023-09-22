import * as fs from "fs";
import * as LogUtil from "./LogUtil";
const { info, warn, error, debug } = LogUtil;

export function writeFileSync(filePath: string, fileData: string) {
  // 如果输出文件夹不存在，则创建
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(filePath);
  }
  fs.writeFileSync(filePath, fileData);
  info("保存文件成功: ", filePath);
}

export function readFileSync(filePath: string): string {
  const fileData = fs.readFileSync(filePath, "utf-8");
  return fileData;
}
