import TextStream from "@textstream/core";
import RingBufferWritableStream from "@textstream/core/RingBufferWritableStream";
import fs from "node:fs";
import path from "node:path";

export default class TextStreamWritableStream extends TextStream {
  readonly #writable;
  readonly #outFile;
  public constructor(dest: string) {
    const stream = fs.createWriteStream(dest);
    const writable = new RingBufferWritableStream({
      writable: stream,
      textEncoder: new TextEncoder(),
    });
    super({
      writable,
      indentationSize: 2,
    });
    this.#outFile = dest;
    this.#writable = writable;
  }

  /**
   * Creates the directory for the output file, if it does not already exist.
   *
   * @returns A promise that resolves when the directory has been created.
   */
  public async prepare() {
    // Create the output directory
    await fs.promises.mkdir(path.dirname(this.#outFile), {
      recursive: true,
    });
  }

  public async wait() {
    await this.#writable.wait();
  }
}
