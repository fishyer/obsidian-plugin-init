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
import LogUtil from "./LogUtil";
import { MdLinkUtil, MdLink } from "./MdLinkUtil";
import { measure, measureAsync } from "./DecoratorUtil";
import Url2MdUtil from "./Url2MdUtil";
import KeyValueUtil from "./KeyValueUtil";

const { info, warn, error, debug } = LogUtil;
const { printLinksInfo } = MdLinkUtil;

export default class TestClient {
  private app: App;

  constructor(app: App) {
    this.app = app;
  }

  @measureAsync
  public async testUrl2md(plugin: Plugin) {
    const dataAdapter = plugin.app.vault.adapter;
    const fileContent = await dataAdapter.read("assets/huxiu.md");
    //截取前10个链接,原来有28个
    const links = MdLinkUtil.str2links(fileContent);
    const outputDir = "clip";
    const isExists = await dataAdapter.exists(outputDir);
    if (!isExists) {
      await dataAdapter.mkdir(outputDir);
    }
    //用于任务统计
    const successList: MdLink[] = [];
    const errorList: MdLink[] = [];
    //用于持久化,TODO 加入失败重试机制
    const successLinks = new KeyValueUtil("successLinks.json", dataAdapter);
    const errorLinks = new KeyValueUtil("errorLinks.json", dataAdapter);
    const url2MdUtil = new Url2MdUtil();
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      const url = link.url;
      const title = link.title;
      if (successLinks.getValueByKey(url) || errorLinks.getValueByKey(url)) {
        warn(`链接已处理过: 任务${i} 链接 ${link.toString()}`);
        errorList.push(link);
        errorLinks.addKeyValue(url, title);
        continue;
      }
      //防止单个任务失败导致整个任务列表都中断
      try {
        await url2MdUtil.url2md(i, links[i], outputDir, dataAdapter);
        debug(`成功: 任务${i} 链接 ${link.toString()}`);
        successList.push(link);
        successLinks.addKeyValue(link.url, link.title);
      } catch (err) {
        error(`失败: 任务${i} 链接 ${link.toString()}`);
        errorList.push(link);
        errorLinks.addKeyValue(link.url, link.title);
        error(err);
      }
    }
    info(`总数量: ${links.length}个`);
    info(`成功数量: ${successList.length}个`);
    info(`失败数量: ${errorList.length}个`);
  }
}
