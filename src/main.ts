import {
  App,
  Modal,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
} from "obsidian";
interface InitSettings {
  mySetting: string;
}
const DEFAULT_SETTINGS: InitSettings = {
  mySetting: "",
};
export default class Init extends Plugin {
  settings: InitSettings;
  async onload() {
    console.log("loading plugin");
    await this.loadSettings();
    this.addRibbonIcon("dice", "Sample Plugin", () => {
      new Notice("This is a notice!");
    });
    this.addStatusBarItem().setText("Status Bar Text");
    // 添加测试弹窗的指令
    this.addCommand({
      id: "open-modal",
      name: "测试弹窗",
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
}

// 弹窗提示
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
    containerEl.createEl("h2", { text: "Settings for my init plugin." });
    new Setting(containerEl)
      .setName("Setting #1")
      .setDesc("It's a desc")
      .addText((text) =>
        text
          .setPlaceholder("Enter your target folder")
          .setValue(this.plugin.settings.mySetting)
          .onChange(async (value) => {
            console.log("folder: " + value);
            this.plugin.settings.mySetting = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
