export const binarySearch = <T>(
    array: T[],
    compareCallback: (el: T) => number,
) => {
    if (!array.length) {
        return -1;
    }

    let leftBoundary = 0;
    let rightBoundary = array.length - 1;
    while (leftBoundary <= rightBoundary) {
        const middleIndex = Math.floor((rightBoundary + leftBoundary) / 2);
        const comparisonResult = compareCallback(array[middleIndex]);
        if (!comparisonResult) {
            return middleIndex;
        }

        if (comparisonResult < 0) {
            leftBoundary = middleIndex + 1;
        } else {
            rightBoundary = middleIndex - 1;
        }
    }

    return -1;
};

export const binaryInsertion = <T>(
    array: T[],
    compareCallback: (elem: T) => number,
    el: T,
) => {
    if (!array.length || compareCallback(array[array.length - 1]) <= 0) {
        array.push(el);
        return;
    }
    if (compareCallback(array[0]) >= 0) {
        array.unshift(el);
        return;
    }

    let leftBoundary = 0;
    let rightBoundary = array.length - 1;
    let middleIndex = 0;
    while (leftBoundary <= rightBoundary) {
        middleIndex = Math.floor((rightBoundary + leftBoundary) / 2);
        const comparisonResult = compareCallback(array[middleIndex]);
        if (!comparisonResult) {
            array.splice(middleIndex + 1, 0, el);
            return;
        }

        if (comparisonResult < 0) {
            leftBoundary = middleIndex + 1;
        } else {
            rightBoundary = middleIndex - 1;
        }
    }

    if (compareCallback(array[middleIndex]) < 0) {
        array.splice(middleIndex + 1, 0, el);
    } else {
        array.splice(middleIndex, 0, el);
    }
};
