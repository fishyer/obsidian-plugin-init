你是编程专家 ，请根据我的代码和问题，给出解决方案。

## 001

代码：
LogUtil.ts
```
import * as winston from "winston";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.printf(({ level, message, timestamp }) => {
      return `${timestamp} - ${level.toUpperCase()} - ${message}`;
    })
  ),
  transports: [new winston.transports.Console()],
});

export default class LogUtil {
  public static info(...message: any[]) {
    const strMessage = message
      .map((item) => item.toString())
      .reduce((prev, curr) => prev + " " + curr);
    logger.info(strMessage);
  }

  public static warn(...message: any[]) {
    const strMessage = message
      .map((item) => item.toString())
      .reduce((prev, curr) => prev + " " + curr);
    logger.info(strMessage);
  }

  public static error(...message: any[]) {
    const strMessage = message
      .map((item) => item.toString())
      .reduce((prev, curr) => prev + " " + curr);
    logger.info(strMessage);
  }

  public static debug(...message: any[]) {
    const strMessage = message
      .map((item) => item.toString())
      .reduce((prev, curr) => prev + " " + curr);
    logger.info(strMessage);
  }
}
```

main.ts
```
import LogUtil from "./LogUtil";
```

问题：
```
导入声明与“LogUtil”的局部声明冲突。ts(2440)
```

## 002

代码
```
  public static async getArticle(url: string) {
    // 使用fetch获取html
    const response = await fetch(url);
    const html = await response.text();
    //使用Readability解析html
    const dom: Document = new JSDOM(html, { url }).window.document;
    const reader: Readability = new Readability(dom);
    const article = reader.parse();
    return article;
  }
```

问题：
```
[watch] build started (change: "src/Url2MdUtil.ts")
 > node_modules/jsdom/lib/jsdom/living/xhr/XMLHttpRequest-impl.js:31:57: warning: "./xhr-sync-worker.js" should be marked as external for use with "require.resolve"
    31 │ const syncWorkerFile = require.resolve ? require.resolve("./xhr-sync-worker.js") : null;
       ╵                                                          ~~~~~~~~~~~~~~~~~~~~~~

1 warning
```

## 003

代码：
```
  public static async getArticle(url: string) {
    // 使用fetch获取html
    const response = await fetch(url);
    const html = await response.text();
    //使用Readability解析html
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const reader: Readability = new Readability(doc);
    const article = reader.parse();
    return article;
  }
```


错误：
```
Access to fetch at 'https://www.huxiu.com/article/1923365.html' from origin 'app://obsidian.md' has been blocked by CORS policy: The 'Access-Control-Allow-Origin' header contains the invalid value '0'. Have the server send the header with a valid value, or, if an opaque response serves your needs, set the request's mode to 'no-cors' to fetch the resource with CORS disabled.
```


## 004

你是编程专家，请根据我的代码和问题，分析可能的原因，并给出解决方案。

代码：
testUrl2md.ts
```
public async testUrl2md(plugin: Plugin) {
    const dataAdapter = plugin.app.vault.adapter;
    const fileContent = await dataAdapter.read("assets/huxiu.md");
    //截取前10个链接
    const links = MdLinkUtil.str2links(fileContent).slice(0, 10);
    const outputDir = "test";
    const isExists = await dataAdapter.exists(outputDir);
    if (!isExists) {
      await dataAdapter.mkdir(outputDir);
    }
    const successList: MdLink[] = [];
    const errorList: MdLink[] = [];
    const successLinks = new KeyValueUtil("successLinks.json", dataAdapter);
    const errorLinks = new KeyValueUtil("errorLinks.json", dataAdapter);
    const url2MdUtil=new Url2MdUtil()
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      const url = link.url;
      if (successLinks.getValueByKey(url) || errorLinks.getValueByKey(url)) {
        warn(`链接已处理过: 任务${i} 链接 ${link.toString()}`);
        continue;
      }
      //防止单个任务失败导致整个任务列表都中断
      try {
        await url2MdUtil.url2md(i, links[i], outputDir, dataAdapter);
        debug(`成功: 任务${i} 链接 ${link.toString()}`);
        successList.push(link);
      } catch (error) {
        error(`失败: 任务${i} 链接 ${link.toString()}`);
        errorList.push(link);
        error(error);
      }
    }
    info(`总数量: ${links.length}个`);
    info(`成功数量: ${successList.length}个`);
    info(`失败数量: ${errorList.length}个`);
    // 将成功的链接列表保存到文件中,以防止重复处理url
    for (const link of successList) {
      successLinks.addKeyValue(link.url, link.title);
    }
    // 将失败的链接列表保存到文件中,以备以后重试
    for (const link of errorList) {
      errorLinks.addKeyValue(link.url, link.title);
    }
```

url2md.ts
```
public async url2md(
    index: number,
    link: MdLink,
    output: string,
    adapter: DataAdapter
  ): Promise<void> {
    const url = link.url;
    const article = await this.getArticle(url);
    //如果article为空，则抛出异常，以便跳过该任务
    if (!article) {
      throw new Error(`无法解析文章内容: 任务${index} 链接 ${link.toString()}`);
    }
    const title = article.title;
    // 如果文件已存在，则抛出异常，以便跳过该任务
    const filePath = Url2MdUtil.getSavePath(title, output);
    const isExists = await adapter.exists(filePath);
    if (isExists) {
      throw new Error(`文件已存在: 任务${index} 链接 ${link.toString()}`);
    }
    // 使用Turndown库，将html转换为markdown
    const turndownService: TurndownService = new TurndownService();
    const markdown: string = turndownService.turndown(article.content);
    // 在解析文章生成的markdown的最开始，插入文章的元数据
    const ctime = getCurDateTime();
    const markdownWithMetadata = this.addMetadata(title, url, ctime, markdown);
    await adapter.write(filePath, markdownWithMetadata);
    info(`MarkDown文件保存成功: ${filePath}`);
  }
```

错误
```
VM530 plugin:obsidian-plugin-init:97338 Uncaught (in promise) TypeError: error3 is not a function
    at TestClient.testUrl2md (VM530 plugin:obsidian-plugin-init:97338:9)
    at async descriptor.value (VM530 plugin:obsidian-plugin-init:96541:20)
    at async Init.onload (VM530 plugin:obsidian-plugin-init:97364:5)
```