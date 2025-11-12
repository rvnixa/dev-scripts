import { readdir, readFile, writeFile } from "node:fs";

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

function convertPiskelToPNG(file: string, options: ConvertOptions) {
  const fileName = file.split("/")[file.split("/").length - 1];
  const fileExtension = fileName.split(".")[1];

  if (fileExtension !== "piskel") {
    return;
  }

  readFile(file, { encoding: "utf-8" }, (err, data) => {
    if (err !== null) {
      console.error("Failed to read from file: ", err.message);
    }

    try {
      const fileData: PiskelFile = JSON.parse(data);

      for (const layerStr of fileData.piskel.layers) {
        try {
          const layer: PiskelFileLayer = JSON.parse(layerStr);

          for (const chunk of layer.chunks) {
            const buffer = Buffer.from(chunk.base64PNG.split(",")[1], "base64");

            writeFile(
              `${options.writeDir}/${fileName.split(".")[0]}.png`,
              buffer,
              (err) => {
                if (err !== null) {
                  console.error("Failed to write a file: ", err.message);
                }
              }
            );
          }
        } catch (error: any) {
          console.error("Failed to parse a file layer: ", error.message);
        }
      }
    } catch (error: any) {
      console.error("Failed to parse the file data: ", error.message);
    }
  });
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

function init() {
  let readDir: string | null = null;
  let writeDir: string | null = null;

  readDir = getProcessArg(...VALID_READ_ARGS);
  writeDir = getProcessArg(...VALID_WRITE_ARGS);

  if (readDir === null || writeDir === null) {
    return;
  }

  readdir(readDir, { encoding: "utf-8" }, (err, files) => {
    if (err !== null) {
      console.error("Failed to read directory: ", err.message);
    }

    for (const file of files) {
      convertPiskelToPNG(`${readDir}/${file}`, {
        writeDir,
      });
    }
  });
}

init();
