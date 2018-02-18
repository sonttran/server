'use strict';

//cont()

//console.log(solution([8, 8, 5, 7, 9, 8, 7, 4, 8])); // 7
console.log(solution([5]));             // 4
//console.log(solution([4,5,3,2,4,2,3,3,2,4,2,2,5,4,3,5,4,1,3]));             // 14
//console.log(solution([2,5,4,3,8,8,7,6,5,4,2,2,3,4,3,2,5]));          // 4
//console.log(solution([4, 3, 3, 5, 4, 3, 2]));       // 5
//console.log(solution([4, 3, 2, 1, 5, 3, 1]));       // 5


function solution(H) {
    let res = 0;
    const loops = [];

    for (let i = 0; i < H.length; i++) {
        const currentHeight = H[i];
        const previousHeight = H[i - 1];

        // replace the condition !previousHeight in the old code with this
        // instead of passing an initial item in the loops object
        // this is to mark when we start one new region
        if (loops.length === 0) {
            loops.push({
                startingHeight: currentHeight,
                begin: i
            });
            continue;
        }

        // from next loop, currentHeight = previousHeight
        // => still can merge into one rectangle
        // just continue
        if (currentHeight === previousHeight) {
            continue;
        }

        // if currentHeight > previousHeight, add one more layer (loop) for the region above
        if (currentHeight > previousHeight) {
            loops.push({
                startingHeight: currentHeight,
                begin: i
            });
            continue;
        }

        // currentHeight < previousHeight
        // => at this point, we finish some rectangles, need to increase the res count var
        // also, we may need to remove some of the loops
        // before that I wrote a for loop, but have to change because we pop out the item from the loops
        while(true) {
            loops.pop();
            res++;

            // when we finish removing everything from the loops
            // we come back to the case on line 19
            // so we need to add back one loop
            if (loops.length === 0) {
                loops.push({
                    startingHeight: currentHeight,
                    begin: i
                });
                break;
            }

            //
            let previousLoop = loops[loops.length - 1];

            // if the previous loop (the region below) has the starting height smaller than the current one
            // add one more loop for the reigon above
            if (previousLoop.startingHeight < currentHeight) {
                loops.push({
                    startingHeight: currentHeight,
                    begin: i
                });
                break;
            }

            // if the previous loop has the same height with the current one height
            // still can combine into one rectangle, just continue the outter loop
            if (previousLoop.startingHeight === currentHeight) {
                break;
            }
        }
    }

    res += loops.length;
    console.log(H.length)
    return res;
}

//function cont() {
//    var i = 0;
//    var n = 0;
//
//    while (i < 5) {
//        i++;
//
//        
//        if (i === 3) {
//            continue;
//        }
//
//        n += 1;
//        console.log(i)
//        console.log(n)
//        console.log('done')
//    }
//}

//function solution(H) {
//    
//    var count = 1;
//    for(var i = 0; i < H.length - 1; i++) {
//        
////        if(H[i] != H[i+1]) { count += 1 }
////        console.log(`H[${i}]: ${H[i]} vs H[${i+1}] ${H[i+1]} and count: ${count}`)
//    }
//    return count;
//}
