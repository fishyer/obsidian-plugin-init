import {
  App,
  DataAdapter,
  Modal,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
  TFile,
  normalizePath,
} from "obsidian";

import ChromeUtil from "./ChromeUtil";
import FileUtil from "./FileUtil";
// import InoreaderUtil from "./InoreaderUtil";
import KeyValueUtil from "./KeyValueUtil";
import LogUtil from "./LogUtil";
import { MdLink, MdLinkUtil } from "./MdLinkUtil";
import TimeUtil from "./TimeUtil";
import { type } from "os";
import Url2MdUtil from "./Url2MdUtil";
import TestClient from "./test";
// import Url2MdUtil from "./Url2MdUtil";
// import {startServer,stopServer} from "./KoaApp";

/*
debug: 测试时使用、循环中用
info: 正常输出
warn: 警告
error: 错误
*/
const { info, warn, error, debug } = LogUtil;
const { printLinksInfo } = MdLinkUtil;
const watch = TimeUtil.getElapsedTime;


LogUtil.info("开始执行:main.ts");


interface InitSettings {
  mySetting: string;
}

const DEFAULT_SETTINGS: InitSettings = {
  mySetting: "",
};

var pluginApp:App;

export function getPluginApp() {
  return pluginApp;
}

export default class Init extends Plugin {
  settings: InitSettings;
  async onload() {
    pluginApp = this.app;
    const verson = 11;
    console.log("loading plugin,verson=" + verson);
    const testClient = new TestClient(this.app);
    await this.app.vault.adapter.mkdir("test");
    await testClient.testUrl2md(this)
    info("准备启动Koa服务");
    // startServer();
    // info("Koa服务启动完成，继续其它操作");
    await this.loadSettings();
    // 在侧边栏添加一个图标
    this.addRibbonIcon("dice", "Init", () => {
      new Notice("This is a notice!");
    });
    //底部状态栏显示信息
    this.addStatusBarItem().setText("Init-" + verson);
    // 添加测试对话窗的指令
    this.addCommand({
      id: "open-modal",
      name: "测试对话窗",
      checkCallback: (checking: boolean) => {
        let leaf = this.app.workspace.activeLeaf;
        if (leaf) {
          if (!checking) {
            var msg = this.settings.mySetting;
            new SampleModal(this.app, msg).open();
          }
          return true;
        }
        return false;
      },
    });
    //获取当前时间
    this.addCommand({
      id: "get-time",
      name: "获取当前时间",
      callback: () => {
        const date = new Date();
        const time = date.toLocaleString();
        new Notice(time);
      },
    });
    // 切换到当前文件夹的下一个文件
    this.addCommand({
      id: "next-file",
      name: "下一个文件",
      callback: () => {
        const activeFile = this.app.workspace.getActiveFile();
        if (activeFile) {
          const folder = activeFile.parent;
          // 获取files中的TFile类型的文件
          const files = folder.children.filter(
            (file) => file instanceof TFile
          ) as TFile[];
          // 按照更新时间排序
          files.sort((a, b) => b.stat.mtime - a.stat.mtime);
          const index = files.indexOf(activeFile);
          const nextFile = files[index + 1];
          if (nextFile) {
            this.app.workspace.activeLeaf.openFile(nextFile);
          }
        }
      },
    });
    // 切换到当前文件夹的上一个文件
    this.addCommand({
      id: "prev-file",
      name: "上一个文件",
      callback: () => {
        const activeFile = this.app.workspace.getActiveFile();
        if (activeFile) {
          const folder = activeFile.parent;
          // 获取files中的TFile类型的文件
          const files = folder.children.filter(
            (file) => file instanceof TFile
          ) as TFile[];
          // 按照更新时间排序
          files.sort((a, b) => b.stat.mtime - a.stat.mtime);
          const index = files.indexOf(activeFile);
          const prevFile = files[index - 1];
          if (prevFile) {
            this.app.workspace.activeLeaf.openFile(prevFile);
          }
        }
      },
    });
    // 添加移动文件的指令
    this.addCommand({
      id: "move-file",
      name: "移动文件",
      callback: () => {
        const activeFile = this.app.workspace.getActiveFile();
        console.log("prepare move file......");
        const targetFolder = this.settings.mySetting;
        if (activeFile && targetFolder) {
          const newPath = `${targetFolder}/${activeFile.name}`;
          this.app.vault.rename(activeFile, newPath);
          console.log(`文件已移动到 ${newPath}`);
        }
      },
    });
    this.addCommand({
      id: "save-url",
      name: "保存网页",
      callback: async () => {
        new Notice("准备保存网页");
      },
    });

    this.addSettingTab(new SampleSettingTab(this.app, this));
  }
  onunload() {
    console.log("unloading plugin");
    pluginApp=null;
    info("准备停止Koa服务");
    // stopServer();
    // info("Koa服务停止完成，继续其它操作");
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
}

// 对话窗
class SampleModal extends Modal {
  private msg: string;

  constructor(app: App, msg: string) {
    super(app);
    this.msg = msg;
  }

  onOpen() {
    let { contentEl } = this;
    contentEl.setText(this.msg);
  }
  onClose() {
    let { contentEl } = this;
    contentEl.empty();
  }
}

// 设置项
class SampleSettingTab extends PluginSettingTab {
  plugin: Init;
  constructor(app: App, plugin: Init) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display(): void {
    let { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Init插件配置项" });
    new Setting(containerEl)
      .setName("归档文件夹路径")
      .setDesc("可一键将笔记移动到此文件夹")
      .addText((text) =>
        text
          .setPlaceholder("输入你的目标文件夹路径")
          .setValue(this.plugin.settings.mySetting)
          .onChange(async (value) => {
            console.log("folder: " + value);
            this.plugin.settings.mySetting = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
