import { parentPort } from "worker_threads";
import { Structure, BlockItems, Block } from "pixelwalker.js";
import * as fs from "node:fs";
import { PNG } from "pngjs";

const parser = Structure.parser(JSON);

const CHUNK_WIDTH = 16;
const CHUNK_HEIGHT = 16;

/**
 * @param {number} color 
 * @returns {{ r: number; g: number; b: number }}
 */
function rgb(color) {
    return {
        r: (color >> 16) & 0xff,
        g: (color >> 8) & 0xff,
        b: color & 0xff,
    };
}

/**
 * 
 * @param {number} color 
 * @returns 
 */
function findClosestBlock(color) {
    const order = BlockItems.filter((b) => b.MinimapColor).sort((a, b) => {
        // Retrieve the rgb values, and calculate the distance
        const aDist = Math.sqrt(Math.pow((rgb(a.MinimapColor).r - rgb(color).r) * 0.3, 2) + Math.pow((rgb(a.MinimapColor).g - rgb(color).g) * 0.59, 2) + Math.pow((rgb(a.MinimapColor).b - rgb(color).b) * 0.11, 2));
        const bDist = Math.sqrt(Math.pow((rgb(b.MinimapColor).r - rgb(color).r) * 0.3, 2) + Math.pow((rgb(b.MinimapColor).g - rgb(color).g) * 0.59, 2) + Math.pow((rgb(b.MinimapColor).b - rgb(color).b) * 0.11, 2));

        return aDist - bDist;
    });

    return order[0];
}

// Listen for messages from the main thread
parentPort.on("message", ([width, height]) => {
    const structure = new Structure(width, height);

    fs.createReadStream("src/image.png")
        .pipe(
            new PNG({
                filterType: 4,
            })
        )
        .on("parsed", function () {
            for (let chunkX = 0; chunkX * CHUNK_WIDTH < width; chunkX++)
            for (let chunkY = 0; chunkY * CHUNK_HEIGHT < height; chunkY++) {
                
                const chunk = new Structure(CHUNK_WIDTH, CHUNK_HEIGHT);

                for (let y = 0; y < CHUNK_HEIGHT; y++) {
                    for (let x = 0; x < CHUNK_WIDTH; x++) {
                        // Get the pixel from the image relatively scaled. This
                        // is a PERCENTAGE valiue.
                        const rel_x = (chunkX * CHUNK_WIDTH + x) / width;
                        const rel_y = (chunkY * CHUNK_HEIGHT + y) / height;

                        // Get the image pixel keeping the proportions of 
                        // world pxiels.
                        const image_x = (this.width * rel_x) | 0;
                        const image_y = (this.height * rel_y) | 0;

                        // // Translate the chunk pixel to image dimensions
                        // const relative_x = ((chunkX + x) / this.width) | 0;
                        // const relative_y = ((chunkY + y) / this.height) | 0;

                        // // Translate the image pixel to world dimensions
                        // const pixel_x = world_pixel_x | 0;
                        // const pixel_y = world_pixel_y | 0;

                        // const idx = (this.width * (newY + chunkY * CHUNK_HEIGHT) + (newX + chunkX * CHUNK_WIDTH)) << 2;
                        const idx = (this.width * (image_y + chunkY * CHUNK_HEIGHT) + (image_x + chunkX * CHUNK_WIDTH)) << 2;

                        const r = this.data[idx];
                        const g = this.data[idx + 1];
                        const b = this.data[idx + 2];

                        const color = (r << 16) | (g << 8) | b;
                        const block = findClosestBlock(color);

                        chunk[block.Layer][x][y] = Block.fromId(block.Id);
                    }
                }

                parentPort.postMessage([parser.toString(chunk), chunkX * CHUNK_WIDTH, chunkY * CHUNK_HEIGHT]);
        
            }


            // // console.log(this.width, this.height)

            // for (let y = 0; y < this.height; y++) {
            //     // console.log(`${y}/${this.height}`);

            //     for (let x = 0; x < this.width; x++) {
            //         // console.log(x, y)

            //         const idx = (this.width * y + x) << 2;

            //         const r = this.data[idx];
            //         const g = this.data[idx + 1];
            //         const b = this.data[idx + 2];

            //         const color = (r << 16) | (g << 8) | b;
            //         const block = findClosestBlock(color);

            //         const newX = ((x / this.width) * width) | 0;
            //         const newY = ((y / this.height) * height) | 0;

            //         structure[block.Layer][newX][newY] = Block.fromId(block.Id);
            //     }
            // }

            // parentPort.postMessage(parser.toString(structure));
        });
});
