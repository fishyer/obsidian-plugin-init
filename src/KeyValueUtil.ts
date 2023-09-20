import LogUtil from "./LogUtil";
const { info, warn, error, debug } = LogUtil;
import { DataAdapter } from "obsidian";

interface KeyValue {
  [key: string]: any;
}

class KeyValueUtil {
  private filePath: string;
  private dataAdapter: DataAdapter;
  private data: KeyValue;

  constructor(filePath: string, dataAdaper: DataAdapter) {
    this.filePath = filePath;
    this.dataAdapter = dataAdaper;
    this.data = {};
    // 如果文件存在，读取其中的数据
    dataAdaper.exists(filePath).then((value) => {
      if (value) {
        dataAdaper.read(filePath).then((it) => {
          this.data = JSON.parse(it);
        });
      }
    });
  }

  // 添加key-value键值对
  public addKeyValue(key: string, value: any): void {
    this.data[key] = value;
    this.saveDataToFile();
  }

  // 根据key获取value
  public getValueByKey(key: string): any {
    return this.data[key];
  }

  // 查找所有value为mValue的key
  public findKeysByValue(mValue: any): string[] {
    const keys: string[] = [];
    for (const key in this.data) {
      if (this.data[key] === mValue) {
        keys.push(key);
      }
    }
    return keys;
  }

  public saveDataToFile(): void {
    const dataToSave = JSON.stringify(this.data, null, 2);
    this.dataAdapter.write(this.filePath, dataToSave).then();
  }
}

export default KeyValueUtil;
