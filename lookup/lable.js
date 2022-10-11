var num = 0;
outPoint:
for (var i = 0 ; i < 10 ; i++) {   // i 循环
  for (var j = 0 ; j < 10 ; j++) { // j 循环
    if( i == 5 && j == 5 ) {
       break outPoint; // i = 5，j = 5 时，会跳出 j 循环
    } // 但 i 循环会继续执行，等于跳出之后又继续执行更多次 j 循环
  num++;
  }
}

console.log(num);