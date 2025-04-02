console.log("lessgoo");
const canvas = document.querySelector("canvas")! as HTMLCanvasElement;
const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
const redBucket = document.querySelector(".bucketColor")!;
const undoButton = document.querySelector(".undo")!;

ctx.fillStyle = "black";
ctx.lineWidth = 5;
ctx.lineCap = "round";

enum TOOLS {
    PENCIL,
    BUCKET,
}

type Line = {
    type: "line";
    lineBuffer: position[];
};

type Fill = {
    type: "fill";
    x: number;
    y: number;
    color: { r: number; g: number; b: number };
};

type Point = {
    type: "point";
    x: number;
    y: number;
};

type Actions = Line | Fill | Point;

let events = 0;
let isDrawing = false;
let fillBucket = false;
const canvasWidth = canvas.width;
const canvasHeight = canvas.height;
let currentTool = TOOLS.PENCIL;
const undoStack: Actions[] = [];

type position = { x: number; y: number };

let positionBuffer: position[] = [];

//to see how fast the events are coming
setInterval(() => {
    console.log(events);
    events = 0;
}, 1000);

//NOTE: this might cause issue when doing bucket fill
// canvas.addEventListener("click", (e) => {
//     const { x, y } = getClickPosition(e);
//     ctx.fillRect(x, y, 5, 5);
// });

canvas.addEventListener("mousedown", (e) => {
    positionBuffer.push(getClickPosition(e));
    isDrawing = true;
});

canvas.addEventListener("mousemove", (e) => {
    if (isDrawing) {
        events++;
        const position = getClickPosition(e);
        const lastPosition = positionBuffer[positionBuffer.length - 1]!;
        // console.log(`x: ${position.x} y: ${position.y}`);

        ctx.beginPath();
        ctx.moveTo(lastPosition.x, lastPosition.y);
        ctx.lineTo(position.x, position.y);
        ctx.stroke();
        ctx.closePath();

        positionBuffer.push(position);
    }
});

//should stop drawing even if user lifts the mouse up outside of canvas
document.addEventListener("mouseup", (e) => {
    if (positionBuffer.length) {
        undoStack.push({ type: "line", lineBuffer: positionBuffer });
    }
    positionBuffer = [];
    console.log(undoStack);
    isDrawing = false;
});

redBucket.addEventListener("click", (e) => {
    console.log("fill style changed to red");
    fillBucket = true;
    ctx.fillStyle = "red";
});

undoButton.addEventListener("click", (e) => {
    redraw(undoStack);
});

function redraw(events: Actions[]) {
    if (!events.length) {
        console.log("nothing inside undostack");
        return;
    }
    events.pop();
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    events.forEach((action) => {
        switch (action?.type) {
            case "line":
                drawLine(action.lineBuffer);
                break;

            case "fill":
                break;

            case "point":
                break;

            default:
                break;
        }
    });
}

function drawLine(points: position[]) {
    console.log("draw line called");
    let { x, y } = points[0]!;
    ctx.beginPath();
    ctx.moveTo(x, y);

    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i]!.x, points[i]!.y);
    }

    ctx.stroke();
    ctx.closePath();
}

function getClickPosition(event: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: Math.floor(event.clientX - rect.left),
        y: Math.floor(event.clientY - rect.top),
    };
}

let startR: number;
let startG: number;
let startB: number;
canvas.addEventListener("dblclick", (e) => {
    const { x, y } = getClickPosition(e);
    console.log("clicked Pos=> x: ", x + " y:", y);
    const startPixelData = ctx.getImageData(x, y, 1, 1).data;
    console.log();
    startR = startPixelData[0]!;
    startG = startPixelData[0]!;
    startB = startPixelData[0]!;
    floodFill(x, y, startPixelData);
});

function floodFill(
    x: number,
    y: number,
    originalPixel: Uint8ClampedArray<ArrayBufferLike>
) {
    const imageData = ctx.getImageData(0, 0, canvasHeight, canvasWidth);
    console.log(imageData.data.length);
    bucketFill(ctx, x, y, 255, 0, 0);
}

