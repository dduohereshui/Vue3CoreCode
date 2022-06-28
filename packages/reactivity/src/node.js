function Node(val, next) {
  this.val = val;
  this.next = next || null;
}

const head = new Node(1, new Node(2, new Node(3, new Node(4, new Node(5)))));
console.log(head);
function itLinkedList(head) {
  const result = [];
  let curr = head;
  while (curr) {
    result.push(curr.val);
    curr = curr.next;
  }
  return result;
}

console.log(itLinkedList(head));
