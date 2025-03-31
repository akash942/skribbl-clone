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
const canvasWidth = canvas.width;
const canvasHeight = canvas.height;
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
    bucketFill(ctx,x,y,255,0,0)
}

type pixelPos = [number, number];
const fill_threshold = 1


//this is much faster because we are directly manipulating binary data using ctx.getimageData().data
function bucketFill(
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    fillR: number,
    fillG: number,
    fillB: number
) {
    const stack: pixelPos[] = [[startX,startY]]
    const imageData = ctx.getImageData(0,0,canvasWidth,canvasHeight)
    let pixelPos = (startY*canvasWidth+startX)*4
    const start_r = imageData.data[pixelPos + 0]!
    const start_g = imageData.data[pixelPos + 1]!
    const start_b = imageData.data[pixelPos + 2]!
    const start_a = imageData.data[pixelPos + 3]!

    if (
		Math.abs(fillR - start_r) <= fill_threshold &&
		Math.abs(fillG - start_g) <= fill_threshold &&
		Math.abs(fillB - start_b) <= fill_threshold &&
		Math.abs(255 - start_a) <= fill_threshold//should be fillA here and not 255 will fix later
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

	function should_fill_at(pixelPos: number) {
		return (
			// matches start color (i.e. region to fill)
			Math.abs(imageData.data[pixelPos + 0]! - start_r) <= fill_threshold &&
			Math.abs(imageData.data[pixelPos + 1]! - start_g) <= fill_threshold &&
			Math.abs(imageData.data[pixelPos + 2]! - start_b) <= fill_threshold &&
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
