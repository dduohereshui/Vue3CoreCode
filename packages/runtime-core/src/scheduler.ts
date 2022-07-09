const queue = [];
let isFlushing = false; // 是否正在刷新
const resolvePromise = Promise.resolve(); // 使用promise 等同步任务都整完，再进行更新

export function queueJob(job) {
  if (!queue.includes(job)) {
    queue.push(job);
  }

  // 批处理
  if (!isFlushing) {
    isFlushing = true;
    resolvePromise.then(() => {
      isFlushing = false;
      let copy = queue.slice();
      queue.length = 0;

      for (let i = 0; i < copy.length; i++) {
        let job = copy[i];
        job();
      }
      copy.length = 0;
    });
  }
}
