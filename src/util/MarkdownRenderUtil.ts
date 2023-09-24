import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";

import * as MainPlugin from "../main";
import * as Url2MdUtil from "./Url2MdUtil";

const marked = new Marked(
  markedHighlight({
    langPrefix: "hljs language-",
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : "plaintext";
      return hljs.highlight(code, { language }).value;
    },
  })
);

// 读取本地md文件，并将Markdown字符串转换为HTML
export async function markdownToHtml(filePath: string, repoName: string) {
  // 读取文件内容
  const fileContent = await MainPlugin.getDataAdapter().read(filePath);
  const frontmatterValues = getFrontmatterValues(fileContent);
  if (frontmatterValues) {
    // const regex = /---([^]+?)---/g;
    const regExp = /^---([\s\S]*?)---\n/;
    const replacedText = fileContent.replace(regExp, "");
    const title = getTitle(frontmatterValues.title, filePath);
    const newMarkdown =
      `# 🏆︎${title}\n` +
      `[📁本地路径](${getObsidianUrl(filePath, repoName)})\n\n` +
      `[🌐原文链接](${frontmatterValues.url})\n\n` +
      `🗓剪藏时间: ${frontmatterValues.clipTime}\n\n` +
      replacedText;
    const bodyHtml = await marked.parse(newMarkdown);
    const replacedHtml = bodyHtml.replace(
      /src="(?!http)([^"]+)"/g,
      (_, imgPath) =>
        `src="http://localhost:10086/resource?imgPath=${encodeURIComponent(imgPath)}&mdPath=${encodeURIComponent(filePath)}"`
    );
    const html = addStyle(title , replacedHtml);
    // 在genFolder下保存这三种html
    // MainPlugin.getDataAdapter().write("bodyHtml.html", bodyHtml);
    // MainPlugin.getDataAdapter().write("replacedHtml.html", replacedHtml);
    // MainPlugin.getDataAdapter().write("html.html", html);
    return html;
  }
  console.log(`没有元数据: ${filePath}`);
  const title = Url2MdUtil.extractFileName(filePath);
  console.log(`title: ${title}`);
  const newMarkdown =
    `# 🏆︎${title}\n` +
    `[📁本地路径](${getObsidianUrl(filePath, repoName)})\n` +
    fileContent;
  const bodyHtml = await marked.parse(newMarkdown);
  const replacedHtml = bodyHtml.replace(
    /src="(?!http)([^"]+)"/g,
    (_, path) =>
      `src="http://localhost:10086/resource?path=${encodeURIComponent(path)}"`
  );
  const html = addStyle(title, replacedHtml);
  return html;
}

export function getTitle(frontTitle: string, filePath: string) {
  if (frontTitle) {
    console.log(`frontTitle: ${frontTitle}`);
    return frontTitle;
  }
  const fileTitle = Url2MdUtil.extractFileName(filePath);
  console.log(`fileTitle: ${fileTitle}`);
  return fileTitle;
}

//生成Obsidian链接 obsidian://open?vault=TestOb&file=%E6%9C%AA%E5%91%BD%E5%90%8D-9
export function getObsidianUrl(path, repoName) {
  const vault = encodeURIComponent(repoName.trim());
  const name = encodeURIComponent(path.replace(".md", ""));
  const url = `obsidian://open?vault=${vault}&file=${name}`;
  return url;
}

export function getFrontmatterValues(markdownString: string) {
  const regExp = /^---([\s\S]*?)---\n/;
  const match = regExp.exec(markdownString);
  if (match && match.length > 1) {
    const frontmatter = match[1];
    const frontmatterValues = frontmatter
      .split("\n")
      .reduce((values: any, line: string) => {
        const [key, value] = line.split(/:(.+)/).map((str) => str.trim());
        values[key] = value;
        return values;
      }, {});
    console.log("frontmatterValues: ", JSON.stringify(frontmatterValues));
    return frontmatterValues;
  }
  return null;
}

export function addStyle(title: string, body: string): string {
  console.log(`addStyle title: ${title}`);
  // 自定义 CSS 样式
  const customStyles = `
  body {
    max-width: 800px;
    padding: 20px;
    margin: 0 auto;
    background-color: #FDFDF3;
  }

  img {
    max-width: 600px;
    height: auto;
    display: block;
    margin: 0 auto;
  }
`;
  // 定义模板字符串
  const template = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <meta charset="UTF-8">
        <style>${customStyles}</style>
        <!-- railscasts样式的CSS文件的引用 -->
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.1.2/styles/railscasts.min.css">
      </head>
      <body>
        ${body}
      </body>
    </html>
`;
  return template;
}
