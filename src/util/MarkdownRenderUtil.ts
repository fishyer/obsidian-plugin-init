import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";

const marked = new Marked(
  markedHighlight({
    langPrefix: "hljs language-",
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : "plaintext";
      return hljs.highlight(code, { language }).value;
    },
  })
);

// 创建一个将Markdown字符串转换为HTML字符串的函数
export function markdownToHtml(markdownString: string) {
  return marked.parse(markdownString);
}

export function addStyle(title: string, body: string): string {
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