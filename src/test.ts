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
import { browser, browserContext } from "./Url2MdUtil";
import InitPlugin from "./main";

const { info, warn, error, debug } = LogUtil;
const { printLinksInfo } = MdLinkUtil;




export default class TestClient {
  private app: App;

  constructor(app: App) {
    this.app = app;
  }

  @measureAsync
  public async testUrl2md(plugin: InitPlugin) {
    const bottomStatusBar = plugin.addStatusBarItem();
    const dataAdapter = plugin.app.vault.adapter;
    const srcPath="assets/inoreader-3631.md"
    const fileContent = await dataAdapter.read(srcPath);
    //截取前30个链接
    const i = 450;
    const j = i + 50;
    const links = MdLinkUtil.str2links(fileContent).slice(i, j);
    const outputDir = "clip";
    const isExists = await dataAdapter.exists(outputDir);
    if (!isExists) {
      await dataAdapter.mkdir(outputDir);
    }
    successList = [];
    errorList = [];
    successLinks = new KeyValueUtil("data/successLinks.json", dataAdapter);
    errorLinks = new KeyValueUtil("data/errorLinks.json", dataAdapter);
    startTime = performance.now();
    await executeTasks(links, outputDir, dataAdapter, bottomStatusBar);
    // 在bottomStatusBar上加上点击事件
    bottomStatusBar.onClickEvent(async () => {
      info("点击了底部状态栏");
      // pauseAndResume(links, outputDir, dataAdapter, bottomStatusBar);
    });

    info(`总数量: ${links.length}个`);
    info(`成功数量: ${successList.length}个`);
    info(`失败数量: ${errorList.length}个`);
    // const timeStat = new KeyValueUtil("data/timeStat.json", dataAdapter);
    const elapsedTime = Math.ceil((performance.now() - startTime) / 1000);
    info(`耗时: ${elapsedTime}s`);
    //保存到插件数据中
    // const pluginData=await plugin.loadData()
    // info("pluginData:",pluginData)
    const timeStat=plugin.settings.timeStat
    info("timeStat:",timeStat)
    timeStat[`${srcPath}-${i}-${j}`]={
      successCount:successList.length,
      errorCount:errorList.length,
      elapsedTime:elapsedTime
    }
    info("timeStat-modify:",timeStat)
    plugin.settings.timeStat=timeStat
    await plugin.saveSettings()
    // plugin.saveData(plugin.settings)
    // await plugin.saveData(pluginData);
    // `成功数量-${successList.length}-[${i},${j}] 耗时-${elapsedTime}s`
    // timeStat.addKeyValue(`成功数量-${successList.length}-[${i},${j}]`,`耗时-${elapsedTime}s`);
    await browserContext?.close();
    await browser?.close;
  }
}

// let isPaused = false; // 标记任务是否处于暂停状态

// // 暂停和恢复任务执行
// function pauseAndResume(links, outputDir, dataAdapter, bottomStatusBar) {
//   isPaused = !isPaused;
//   info("暂停状态: ", isPaused);
//   if (!isPaused) {
//     info("恢复任务执行");
//     executeTasks(links, outputDir, dataAdapter, bottomStatusBar); // 恢复任务执行
//   } else {
//     info("暂停任务执行");
//   }
// }

//用于任务统计
var successList: MdLink[] = [];
var errorList: MdLink[] = [];
//用于持久化,TODO 加入失败重试机制
var successLinks: KeyValueUtil;
var errorLinks: KeyValueUtil;
var startTime = performance.now();

async function executeTasks(links, outputDir, dataAdapter, bottomStatusBar) {
  for (let i = 0; i < links.length; i++) {
    const elapsedTime = Math.ceil((performance.now() - startTime) / 1000);
    bottomStatusBar.setText(
      `转换进度: ${i + 1}/${links.length} 百分比: ${Math.ceil(
        ((i + 1) / links.length) * 100
      )}% 耗时: ${elapsedTime}s`
    );
    const link = links[i];
    const url = link.url;
    const title = link.title;
    // 用于恢复任务执行时，跳过已处理过的任务
    if (successList.includes(link) || errorList.includes(link)) {
      warn(`任务已处理过，不再重复执行: 任务${i} 链接 ${link.toString()}`);
      continue;
    }
    if (successLinks.getValueByKey(url) || errorLinks.getValueByKey(url)) {
      warn(`链接已处理过: 任务${i} 链接 ${link.toString()}`);
      errorList.push(link);
      errorLinks.addKeyValue(url, title);
      continue;
    }
    // 防止单个任务失败导致整个任务列表都中断
    try {
      // if (isPaused) {
      //   await new Promise(resolve => setTimeout(resolve, 1000)); // 暂停任务执行
      //   continue;
      // }
      await Url2MdUtil.url2md(i, links[i], outputDir, dataAdapter);
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
}
