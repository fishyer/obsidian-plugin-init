import Koa from "koa";
import bodyParser from "koa-bodyparser";
import * as Router from 'koa-router';
import cors from "koa-cors";

const router = new Router.default();

import TimeUtil from "./TimeUtil";
import Url2MdUtil from "./Url2MdUtil";
import { getSavePath } from "./Url2MdUtil";

import { getPluginApp } from "./main";

const { getCurDateTime } = TimeUtil;

const koaApp = new Koa();
koaApp.use(cors({
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    origin: "*",
  }));

let count = 0;

// log request URL:
koaApp.use(async (ctx, next) => {
  console.log(`Process ${ctx.request.method} ${ctx.request.url}...`);
  await next();
});

// parse request body:
koaApp.use(bodyParser());

// add url-route:
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

router.get("/time", async (ctx, next) => {
  count++;
  const response = {
    datetime: getCurDateTime(),
    count: count,
  };
  ctx.body =response;
});

router.post("/save", async (ctx, next) => {
  const { title, url, html } = ctx.request.body;

  console.log("save.title:", title);
  console.log("save.url:", url);
  // console.log("HTML:", html);
  
  // const html2= await Url2MdUtil.url2html(url);
  const article= Url2MdUtil.cleanHtml(html);
  const markdown = Url2MdUtil.html2md(article.content);

  //对微信公众号文章进行特殊处理,因为微信公众号文章的标题会重定向，可能为：微信公众平台
  var realTitle = url.startsWith("https://mp.weixin.qq.com/?") ?article.title:title;
  //对知乎文章进行特殊处理，将标题中的(10 封私信 / 42 条消息)替换为空
   realTitle = realTitle.replace(/\(.*?\)/g, "");
  const filePath = getSavePath(realTitle, "history");
  console.log("FilePath:", filePath);
  console.log("Markdown:", markdown);
  await getPluginApp().vault.adapter.mkdir("history");
  await getPluginApp().vault.adapter.write(filePath, markdown);

  ctx.body = {
    message: "File saved successfully",
    path: filePath,
  };
});

// add router middleware:
koaApp.use(router.routes());

var server;

// 启动服务器
export function startServer() {
  const port = 10086;
  server = koaApp.listen(port, () => {
    console.log(`Koa Server is running on http://localhost:${port}`);
  });
}

// 停止服务器
export function stopServer() {
  if (server) {
    server.close(() => {
      console.log("Server stopped");
    });
  }
}