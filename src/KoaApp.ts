// import Koa from "koa";
// import bodyParser from "koa-bodyparser";
// import * as Router from 'koa-router';

// const router = new Router();

// import TimeUtil from "./TimeUtil";
// import Url2MdUtil from "./Url2MdUtil";
// import { getSavePath } from "./Url2MdUtil";

// import { getPluginApp } from "./main";

// const { getCurDateTime } = TimeUtil;

// const koaApp = new Koa();
// let count = 0;

// // log request URL:
// koaApp.use(async (ctx, next) => {
//   console.log(`Process ${ctx.request.method} ${ctx.request.url}...`);
//   await next();
// });

// // parse request body:
// koaApp.use(bodyParser());

// // add url-route:
// router.get("/hello/:name", async (ctx, next) => {
//   var name = ctx.params.name;
//   ctx.response.body = `<h1>Hello, ${name}!</h1>`;
// });

// router.get("/time", async (ctx, next) => {
//   count++;
//   const response = {
//     datetime: getCurDateTime(),
//     count: count,
//   };
// });

// router.get("/save", async (ctx, next) => {
//   const { title, url, html } = ctx.request.body;

//   console.log("Title:", title);
//   console.log("URL:", url);
//   console.log("HTML:", html.length);

//   const markdown = Url2MdUtil.html2md(html);
//   await getPluginApp().vault.adapter.mkdir("history");
//   const filePath = getSavePath(title, "history");
//   await getPluginApp().vault.adapter.write(filePath, markdown);

//   ctx.body = {
//     message: "File saved successfully",
//     path: filePath,
//   };
// });

// // add router middleware:
// koaApp.use(router.routes());

// var server;

// // 启动服务器
// export function startServer() {
//   const port = 10086;
//   server = koaApp.listen(port, () => {
//     console.log(`Koa Server is running on http://localhost:${port}`);
//   });
// }

// // 停止服务器
// export function stopServer() {
//   if (server) {
//     server.close(() => {
//       console.log("Server stopped");
//     });
//   }
// }