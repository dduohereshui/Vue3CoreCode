const queue = [];
let isflushing = false;
const resolvepromise = Promise.resolve();
export function queueJob(job) {
  if (!queue.includes(job)) {
    queue.push(job);
  }
  if (!isflushing) {
    isflushing = true;
    resolvepromise.then(() => {
      // 开一个promise，例如页面上 this.name = 'a' this.age++ ,那么就会等都更改完再去执行更新
      const copy = queue.slice();
      queue.length = 0;
      copy.forEach((job) => job());
      isflushing = false;
      copy.length = 0;
    });
  }
}
