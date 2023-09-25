import * as LogUtil from "./util/LogUtil";
import * as MdLinkUtil from "./util/MdLinkUtil";
import * as Url2MdUtil from "./util/Url2MdUtil";
import KeyValueHelper from "./helper/KeyValueHelper";
import * as MainPlugin from "./main";

const { info, warn, error, debug } = LogUtil;
const { printLinksInfo } = MdLinkUtil;

export async function testUrl2md() {
  const dataAdapter = MainPlugin.getDataAdapter();
  const plugin = MainPlugin.getCurPlugin();
  const bottomStatusBar = plugin.addStatusBarItem();
  const srcPath = "assets/inoreader-3631.md";
  const fileContent = await dataAdapter.read(srcPath);
  const srcName=Url2MdUtil.extractFileName(srcPath);
  console.log("srcPath",srcPath);
  console.log("srcName",srcName);
  //截取前30个链接
  const i = 550;
  const j = i + 50;
  const links = MdLinkUtil.str2links(fileContent).slice(i, j);
  const outputDir = MainPlugin.getSettings().historyFolder + "/" + srcName;
  MainPlugin.getDataAdapter().mkdir(outputDir);
  const taskCache = new KeyValueHelper(
    `data/task-cache.json`,
    dataAdapter
  );

  const successList = [];
  const errorList = [];
  const skipList = [];
  const startTime = performance.now();
  for (let i = 0; i < links.length; i++) {
    const elapsedTime = Math.ceil((performance.now() - startTime) / 1000);
    bottomStatusBar.setText(
      `任务Id: ${srcName}-${i}-${j} 转换进度: ${i + 1}/${links.length} 百分比: ${Math.ceil(
        ((i + 1) / links.length) * 100
      )}% 耗时: ${elapsedTime}s`
    );
    const link = links[i];
    const url = link.url;
    const title = link.title;
    // // 用于恢复任务执行时，跳过已处理过的任务
    // if (successList.includes(link) || errorList.includes(link)) {
    //   warn(`任务已处理过，不再重复执行: 任务${i} 链接 ${link.toString()}`);
    //   continue;
    // }
    const status = taskCache.getValueByKey(url);
    if (status != null) {
      warn(
        `链接处理过，直接跳过: 任务${i} 链接 ${link.toString()} 状态 ${status}`
      );
      skipList.push(link);
      continue;
    }
    // 防止单个任务失败导致整个任务列表都中断
    try {
      // if (isPaused) {
      //   await new Promise(resolve => setTimeout(resolve, 1000)); // 暂停任务执行
      //   continue;
      // }
      const filePath = await Url2MdUtil.url2md(
        i,
        links[i],
        outputDir,
        dataAdapter
      );
      debug(`成功: 任务${i} 链接 ${link.toString()} 地址 ${filePath}`);
      successList.push(link);
      taskCache.addKeyValue(url, filePath);
    } catch (err) {
      error(`失败: 任务${i} 链接 ${link.toString()}`);
      error(err);
      errorList.push(link);
      taskCache.addKeyValue(url, "error");
    }
  }
  // 在bottomStatusBar上加上点击事件
  bottomStatusBar.onClickEvent(async () => {
    info("点击了底部状态栏");
    // pauseAndResume(links, outputDir, dataAdapter, bottomStatusBar);
  });

  info(`总数量: ${links.length}个 来源: ${srcName} ${i}-${j}`);
  info(`跳过数量: ${skipList.length}个`);
  info(`成功数量: ${successList.length}个`);
  info(`失败数量: ${errorList.length}个`);
  const elapsedTime = Math.ceil((performance.now() - startTime) / 1000);
  info(`耗时: ${elapsedTime}s`);
  //保存到插件数据中
  MainPlugin.getSettings().timeStat[`time-${srcName}-${i}-${j}`] = {
    skipCount: skipList.length,
    successCount: successList.length,
    errorCount: errorList.length,
    elapsedTime: elapsedTime,
  };
  await plugin.saveSettings();
  await Url2MdUtil.browserContext?.close();
  await Url2MdUtil.browser?.close;
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

// type MdLink = MdLinkUtil.MdLink;
//用于任务统计
// var successList: MdLink[] = [];
// var errorList: MdLink[] = [];
// //用于持久化,TODO 加入失败重试机制
// var successLinks: KeyValueHelper;
// var errorLinks: KeyValueHelper;
// var startTime = performance.now();

// async function executeTasks(links, outputDir, dataAdapter, bottomStatusBar) {

// }
