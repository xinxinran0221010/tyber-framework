var widthOfBinaryTree = function(root) {
    let nowDepthNodes = [root], res = 1;

    while(true) {
        const nextDepthNodes = nowDepthNodes.map(n => [n && n.left, n && n.right]).flat();
        let rightNdoe;
        if (nextDepthNodes.every(n => !n)) {
            break;
        }
        while(!(rightNdoe = nextDepthNodes.pop())){
        }
        nextDepthNodes.push(rightNdoe);
        nowDepthNodes = nextDepthNodes;
        res = Math.max(nowDepthNodes.length, res);
    }
    return res;
};

function makeRoot(arr) {
    let nowPick = 2, root = {val: arr[0]}, nowDepthNodes = [root];
    arr.shift();
    while(arr.length) {
        let pickedArr = arr.slice(0, nowPick);
        arr = arr.slice(nowPick);
        nowDepthNodes = pickedArr.map((a, idx) => {
            const tarNode = nowDepthNodes[idx / 2 | 0];
            if (a && tarNode) {
                const node = {val: a};
                tarNode[(idx & 1) ? 'right' : 'left'] = node;
                return node;
            }
            return null;
        });
        nowPick <<= 1;
    }
    return root;
}

widthOfBinaryTree(makeRoot([1,3,null,5,3]));


function qSort(arr) {
    const swap = function(sIdx, tIdx) {
        [arr[sIdx], arr[tIdx]] =  [arr[tIdx], arr[sIdx]];
    }
    const partition = function(low, high) {
        let pIndex = low, tarIndex = pIndex + 1;
        for (let i = tarIndex; i <= high; i++) {
            if (arr[i] < arr[pIndex]) {
                swap(i, tarIndex++);
            }
        }
        tarIndex--;
        swap(pIndex, tarIndex);
        return tarIndex;
    }
    const qSortExec = (left, right) => {
        if (left < right) {
            const pIndex = partition(left, right);
            qSortExec(left, pIndex - 1);
            qSortExec(pIndex + 1, right);
        }
        return arr;
    }

    return qSortExec(0, arr.length - 1);
}

console.log(qSort([1,3,5,6,2,3,6,3,7, 4]));

function insSort(arr) {
    for (let i = 1; i < arr.length; i++) {
        let preIndex = i - 1, current = arr[i];
        while(preIndex > 0 && arr[preIndex] > current) {
            arr[preIndex + 1] = arr[preIndex];
            preIndex--;
        }
        arr[preIndex + 1] = current;
    }

    return arr;
}
console.log(insSort([1,3,5,6,2,3,6,3,7, 4]));

