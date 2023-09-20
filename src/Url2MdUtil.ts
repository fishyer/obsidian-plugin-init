import { chromium, Browser, Page } from "playwright";
import { MarkdownView, MarkdownPostProcessorContext } from "obsidian";
import { measure } from "./DecoratorUtil";
import { DataAdapter, normalizePath } from "obsidian";
import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";
import KeyValueUtil from "./KeyValueUtil";
import { MdLinkUtil, MdLink } from "./MdLinkUtil";
import TimeUtil from "./TimeUtil";
import LogUtil from "./LogUtil";

const { info, warn, error, debug } = LogUtil;
const { getCurDateTime } = TimeUtil;

export default class Url2MdUtil {
  constructor() {}

  public convertToValidFileName(title: string): string {
    // 将非法字符替换为_
    const invalidCharsRegex = /[\\/:*?"<>|]/g;
    const validTitle = title.replace(invalidCharsRegex, "_");
    // 将多余的空格和点号也替换为_, 并去掉首尾空格
    const extraSpacesRegex = /[\s.]+/g;
    const fileName = validTitle.replace(extraSpacesRegex, "_").trim();
    return fileName;
  }

  public static getSavePath(title: string, outputDir: string) {
    const fileName = normalizePath(title) + ".md";
    const savePath = outputDir + "/" + fileName;
    return savePath;
  }

  @measure
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

  public async getArticle(url: string) {
    // 使用playwright库，获取html，防止被反爬虫
    const browser: Browser = await chromium.launch();
    const page: Page = await browser.newPage();
    await page.goto(url);
    const html: string = await page.content();
    browser.close();
    //使用Readability，提取html中的有用内容
    const doc = new DOMParser().parseFromString(html, "text/html");
    const reader: Readability = new Readability(doc);
    const article = reader.parse();
    return article;
  }

  public addMetadata(
    title: string,
    url: string,
    ctime: string,
    markdown: string
  ) {
    const titleLine = `title:: ${title}`;
    const urlLine = `url:: ${url}`;
    const ctimeLine = `ctime:: ${ctime}`;
    const metadata = ["---", titleLine, urlLine, ctimeLine, "---"].join("\n");
    const markdownWithMetadata = metadata + "\n\n" + markdown;
    return markdownWithMetadata;
  }
}
