import * as LogUtil from "../util/LogUtil";
const { info, warn, error, debug } = LogUtil;
import { DataAdapter } from "obsidian";

interface KeyValue {
  [key: string]: any;
}

export default class KeyValueHelper {
  private filePath: string;
  private dataAdapter: DataAdapter;
  private data: KeyValue;

  constructor(filePath: string, dataAdaper: DataAdapter) {
    this.filePath = filePath;
    this.dataAdapter = dataAdaper;
    this.data = {};
  }

  public async loadDataFromFile(){
    const isExists=await this.dataAdapter.exists(this.filePath);
    if (!isExists) {
      console.log("读取的文件不存在", this.filePath);
      return;
    }
    const fileContent=await this.dataAdapter.read(this.filePath);
    this.data = JSON.parse(fileContent);
    console.log("读取文件成功", this.filePath);
  }

  public saveDataToFile(): void {
    const dataToSave = JSON.stringify(this.data, null, 2);
    this.dataAdapter.write(this.filePath, dataToSave).then();
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

  public getData(): KeyValue {
    return this.data;
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
}
