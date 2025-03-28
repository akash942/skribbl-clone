console.log("lessgoo");
const canvas = document.querySelector("canvas")!;
const ctx = canvas.getContext("2d")!;

ctx.fillStyle = "black";
ctx.fillRect(10, 10, 5, 5);
ctx.lineWidth = 5

const positionBuffer: { x: number; y: number }[] = [];

const draw = (e: MouseEvent) => {
  const position = getClickPosition(e);
  const lastPosition = positionBuffer[positionBuffer.length - 1]!;
  console.log(`x: ${position.x} y: ${position.y}`);

  ctx.beginPath();
  ctx.moveTo(lastPosition.x, lastPosition.y);
  ctx.lineTo(position.x, position.y);
  ctx.stroke();

//   ctx.fillRect(position.x, position.y, 5, 5);
  positionBuffer.push(position);
};

canvas.addEventListener("mousedown", (e) => {
  const { x, y } = getClickPosition(e);
  ctx.fillRect(x, y, 5, 5);
});

canvas.addEventListener("mousedown", (e) => {
  positionBuffer.push(getClickPosition(e));
  canvas.addEventListener("mousemove", draw);
});

//should stop drawing even if user lifts the mouse up outside of canvas
document.addEventListener("mouseup", (e) => {
  canvas.removeEventListener("mousemove", draw);
});

function getClickPosition(event: MouseEvent) {
  const parentElement = event.currentTarget as HTMLElement;
  const rect = parentElement.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  return { x, y };
}
