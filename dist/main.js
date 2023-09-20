var __create = Object.create;
var __defProp = Object.defineProperty;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __markAsModule = (target) => __defProp(target, "__esModule", {value: true});
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {get: all[name], enumerable: true});
};
var __exportStar = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, {get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable});
  }
  return target;
};
var __toModule = (module2) => {
  return __exportStar(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? {get: () => module2.default, enumerable: true} : {value: module2, enumerable: true})), module2);
};

// src/main.ts
__markAsModule(exports);
__export(exports, {
  default: () => main_default
});
var import_obsidian = __toModule(require("obsidian"));
var verson = 5;
var DEFAULT_SETTINGS = {
  mySetting: ""
};
var Init = class extends import_obsidian.Plugin {
  async onload() {
    console.log("loading plugin");
    await this.loadSettings();
    this.addRibbonIcon("dice", "Init", () => {
      new import_obsidian.Notice("This is a notice!");
    });
    this.addStatusBarItem().setText("Init-" + verson);
    this.addCommand({
      id: "open-modal",
      name: "\u6D4B\u8BD5\u5BF9\u8BDD\u7A97",
      checkCallback: (checking) => {
        let leaf = this.app.workspace.activeLeaf;
        if (leaf) {
          if (!checking) {
            var msg = this.settings.mySetting + "Init-" + verson;
            new SampleModal(this.app, msg).open();
          }
          return true;
        }
        return false;
      }
    });
    this.addCommand({
      id: "get-time",
      name: "\u83B7\u53D6\u5F53\u524D\u65F6\u95F4",
      callback: () => {
        const date = new Date();
        const time = date.toLocaleString();
        new import_obsidian.Notice(time);
      }
    });
    this.addCommand({
      id: "next-file",
      name: "\u4E0B\u4E00\u4E2A\u6587\u4EF6",
      callback: () => {
        const activeFile = this.app.workspace.getActiveFile();
        if (activeFile) {
          const folder = activeFile.parent;
          const files = folder.children.filter((file) => file instanceof import_obsidian.TFile);
          files.sort((a, b) => b.stat.mtime - a.stat.mtime);
          const index = files.indexOf(activeFile);
          const nextFile = files[index + 1];
          if (nextFile) {
            this.app.workspace.activeLeaf.openFile(nextFile);
          }
        }
      }
    });
    this.addCommand({
      id: "prev-file",
      name: "\u4E0A\u4E00\u4E2A\u6587\u4EF6",
      callback: () => {
        const activeFile = this.app.workspace.getActiveFile();
        if (activeFile) {
          const folder = activeFile.parent;
          const files = folder.children.filter((file) => file instanceof import_obsidian.TFile);
          files.sort((a, b) => b.stat.mtime - a.stat.mtime);
          const index = files.indexOf(activeFile);
          const prevFile = files[index - 1];
          if (prevFile) {
            this.app.workspace.activeLeaf.openFile(prevFile);
          }
        }
      }
    });
    this.addCommand({
      id: "move-file",
      name: "\u79FB\u52A8\u6587\u4EF6",
      callback: () => {
        const activeFile = this.app.workspace.getActiveFile();
        console.log("prepare move file......");
        const targetFolder = this.settings.mySetting;
        if (activeFile && targetFolder) {
          const newPath = `${targetFolder}/${activeFile.name}`;
          this.app.vault.rename(activeFile, newPath);
          console.log(`\u6587\u4EF6\u5DF2\u79FB\u52A8\u5230 ${newPath}`);
        }
      }
    });
    this.addSettingTab(new SampleSettingTab(this.app, this));
  }
  onunload() {
    console.log("unloading plugin");
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
};
var main_default = Init;
var SampleModal = class extends import_obsidian.Modal {
  constructor(app, msg) {
    super(app);
    this.msg = msg;
  }
  onOpen() {
    let {contentEl} = this;
    contentEl.setText(this.msg);
  }
  onClose() {
    let {contentEl} = this;
    contentEl.empty();
  }
};
var SampleSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    let {containerEl} = this;
    containerEl.empty();
    containerEl.createEl("h2", {text: "Settings for my init plugin."});
    new import_obsidian.Setting(containerEl).setName("Setting #1").setDesc("It's a desc").addText((text) => text.setPlaceholder("Enter your target folder").setValue(this.plugin.settings.mySetting).onChange(async (value) => {
      console.log("folder: " + value);
      this.plugin.settings.mySetting = value;
      await this.plugin.saveSettings();
    }));
  }
};
