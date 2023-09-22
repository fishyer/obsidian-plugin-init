import Koa from "koa";
import bodyParser from "koa-bodyparser";
import * as Router from "koa-router";
import cors from "koa-cors";

import * as TimeUtil from "../util/TimeUtil";
import * as Url2MdUtil from "../util/Url2MdUtil";
import KeyValueHelper from "../helper/KeyValueHelper";
import * as MainPlugin from "../main";
import * as MarkdownRenderUtil from "../util/MarkdownRenderUtil";

const koaApp = new Koa();
const router = new Router.default();

koaApp.use(
  cors({
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    origin: "*",
    formidable: {
      maxFileSize: 10 * 1024 * 1024, // 10MB
    },
  })
);

var taskCache: KeyValueHelper;

let count = 0;

koaApp.use(async (ctx, next) => {
  console.log(`Process ${ctx.request.method} ${ctx.request.url}...`);
  await next();
});

koaApp.use(bodyParser());

router.get("/hello/:name", async (ctx, next) => {
  var name = ctx.params.name;
  ctx.response.body = `<!DOCTYPE html>
  <html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <title>我的标题-${name}</title>
  </head>
  <body>
    <h1>欢迎来到我的网页-${name}！</h1>
    <p>这是一个简单的 HTML 页面示例。</p>
    <img src="https://picsum.photos/400/200" alt="图片描述">
    <ul>
      <li>列表项 1</li>
      <li>列表项 2</li>
      <li>列表项 3</li>
    </ul>
  </body>
  </html>`;
});

router.get("/render", async (ctx, next) => {
  const targetUrl = ctx.query.targetUrl;
  console.log(`targetUrl: ${targetUrl}`);
  // 对targetUrl参数进行URL解码
  const decodedUrl = decodeURIComponent(targetUrl);
  console.log(`decodedUrl: ${decodedUrl}`);
  ctx.response.body = `<!DOCTYPE html>
  <html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <title>我的动态网页-${targetUrl}</title>
  </head>
  <body>
    <h1>欢迎来到我的网页-${decodedUrl}！</h1>
    <p>这是一个简单的 HTML 页面示例。</p>
    <img src="https://picsum.photos/400/200" alt="图片描述">
    <ul>
      <li>列表项 1</li>
      <li>列表项 2</li>
      <li>列表项 3</li>
    </ul>
  </body>
  </html>`;
});

router.get("/time", async (ctx, next) => {
  count++;
  const response = {
    datetime: TimeUtil.getCurDateTime(),
    count: count,
  };
  ctx.body = response;
});

router.post("/save", async (ctx, next) => {
  const { title, url, html } = ctx.request.body;
  console.log(`/save title: ${title} url: ${url} html: ${html.length}`);
  var filePath = taskCache.getValueByKey(url);
  console.log(`读取缓存 url: ${url} -> filePath: ${filePath}`);
  if (filePath) {
    console.log(`文件已存在 ${filePath} 标题: ${title}`);
    ctx.body = {
      message: "File has saved successfully",
      path: filePath,
    };
  } else {
    console.log(`文件不存在 ${filePath} 标题: ${title}`);
    filePath = await saveHtml(ctx, html, title, url);
  }
});

router.get("/test", async (ctx, next) => {
  const path = "MyLogseq/zhihu/脚本-通过TG机器人转发消息到五彩笔记.md";
  console.log(`test path: ${path}`);
  const title=Url2MdUtil.extractFileName(path);
  const markdown = await MainPlugin.getDataAdapter().read(path);
  console.log(`markdown: ${markdown}`);
  const html = await MarkdownRenderUtil.markdownToHtml(markdown);
  console.log(`html: ${html}`);
  ctx.response.body = MarkdownRenderUtil.addStyle(title,html);
});

router.post("/mark", async (ctx, next) => {
  const { title, url, bookmarkId } = ctx.request.body;
  console.log(`/mark title: ${title} url: ${url} bookmarkId:${bookmarkId}`);
  // 通过缓存找到对应的文件，然后移动到指定的文件夹
  const folderPath = MainPlugin.getSettings().genFolder + "/bookmark";
  const taskCache = new KeyValueHelper(
    `data/task-cache.json`,
    MainPlugin.getDataAdapter()
  );
  const filePath = taskCache.getValueByKey(url);
  console.log(`filePath: ${filePath}`);
  if (filePath) {
    await MainPlugin.getDataAdapter().mkdir(folderPath);
    const fileName = Url2MdUtil.extractFileName(filePath);
    const newFilePath = folderPath + "/" + fileName + ".md";
    await MainPlugin.getDataAdapter().rename(filePath, newFilePath);
    console.log(`文件已移动到 ${newFilePath}`);
  } else {
    console.log(`文件不存在 ${filePath}`);
  }
  // const article= Url2MdUtil.cleanHtml(html);
  // const markdown = Url2MdUtil.html2md(article.content);
  // const realTitle = Url2MdUtil.getArticleTitle(url, article.title, title);
  // const folderPath=MainPlugin.getSettings().genFolder+"/history";
  // const filePath = Url2MdUtil.getSavePath(realTitle, folderPath);
  // await MainPlugin.getDataAdapter().mkdir(folderPath)
  // await MainPlugin.getDataAdapter().write(filePath, markdown);

  ctx.body = {
    message: "File marked successfully",
    path: filePath,
  };
});

// add router middleware:
koaApp.use(router.routes());

var server;

async function saveHtml(ctx: any, html: any, title: any, url: any) {
  const article = Url2MdUtil.cleanHtml(html);
  const markdown = Url2MdUtil.html2md(article.content);
  const markdownWithMetadata = Url2MdUtil.addMetadata(
    title,
    url,
    TimeUtil.getCurDateTime(),
    markdown
  );
  const realTitle = Url2MdUtil.getArticleTitle(url, article.title, title);
  const folderPath = MainPlugin.getSettings().genFolder + "/history";
  const filePath = Url2MdUtil.getSavePath(realTitle, folderPath);
  await MainPlugin.getDataAdapter().mkdir(folderPath);
  await MainPlugin.getDataAdapter().write(filePath, markdownWithMetadata);
  console.log(`文件成功下载 ${filePath} 标题: ${title}`);
  taskCache.addKeyValue(url, filePath);
  console.log(`文件路径已缓存 ${url} 路径: ${filePath}`);
  ctx.body = {
    message: "File new saved successfully",
    path: filePath,
  };
  return filePath;
}

// 启动服务器
export function startServer() {
  console.log("启动 Koa Server");
  const port = 10086;
  server = koaApp.listen(port, () => {
    console.log(`Koa Server is running on http://localhost:${port}`);
  });
  taskCache = new KeyValueHelper(
    `data/task-cache.json`,
    MainPlugin.getDataAdapter()
  );
  taskCache.loadDataFromFile().then();
}

// 停止服务器
export function stopServer() {
  console.log("停止 Koa Server");
  if (server) {
    server.close(() => {
      console.log("Koa Server stopped");
    });
  }
  taskCache.saveDataToFile();
}
