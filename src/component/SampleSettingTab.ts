import { App, PluginSettingTab, Setting } from "obsidian";
import MarkSearchPlugin from "../main";
// 设置项
export default class SampleSettingTab extends PluginSettingTab {
  plugin: MarkSearchPlugin;
  constructor(app: App, plugin: MarkSearchPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display(): void {
    let { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "MarkSearch插件配置项" });
    new Setting(containerEl)
      .setName("扫描文件夹路径")
      .setDesc("可自动扫描此文件夹下的所有md文件中的所有md链接")
      .addText((text) =>
        text
          .setPlaceholder("输入你的目标文件夹路径")
          .setValue(this.plugin.settings.scanFolder)
          .onChange(async (value) => {
            console.log("scan folder: " + value);
            this.plugin.settings.scanFolder = value;
            await this.plugin.saveSettings();
          })
      );
    new Setting(containerEl)
      .setName("生成文件夹路径")
      .setDesc("所有自动生成的md文件都会放在此文件夹下")
      .addText((text) =>
        text
          .setPlaceholder("输入你的目标文件夹路径")
          .setValue(this.plugin.settings.genFolder)
          .onChange(async (value) => {
            console.log("gen folder: " + value);
            this.plugin.settings.genFolder = value;
            await this.plugin.saveSettings();
          })
      );
    new Setting(containerEl)
      .setName("归档文件夹路径")
      .setDesc("可一键将笔记移动到此文件夹")
      .addText((text) =>
        text
          .setPlaceholder("输入你的目标文件夹路径")
          .setValue(this.plugin.settings.archiveFolder)
          .onChange(async (value) => {
            console.log("archive folder: " + value);
            this.plugin.settings.archiveFolder = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
