//计算耗时，返回秒数，向上取整
export function getElapsedTime(start: number) {
  const end = performance.now();
  const elapsedTime: number = Math.ceil((end - start) / 1000);
  return elapsedTime;
}

// 获取当前时间，格式为：2021-09-23 23.59.59
export function getCurDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const ctime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  return ctime;
}

// 获取当前时间，格式为：2021-09-23_23_59_59
export function getCurDateTimeByFileStyle() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const ctime = `${year}-${month}-${day}_${hours}_${minutes}_${seconds}`;
  return ctime;
}
