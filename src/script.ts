console.log("lessgoo");
const canvas = document.querySelector("canvas")! as HTMLCanvasElement;
const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
const redBucket = document.querySelector(".bucketColor")!;

enum TOOLS {
    PENCIL,
    BUCKET,
}

let events = 0;
let isDrawing = false;
let fillBucket = false;
const canvasWidth = 800;
const canvasHeight = 600;
let CurrentTool = TOOLS.PENCIL;

ctx.fillStyle = "black";
ctx.fillRect(0, 0, 5, 5);
ctx.lineWidth = 5;
ctx.lineCap = "round";

const positionBuffer: { x: number; y: number }[] = [];

//to see how fast the events are coming
setInterval(() => {
    console.log(events);
    events = 0;
}, 1000);

const draw = (e: MouseEvent) => {
    events++;
    const position = getClickPosition(e);
    const lastPosition = positionBuffer[positionBuffer.length - 1]!;
    // console.log(`x: ${position.x} y: ${position.y}`);

    ctx.beginPath();
    ctx.moveTo(lastPosition.x, lastPosition.y);
    ctx.lineTo(position.x, position.y);
    ctx.stroke();

    positionBuffer.push(position);
};

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
    isDrawing ? draw(e) : null;
});

//should stop drawing even if user lifts the mouse up outside of canvas
document.addEventListener("mouseup", (e) => {
    isDrawing = false;
});

redBucket.addEventListener("click", (e) => {
    console.log("fill style changed to red");
    fillBucket = true;
    ctx.fillStyle = "red";
});

// function getClickPosition(event: MouseEvent) {
//     const parentElement = event.currentTarget as HTMLElement;
//     const rect = parentElement.getBoundingClientRect();
//     const x = event.clientX - rect.left;
//     const y = event.clientY - rect.top;
//     return { x, y };
// }

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
    console.log("clicked Pos=> x: ",x+" y:",y)
    const startPixelData = ctx.getImageData(x, y, 1, 1).data;
    console.log()
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
    floodFillRemastered(x,y,originalPixel)
}

type pixelPos = [number, number];

function floodFillRemastered(startX: number, startY: number, startPixelData: Uint8ClampedArray) {
    const pixelStack: pixelPos[] = [[startX, startY]];
    console.log("floodfill remastered called")
    while(pixelStack.length){
        let [x,y] = pixelStack.pop()!
        let currPixelData = ctx.getImageData(x,y,1,1).data

        while(y >=0 && compareTwoPixels(currPixelData,startPixelData)){
            y--
            currPixelData = ctx.getImageData(x,y,1,1).data
        }

        y++
        currPixelData = ctx.getImageData(x,y,1,1).data
        
        let reachLeft = false
        let reachRight = false
        console.log("currPos=> x: ",x+" y:",y)
        while(y<canvasHeight && compareTwoPixels(currPixelData,startPixelData)){
            console.log("fill rect was indeed called")
            ctx.fillRect(x,y,1,1)

            if(x>0){
                if(compareTwoPixels(ctx.getImageData(x-1,y,1,1).data,startPixelData)){
                    if(!reachLeft){
                        pixelStack.push([x-1,y])
                        reachLeft = true
                    }
                }else if(reachLeft){
                    reachLeft = false
                }
            }

            if(x<canvasWidth-1){
                if(compareTwoPixels(ctx.getImageData(x+1,y,1,1).data,startPixelData)){
                    if(!reachRight){
                        pixelStack.push([x+1,y])
                        reachRight = true
                    }
                }else if(reachRight){
                    reachRight = false
                }
            }
            
            currPixelData = ctx.getImageData(x,y+1,1,1).data
            y++
        }

    }
}

// //note: to find a pixel using r,c in 1D => grid[COLS*r-1+c]
// function dfs(
//     r: number,
//     c: number,
//     ROWS: number,
//     COLS: number,
//     originalPixel: Uint8ClampedArray<ArrayBufferLike>
// ) {
//     const currPixelData = ctx.getImageData(r, c, 1, 1).data;
//     if (
//         Math.min(r, c) < 0 ||
//         r == ROWS ||
//         c == COLS ||
//         !compareTwoPixels(originalPixel, currPixelData)
//     ) {
//         return;
//     }

//     ctx.fillRect(r, c, 1, 1);

//     dfs(r + 1, c, ROWS, COLS, originalPixel);
//     dfs(r - 1, c, ROWS, COLS, originalPixel);
//     dfs(r, c + 1, ROWS, COLS, originalPixel);
//     dfs(r, c - 1, ROWS, COLS, originalPixel);

//     return;
// }

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
