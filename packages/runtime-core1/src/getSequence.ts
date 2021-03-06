// 3 2 8 9 3 6 7 11 15
// 找更有潜力的值
export function getSequence(arr: any[]) {
  const result = [0];
  const p = new Array(arr.length).fill(0);
  let start;
  let end;
  let mid;
  let resultLastIndex;
  for (let i = 0; i < arr.length; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      resultLastIndex = result[result.length - 1];
      if (arr[resultLastIndex] < arrI) {
        result.push(i);
        p[i] = resultLastIndex;
        continue;
      }
      start = 0;
      end = result.length - 1;
      while (start < end) {
        mid = Math.floor((start + end) / 2);
        if (arr[result[mid]] < arrI) {
          start = mid + 1;
        } else {
          end = mid;
        }
      }
      if (arr[result[end]] > arrI) {
        result[end] = i;
        p[i] = result[end - 1];
      }
    }
  }

  // 前驱追溯
  let i = result.length;
  let last = result[i - 1];
  while (i-- > 0) {
    result[i] = last;
    last = p[last];
  }
  return result;
}