type pixelPos = [number, number];
const fill_threshold = 1;

//this is much faster because we are directly manipulating binary data using ctx.getimageData().data which is a typed array
function bucketFill(
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    fillR: number,
    fillG: number,
    fillB: number
) {
    const startTime = performance.now();
    const stack: pixelPos[] = [[startX, startY]];
    const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    let pixelPos = (startY * canvasWidth + startX) * 4;
    const start_r = imageData.data[pixelPos + 0]!;
    const start_g = imageData.data[pixelPos + 1]!;
    const start_b = imageData.data[pixelPos + 2]!;
    const start_a = imageData.data[pixelPos + 3]!;

    //we can allow the user to buckfill colors with similar threshold right now it is set to 1 so even slight difference in color will stop the bucket fill then and there
    if (
        Math.abs(fillR - start_r) <= fill_threshold &&
        Math.abs(fillG - start_g) <= fill_threshold &&
        Math.abs(fillB - start_b) <= fill_threshold &&
        Math.abs(255 - start_a) <= fill_threshold //should be fillA here and not 255 will fix later
    ) {
        return;
    }

    while (stack.length) {
        let new_pos;
        let x;
        let y;
        let reach_left;
        let reach_right;
        new_pos = stack.pop()!;
        x = new_pos[0];
        y = new_pos[1];

        pixelPos = (y * canvasWidth + x) * 4;
        while (should_fill_at(pixelPos)) {
            y--;
            pixelPos = (y * canvasWidth + x) * 4;
        }
        reach_left = false;
        reach_right = false;

        while (true) {
            y++;
            pixelPos = (y * canvasWidth + x) * 4;

            if (!(y < canvasHeight && should_fill_at(pixelPos))) {
                break;
            }

            do_fill_at(pixelPos);

            if (x > 0) {
                if (should_fill_at(pixelPos - 4)) {
                    if (!reach_left) {
                        stack.push([x - 1, y]);
                        reach_left = true;
                    }
                } else if (reach_left) {
                    reach_left = false;
                }
            }

            if (x < canvasWidth - 1) {
                if (should_fill_at(pixelPos + 4)) {
                    if (!reach_right) {
                        stack.push([x + 1, y]);
                        reach_right = true;
                    }
                } else if (reach_right) {
                    reach_right = false;
                }
            }

            pixelPos += canvasWidth * 4;
        }
    }
    ctx.putImageData(imageData, 0, 0);

    const endTime = performance.now();

    console.log("time took: ", endTime - startTime);

    /*checking if it comes under similar threshold i.e. how much difference is between two colors.
     * since the threshold is set to 1 right now so even if there is slight difference in color
     * it will stop the flood fill.
     */
    function should_fill_at(pixelPos: number) {
        return (
            // matches start color (i.e. region to fill)
            Math.abs(imageData.data[pixelPos + 0]! - start_r) <=
                fill_threshold &&
            Math.abs(imageData.data[pixelPos + 1]! - start_g) <=
                fill_threshold &&
            Math.abs(imageData.data[pixelPos + 2]! - start_b) <=
                fill_threshold &&
            Math.abs(imageData.data[pixelPos + 3]! - start_a) <= fill_threshold
        );
    }

    function do_fill_at(pixel_pos: number) {
        imageData.data[pixel_pos + 0] = fillR;
        imageData.data[pixel_pos + 1] = fillG;
        imageData.data[pixel_pos + 2] = fillB;
        imageData.data[pixel_pos + 3] = 255;
    }
}

//note: to find a pixel using r,c in 1D => grid[COLS*r-1+c]

function compareTwoPixels(
    p1Data: Uint8ClampedArray<ArrayBufferLike>,
    p2Data: Uint8ClampedArray<ArrayBufferLike>
) {
    if (
        p1Data[0] == p2Data[0] &&
        p1Data[1] == p2Data[1] &&
        p1Data[2] == p2Data[2] &&
        p1Data[3] == p2Data[3]
    ) {
        return true;
    }

    return false;
}
