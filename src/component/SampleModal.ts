import { App, Modal } from 'obsidian';
// 对话窗
export default class SampleModal extends Modal {
    private msg: string;
  
    constructor(app: App, msg: string) {
      super(app);
      this.msg = msg;
    }
  
    onOpen() {
      let { contentEl } = this;
      contentEl.setText(this.msg);
    }
    onClose() {
      let { contentEl } = this;
      contentEl.empty();
    }
  }