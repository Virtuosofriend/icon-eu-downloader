import fs from "fs";
import path from "path";
import axios from "axios";
import { exec } from "child_process";
import dotenv from "dotenv";

dotenv.config();

const timestamp = process.env.TIMESTAMP;
const product = process.env.PRODUCTS;
const maxTime = parseInt(process.env.MAX_TIME || "48", 10);
const destinationFolder = process.env.DESTINATION_FOLDER;
console.log(process.env);
if (!timestamp || !product) {
    console.error("Please provide TIMESTAMP and PRODUCT environment variables.");
    process.exit(1);
}

const BASE_URL = "https://opendata.dwd.de/weather/nwp/icon-eu/grib";

if (!fs.existsSync(destinationFolder)) {
    fs.mkdirSync(destinationFolder, { recursive: true });
}

async function extractBz2File(inputPath: string, outputPath: string) {
    return new Promise((resolve, reject) => {
        const command = `bzip2 -d -k -c "${inputPath}" > "${outputPath}"`;
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Failed to extract ${inputPath}:`, stderr);
                reject(error);
            } else {
                console.log(`Extracted ${inputPath} to ${outputPath}`);
                resolve(stdout);
            }
        });
    });
}

function clearFolder(folderPath: string) {
    if (fs.existsSync(folderPath)) {
        fs.rmSync(folderPath, { recursive: true, force: true });
        console.log(`Cleared folder: ${folderPath}`);
    }
    fs.mkdirSync(folderPath, { recursive: true });
}

async function downloadForecastFiles() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const baseFilename = `icon-eu_europe_regular-lat-lon_single-level_${year}${month}${day}${timestamp}`;

    const products = product.split(",").map((p) => p.trim());

    for (const product of products) {
        const productFolder = path.join(destinationFolder, product);
        clearFolder(productFolder);

        for (let hour = 0; hour <= maxTime; hour++) {
            const hourString = String(hour).padStart(3, "0");
            const filename = `${baseFilename}_${hourString}_${product.toUpperCase()}.grib2.bz2`;
            const url = `${BASE_URL}/${timestamp}/${product}/${filename}`;
            const outputPath = path.join(productFolder, filename);
            const extractedPath = outputPath.replace(/\.grib2\.bz2$/, ".grib2");

            try {
                console.log(`Downloading ${filename}...`);
                const response = await axios({
                    method: "get",
                    url: url,
                    responseType: "stream",
                });

                const writer = fs.createWriteStream(outputPath);
                response.data.pipe(writer);

                await new Promise((resolve, reject) => {
                    writer.on("finish", resolve);
                    writer.on("error", reject);
                });

                console.log(`Downloaded ${filename} successfully.`);

                await extractBz2File(outputPath, extractedPath);

                fs.unlinkSync(outputPath);
                console.log(`Deleted ${outputPath} after extraction.`);
            } catch (error) {
                console.error(`Failed to download or extract ${filename}:`, error.message);
            }
        }
    }
}

downloadForecastFiles().catch((error) => {
    console.error("Error in downloadForecastFiles:", error);
    process.exit(1);
});