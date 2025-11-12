import { existsSync } from "node:fs";
import { readdir, mkdir, readFile, writeFile } from "node:fs/promises";

type PiskelFileLayerChunk = {
  layout: unknown[];
  base64PNG: Base64URLString;
};

type PiskelFileLayer = {
  name: string;
  opacity: number;
  frameCount: number;
  chunks: PiskelFileLayerChunk[];
};

type PiskelFile = {
  modelVersion: number;
  piskel: {
    name: string;
    description: string;
    fps: number;
    height: number;
    width: number;
    layers: string[];
  };
};

type ConvertOptions = {
  writeDir: string;
};

async function convertPiskelToPNG(file: string, options: ConvertOptions) {
  const fileName = file.split("/")[file.split("/").length - 1];
  const fileExtension = fileName.split(".")[1];

  if (fileExtension !== "piskel") {
    return;
  }

  let data: string | null = null;
  let dataErr: NodeJS.ErrnoException | null = null;

  try {
    data = await readFile(file, { encoding: "utf-8" });
  } catch (error: any) {
    dataErr = error;
  }

  if (data === null) {
    return;
  }
  if (dataErr !== null) {
    console.error(dataErr.message);
    return;
  }

  let fileData: PiskelFile | null = null;
  let fileDataErr: NodeJS.ErrnoException | null = null;

  try {
    fileData = JSON.parse(data);
  } catch (error: any) {
    fileDataErr = error;
  }

  if (fileData === null) {
    return;
  }
  if (fileDataErr !== null) {
    console.error(fileDataErr.message);
    return;
  }

  const layers: PiskelFileLayer[] = [];
  const layerChunks: PiskelFileLayerChunk[] = [];

  for (const layerStr of fileData.piskel.layers) {
    try {
      const layer: PiskelFileLayer = JSON.parse(layerStr);
      layers.push(layer);
    } catch (error: any) {
      console.error("Failed to parse a file layer: ", error.message);
    }
  }
  for (const layer of layers) {
    for (const chunk of layer.chunks) {
      layerChunks.push(chunk);
    }
  }
  for (const chunk of layerChunks) {
    const buffer = Buffer.from(chunk.base64PNG.split(",")[1], "base64");

    try {
      await writeFile(
        `${options.writeDir}/${fileName.split(".")[0]}.png`,
        buffer
      );
    } catch (error: any) {
      console.error("Failed to write file: ", error.message);
    }
  }
}

const VALID_READ_ARGS = ["--r", "--read", "--readDir"];
const VALID_WRITE_ARGS = ["--w", "--write", "--writeDir"];

function getProcessArg(...args: string[]): string | null {
  const processArgs = process.argv.slice(2);

  for (const processArg of processArgs) {
    const processArgList = processArg.split("=");

    if (args.map((arg) => arg.toLowerCase()).includes(processArgList[0])) {
      return processArgList[1];
    }
  }

  return null;
}

async function init() {
  let readDir: string | null = null;
  let writeDir: string | null = null;

  readDir = getProcessArg(...VALID_READ_ARGS);
  writeDir = getProcessArg(...VALID_WRITE_ARGS);

  if (readDir === null || writeDir === null) {
    return;
  }
  if (!existsSync(readDir)) {
    return;
  }
  if (!existsSync(writeDir)) {
    try {
      await mkdir(writeDir, { recursive: true });
    } catch (error: any) {
      console.error("Failed to create write directory: ", error.message);
    }
  }

  try {
    const files = await readdir(readDir, { encoding: "utf-8" });

    for (const file of files) {
      await convertPiskelToPNG(`${readDir}/${file}`, {
        writeDir,
      });
    }
  } catch (error: any) {
    console.error("Failed to read directory: ", error.message);
  }
}

init();
