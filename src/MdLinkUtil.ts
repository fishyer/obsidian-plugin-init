import LogUtil from "./LogUtil";

const info=LogUtil.info;

export class MdLink {
  title: string;
  url: string;

  constructor(title: string, url: string) {
    this.title = title;
    this.url = url;
  }

  toString(): string {
    return `Title: ${this.title}, URL: ${this.url}`;
  }
}

export class MdLinkUtil {
  //解析出[]()中的url和title，但是要排除掉![]()中的图片链接
  public static parseLinks(input: string): MdLink[] {
    const regex = /(?<!\!)\[([^\]]+)\]\(([^\)]+)\)/g;
    let match;
    const links: { title: string; url: string }[] = [];
    while ((match = regex.exec(input)) !== null) {
      const title = match[1].trim();
      const url = match[2].trim();
      links.push(new MdLink(title, url));
    }
    return links;
  }

  // 打印链接列表的信息
  public static printLinksInfo(links: MdLink[]) {
    info(`links.size: ${links.length}`);
    info(`links.first: ${links[0].toString()}`);
    info(`links.last: ${links[links.length - 1].toString()}`);
  }

  // 读取本地md链接列表文件
  public static str2links(fileContent: string) {
    const links = MdLinkUtil.parseLinks(fileContent);
    MdLinkUtil.printLinksInfo(links);
    return links;
  }

  // 保存为本地md链接列表文件
  public static links2str(links: MdLink[], path: string) {
    const mdList = links.map((item) => `- [${item.title}](${item.url})`);
    const content = mdList.join("\n");
    return content;
  }
}