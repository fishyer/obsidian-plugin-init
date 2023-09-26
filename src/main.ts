import { DataAdapter, Notice, Plugin, TFile } from "obsidian";
import SampleModal from "./component/SampleModal";
import SampleSettingTab from "./component/SampleSettingTab";
import * as ChromeUtil from "./util/ChromeUtil";
import * as FileUtil from "./util/FileUtil";
import * as LogUtil from "./util/LogUtil";
import * as MdLinkUtil from "./util/MdLinkUtil";
import * as TimeUtil from "./util/TimeUtil";
import * as Url2MdUtil from "./util/Url2MdUtil";
import KeyValueHelper from "./helper/KeyValueHelper";
import { startServer, stopServer } from "./server/KoaApp";
import * as TestClient from "./test";

const { info, warn, error, debug } = LogUtil;
const { printLinksInfo, MdLink } = MdLinkUtil;

interface MarkSearchSettings {
  archiveFolder: string;
  scanFolder: string;
  lastRuntime: string;
  timeStat: {};
  taskLinks: [];
  successLinks: [];
  errorLinks: [];
  //全自动模式下的默认保存文件夹
  historyFolder: string;
  //手动添加的默认保存文件夹
  bookmarkFolder: string;
  //是否需要下载网络图片到本地，为none时不下载，其它时下载到本地
  imageFolder: string;
}

const DEFAULT_SETTINGS = {
  archiveFolder: "archive",
  scanFolder: "scan",
  lastRuntime: "",
  timeStat: {},
  taskLinks: [],
  successLinks: [],
  errorLinks: [],
  historyFolder: "history",
  bookmarkFolder: "bookmark",
  imageFolder: "none",
};

var curPlugin: MarkSearchPlugin;

export function getCurPlugin() {
  return curPlugin;
}

export function getPluginApp() {
  return curPlugin.app;
}

export function getDataAdapter() {
  return curPlugin.app.vault.adapter;
}

export function getSettings() {
  return curPlugin.settings;
}

export default class MarkSearchPlugin extends Plugin {
  settings: MarkSearchSettings;
  async onload() {
    curPlugin = this;
    super.onload();
    console.log("onload MarkSearchPlugin");
    await this.loadSettings();
    startServer();
    Url2MdUtil.initTurndownService();
    // 添加测试对话窗的指令
    this.addCommand({
      id: "open-modal",
      name: "查看所有配置值",
      checkCallback: (checking: boolean) => {
        let leaf = this.app.workspace.activeLeaf;
        if (leaf) {
          if (!checking) {
            var msg = this.settings;
            new SampleModal(this.app, String(msg)).open();
          }
          return true;
        }
        return false;
      },
    });
    //获取当前时间
    // this.addCommand({
    //   id: "get-time",
    //   name: "获取当前时间",
    //   callback: () => {
    //     const date = new Date();
    //     const time = date.toLocaleString();
    //     new Notice(time);
    //   },
    // });
    // 切换到当前文件夹的下一个文件
    // this.addCommand({
    //   id: "next-file",
    //   name: "下一个文件",
    //   callback: () => {
    //     const activeFile = this.app.workspace.getActiveFile();
    //     if (activeFile) {
    //       const folder = activeFile.parent;
    //       // 获取files中的TFile类型的文件
    //       const files = folder.children.filter(
    //         (file) => file instanceof TFile
    //       ) as TFile[];
    //       // 按照更新时间排序
    //       files.sort((a, b) => b.stat.mtime - a.stat.mtime);
    //       const index = files.indexOf(activeFile);
    //       const nextFile = files[index + 1];
    //       if (nextFile) {
    //         this.app.workspace.activeLeaf.openFile(nextFile);
    //       }
    //     }
    //   },
    // });
    // 切换到当前文件夹的上一个文件
    // this.addCommand({
    //   id: "prev-file",
    //   name: "上一个文件",
    //   callback: () => {
    //     const activeFile = this.app.workspace.getActiveFile();
    //     if (activeFile) {
    //       const folder = activeFile.parent;
    //       // 获取files中的TFile类型的文件
    //       const files = folder.children.filter(
    //         (file) => file instanceof TFile
    //       ) as TFile[];
    //       // 按照更新时间排序
    //       files.sort((a, b) => b.stat.mtime - a.stat.mtime);
    //       const index = files.indexOf(activeFile);
    //       const prevFile = files[index - 1];
    //       if (prevFile) {
    //         this.app.workspace.activeLeaf.openFile(prevFile);
    //       }
    //     }
    //   },
    // });

    // 添加移动文件的指令
    // this.addCommand({
    //   id: "move-file",
    //   name: "移动文件",
    //   callback: () => {
    //     const activeFile = this.app.workspace.getActiveFile();
    //     console.log("prepare move file......");
    //     const targetFolder = this.settings.archiveFolder;
    //     if (activeFile && targetFolder) {
    //       const newPath = `${targetFolder}/${activeFile.name}`;
    //       this.app.vault.rename(activeFile, newPath);
    //       console.log(`文件已移动到 ${newPath}`);
    //     }
    //   },
    // });
    // this.addCommand({
    //   id: "start-scan",
    //   name: "开始扫描",
    //   callback: async () => {
    //     new Notice("开始扫描，准备生成任务大纲md");
    //   },
    // });
    // this.addCommand({
    //   id: "start-gen",
    //   name: "开始生成",
    //   callback: async () => {
    //     new Notice("开始生成，准备执行任务大纲md");
    //   },
    // });
    this.addSettingTab(new SampleSettingTab(this.app, this));
    //调用测试方法
    // await this.app.vault.adapter.mkdir("test");
    // await TestClient.testUrl2md();
  }
  onunload() {
    super.onunload();
    console.log("onunload MarkSearchPlugin");
    curPlugin = null;
    this.saveSettings().then(() => {
      console.log("settings saved");
    });
    stopServer();
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    // await checkFolder(this.settings.scanFolder);
    // await checkFolder(this.settings.archiveFolder);
    await checkFolder(this.settings.historyFolder);
    await checkFolder(this.settings.bookmarkFolder);
    if (this.settings.imageFolder !== "none") {
      await checkFolder(this.settings.imageFolder);
    }
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
}

export async function checkFolder(folderPath:string){
  const dataAdapter=getDataAdapter();
  const isExists=await dataAdapter.exists(folderPath);
  if(!isExists){
    await dataAdapter.mkdir(folderPath);
  }
}