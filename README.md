# skribble-clone

Trying to create a skribbl clone only using html css and js lets see how it goes also turning off copilot so i don't vibe code

reference: found a good article to build the paint bucket feature: https://www.williammalone.com/articles/html5-canvas-javascript-paint-bucket-tool/
which was referenced by this: https://cantwell-tom.medium.com/flood-fill-and-line-tool-for-html-canvas-65e08e31aec6 



#TODOS:

- A player cant send messages in chat if he is the one drawing

note: similar flood fill approach in js paint at 1j01/jspaint/src/image-manipulation.js line 384 function draw_fill_without_pattern_support(ctx, start_x, start_y, fill_r, fill_g, fill_b, fill_a)

repo: https://github.com/1j01/jspaint

the developer refereced this to achieve the speedup(using typed arrays to manipulate pixels): https://hacks.mozilla.org/2011/12/faster-canvas-pixel-manipulation-with-typed-arrays/

- current flood fill time: 15-20ms

- can achieve more speed up using 32 bit arrays by avoiding iterating over 8 bit color channels which is what's happening in the 8 bit array right now
