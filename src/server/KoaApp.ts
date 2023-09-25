import Koa from "koa";
// import koaStatic from 'koa-static';
import bodyParser from "koa-bodyparser";
import * as Router from "koa-router";
import cors from "koa-cors";
import path from "path";

import * as TimeUtil from "../util/TimeUtil";
import * as Url2MdUtil from "../util/Url2MdUtil";
import KeyValueHelper from "../helper/KeyValueHelper";
import * as MainPlugin from "../main";
import * as MarkdownRenderUtil from "../util/MarkdownRenderUtil";

const koaApp = new Koa();
// koaApp.use(koaStatic('static'));
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
  const repoName = ctx.query.repoName;
  console.log(`targetUrl: ${targetUrl}`);
  console.log(`repoName: ${repoName}`);
  // 对targetUrl参数进行URL解码
  const filePath = decodeURIComponent(targetUrl);
  console.log(`filePath: ${filePath}`);
  // 将markdown转换为html
  ctx.response.body = await MarkdownRenderUtil.markdownToHtml(
    filePath,
    repoName
  );
});

router.get("/time", async (ctx, next) => {
  count++;
  const response = {
    datetime: TimeUtil.getCurDateTime(),
    count: count,
  };
  ctx.body = response;
});

//获取静态资源
router.get("/resource", async (ctx, next) => {
  try {
    const imgPath = decodeURIComponent(ctx.query.imgPath);
    console.log(`resource-imgPath: ${imgPath}`);
    const mdPath = decodeURIComponent(ctx.query.mdPath);
    console.log(`resource-mdPath: ${mdPath}`);
    //这是一个相对路径
    console.log(`resource-relativePath: ${imgPath}`);
    // 根据mdPath和relativePath，获取绝对路径
    const absolutePath = path.resolve(path.dirname(mdPath), imgPath);
    console.log(`resource-absolutePath: ${absolutePath}`);
    // 如果absolutePath的第一个字符是/，则去掉
    // const realPath = absolutePath.startsWith("/") ? absolutePath.substring(1) : absolutePath;
    // console.log(`resource-realPath: ${realPath}`);
    // 根据绝对路径读取文件内容
    const arrayBufferData = await MainPlugin.getDataAdapter().readBinary(
      absolutePath
    );
    //必须使用Buffer.from()方法将ArrayBuffer转成Buffer，否则会报错
    const bufferData = Buffer.from(arrayBufferData);
    const fileSizeInKB = Math.ceil(bufferData.byteLength / 1024);
    console.log(`resource-size: ${fileSizeInKB}KB`);
    ctx.body = bufferData;
    ctx.response.type = "image/jpeg";
  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = "Internal Server Error";
  }
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
    console.log(`文件不存在 标题: ${title}`);
    filePath = await saveHtml(ctx, html, title, url);
    ctx.body = {
      message: "File new saved successfully",
      path: filePath,
    };
  }
});

router.post("/mark", async (ctx, next) => {
  const { title, url, html ,bookmarkId} = ctx.request.body;
  console.log(`/mark title: ${title} url: ${url} html: ${html.length} bookmarkId:${bookmarkId}`);
  var filePath = taskCache.getValueByKey(url);
  console.log(`读取缓存 url: ${url} -> filePath: ${filePath}`);
  if (filePath) {
    console.log(`文件已存在 ${filePath} 标题: ${title}`);
    //移动文件到指定文件夹
    const newFilePath=await moveFile(filePath);
    ctx.body = {
      message: "File has markd successfully",
      path: newFilePath,
    };
  } else {
    console.log(`文件不存在 标题: ${title}`);
    filePath = await saveHtml(ctx, html, title, url);
    //移动文件到指定文件夹
    const newFilePath=await moveFile(filePath);
    ctx.body = {
      message: "File new markd successfully",
      path: newFilePath,
    };
  }
});

// add router middleware:
koaApp.use(router.routes());

var server;

async function moveFile(filePath: any) {
  const folderPath = MainPlugin.getSettings().bookmarkFolder;
  await MainPlugin.getDataAdapter().mkdir(folderPath);
  const fileName = Url2MdUtil.extractFileName(filePath);
  const newFilePath = folderPath + "/" + fileName + ".md";
  await MainPlugin.getDataAdapter().rename(filePath, newFilePath);
  console.log(`文件已移动到 ${newFilePath}`);
  return newFilePath;
}

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
  const folderPath = MainPlugin.getSettings().historyFolder;
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

var taskCache ;

// 启动服务器
export function startServer() {
  console.log("启动 Koa Server");
  const port = 10086;
  server = koaApp.listen(port, () => {
    console.log(`Koa Server is running on http://localhost:${port}`);
  });
  taskCache = new KeyValueHelper(
    `.obsidian/plugins/MarkSearch/task-cache.json`,
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
