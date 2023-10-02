export function calcDistance(x1, y1, x2, y2) {
    let dx = Math.abs(x1 - x2);
    let dy = Math.abs(y1 - y2);
    return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
}

export function calcCenter(x1, y1, x2, y2) {
    function middle(p1, p2) {
        return p1 > p2 ? p1 - (p1 - p2) / 2 : p2 - (p2 - p1) / 2;
    }

    return {
        x: middle(x1, x2),
        y: middle(y1, y2),
    };
}

export function maxOffset(offset, windowDimension, imageDimension) {
    let max = windowDimension - imageDimension;
    if (max >= 0) {
        return 0;
    }
    return offset < max ? max : offset;
}

export function calcOffsetByZoom(width, height, imageWidth, imageHeight, zoom) {
    let xDiff = imageWidth * zoom - width;
    let yDiff = imageHeight * zoom - height;
    return {
        left: -xDiff / 2,
        top: -yDiff / 2,
    };
}
