// 3 2 8 9 3 6 7 11 15
// 找更有潜力的值
function getSequence(arr) {
  const result = [0];
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
      console.log(start);
      if (arr[result[end]] > arrI) {
        result[end] = i;
      }
    }
  }
  console.log(result);
  return result.length;
}

console.log(getSequence([3, 2, 8, 9, 3, 6, 7, 11, 15, 4]));
