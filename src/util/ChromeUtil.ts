import fs from "fs";
import * as TimeUtil from "./TimeUtil";

interface Bookmark {
  date_added: string;
  date_last_used?: string;
  guid: string;
  id: string;
  meta_info?: {
    power_bookmark_meta: string;
  };
  name: string;
  type: string;
  url?: string;
  children?: Bookmark[];
}

export function convertBookmarksToMarkdown(
  bookmarks: Bookmark[],
  level: number = 1,
  parent: string = ""
): string {
  let markdown = "";
  for (const bookmark of bookmarks) {
    if (bookmark.type === "url" && bookmark.url) {
      markdown += "- [" + bookmark.name + "](" + bookmark.url + ")\n";
    }
  }
  for (const bookmark of bookmarks) {
    if (bookmark.type === "folder" && bookmark.children) {
      var tag = parent === "" ? bookmark.name : `${parent}-${bookmark.name}`;
      markdown += "\n" + "#".repeat(level) + " " + tag + "\n";
      markdown += convertBookmarksToMarkdown(
        bookmark.children,
        level + 1,
        tag
      );
    }
  }
  return markdown;
}

export function convertChromeBookmarksToMarkdown(bookmarkData: string): string {
  const bookmark_bar: Bookmark = JSON.parse(bookmarkData).roots.bookmark_bar;
  const other: Bookmark = JSON.parse(bookmarkData).roots.other;
  const synced: Bookmark = JSON.parse(bookmarkData).roots.synced;

  const bookmark_bar_md = convertBookmarksToMarkdown(
    [bookmark_bar],
    1,
    ""
  );
  const other_md = convertBookmarksToMarkdown([other], 1, "");
  const synced_md = convertBookmarksToMarkdown([synced], 1, "");
  const markdown = bookmark_bar_md + "\n" + other_md + "\n" + synced_md;
  return markdown;
}

export function testChromeUtil() {
  const originPath =
    "/Users/yutianran/Library/Application Support/Google/Chrome/Default/Bookmarks";
  // 复制一份书签文件，以防止意外修改
  const curDateTime = TimeUtil.getCurDateTimeByFileStyle();
  const bookmarkPath = `gen/Bookmarks-${curDateTime}.json`;
  fs.copyFileSync(originPath, bookmarkPath);
  // 读取 Chrome 书签文件
  const fileData = fs.readFileSync(bookmarkPath, "utf-8");
  // 将 Chrome 书签文件转换为 Markdown 链接列表
  const markdown = convertChromeBookmarksToMarkdown(fileData);
  // 将转换后的 Markdown 保存到文件
  const markdownPath = `gen/Bookmarks-${curDateTime}.md`;
  fs.writeFileSync(markdownPath, markdown, "utf-8");
  console.log("保存书签文件成功", markdownPath);
}
