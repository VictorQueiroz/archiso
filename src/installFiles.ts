import fs from "node:fs";
import path from "node:path";
import configuration from "./configuration";
import { spawn } from "child-process-utilities";

export interface InstallFile {
  source:
    | {
        url: string;
      }
    | {
        path: string;
      };
  dest: string;
  symbolicLink?: boolean;
}

export default async function installFiles(destType: 'airootfs', files: InstallFile[]) {
  const streams = new Array<fs.WriteStream | Promise<unknown>>();
  for (const file of files) {
    const outFile = path.resolve(
      destType === 'airootfs'
        ? configuration.paths.aiRootFs
        : configuration.isoFolder,
      file.dest.replace(/^\/+/, ""),
    );

    /**
     * Always create the directory before moving the file
     */
    await fs.promises.mkdir(path.dirname(outFile), { recursive: true });

    console.log('Created directory', path.dirname(outFile));

    const src = file.source;
    if ("url" in src) {
      streams.push(spawn.wait("wget", ["-O", outFile, src.url]));
    } else {
      if ("symbolicLink" in src) {
        streams.push(fs.promises.symlink(src.path, outFile, 'file'));
      } else {
        const outFileStream = fs.createWriteStream(outFile);
        streams.push(fs.createReadStream(src.path).pipe(outFileStream));
      }
    }
  }

  await Promise.all(streams);
}

