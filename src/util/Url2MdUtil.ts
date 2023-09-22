import { chromium, Browser, Page, BrowserContext } from "playwright";
import { MarkdownView, MarkdownPostProcessorContext } from "obsidian";
import { measure } from "./DecoratorUtil";
import { DataAdapter, normalizePath } from "obsidian";
import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";
import KeyValueUtil from "../helper/KeyValueHelper";
import * as MdLinkUtil from "./MdLinkUtil";
import * as TimeUtil from "./TimeUtil";
import * as LogUtil from "./LogUtil";
import { Mutex } from "async-mutex";

const { info, warn, error, debug } = LogUtil;
const { MdLink } = MdLinkUtil;
const { getCurDateTime } = TimeUtil;
const turndownService: TurndownService = new TurndownService();

turndownService.addRule("customImage", {
  filter: (node) => {
    return (
      node.nodeName === "IMG" &&
      (node.hasAttribute("src") ||
        node.hasAttribute("data-src") ||
        node.hasAttribute("data-original"))
    );
  },
  replacement: (content, node) => {
    const src =
      node.getAttribute("data-original") ||
      node.getAttribute("data-src") ||
      node.getAttribute("src");
    return `![](${src})\n`;
  },
});

export function addMetadata(
  title: string,
  url: string,
  clipTime: string,
  markdown: string
) {
  const titleLine = `title:: ${title}`;
  const urlLine = `url:: ${url}`;
  const ctimeLine = `clipTime:: ${clipTime}`;
  const metadata = ["---", titleLine, urlLine, ctimeLine, "---"].join("\n");
  const markdownWithMetadata = metadata + "\n\n" + markdown;
  return markdownWithMetadata;
}

// 从文件路径中提取文件名 不包含扩展名
// 示例： MyLogseq/topic/note-course/技术书籍-学习笔记/深入理解Android自动化测试.md --> 深入理解Android自动化测试
export function extractFileName(filename) {
  var fileNameWithoutExtension = filename
    .replace(/^.*[\\/]/, "")
    .replace(/\.[^.]+$/, "");
  return fileNameWithoutExtension;
}

export function getSavePath(title: string, outputDir: string) {
  const fileName = normalizePath(extractFileName(title)) + ".md";
  const savePath = outputDir + "/" + fileName;
  return savePath;
}

export function convertToValidFileName(title: string): string {
  // 将非法字符替换为_
  const invalidCharsRegex = /[\\/:*?"<>|]/g;
  const validTitle = title.replace(invalidCharsRegex, "_");
  // 将多余的空格和点号也替换为_, 并去掉首尾空格
  const extraSpacesRegex = /[\s.]+/g;
  const fileName = validTitle.replace(extraSpacesRegex, "_").trim();
  return fileName;
}

export function getArticleTitle(
  url: string,
  htmlTitle: string,
  articleTitle: string
) {
  //对微信公众号文章进行特殊处理,因为微信公众号文章的标题会重定向，可能为：微信公众平台
  var realTitle = url.startsWith("https://mp.weixin.qq.com/?")
    ? articleTitle
    : htmlTitle;
  //对知乎文章进行特殊处理，将标题中的(10 封私信 / 42 条消息)替换为空
  realTitle = realTitle.replace(/\(.*?\)/g, "");
  return realTitle;
}

export async function url2md(
  index: number,
  link: MdLinkUtil.MdLink,
  output: string,
  adapter: DataAdapter
) {
  const url = link.url;
  const html = await url2html(url);
  const article = cleanHtml(html);
  //如果article为空，则抛出异常，以便跳过该任务
  if (!article) {
    throw new Error(`无法解析文章内容: 任务${index} 链接 ${link.toString()}`);
  }
  const title = getArticleTitle(url, link.title, article.title);
  // 如果文件已存在，则抛出异常，以便跳过该任务
  const filePath = getSavePath(title, output);
  const isExists = await adapter.exists(filePath);
  if (isExists) {
    throw new Error(`文件已存在: 任务${index} 链接 ${link.toString()}`);
  }
  const markdown: string = html2md(article.content);
  const markdownWithMetadata = addMetadata(
    title,
    url,
    getCurDateTime(),
    markdown
  );
  await adapter.write(filePath, markdownWithMetadata);
  return filePath;
}

export async function url2html(url: string) {
  browserContext = await getBrowserContext();
  const page: Page = await browserContext.newPage();
  await page.goto(url);
  const html: string = await page.content();
  page.close();
  return html;
}

export function cleanHtml(html) {
  //使用Readability，提取html中的有用内容
  const doc = new DOMParser().parseFromString(html, "text/html");
  const reader: Readability = new Readability(doc);
  const article = reader.parse();
  return article;
}

// 使用Turndown库，将html转换为markdown
export function html2md(html) {
  const markdown: string = turndownService.turndown(html);
  return markdown;
}

// 创建互斥锁实例
const mutex = new Mutex();
// 使用playwright库，获取html，防止被反爬虫
export var browser: Browser;
export var browserContext: BrowserContext;
// 在协程中使用互斥锁
async function getBrowserContext() {
  const release = await mutex.acquire();
  try {
    if (!browserContext) {
      browser = await chromium.launch({
        headless: true,
      });
      // 创建新的上下文，并设置用户代理为Chrome浏览器
      browserContext = await browser.newContext({
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      });
    }
    return browserContext;
  } finally {
    release();
  }
}