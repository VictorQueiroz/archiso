import {spawn} from "child-process-utilities";
import {IPlugin, IPluginContext} from "./Plugin";

export interface ICopyRootFileSystemOptions {
  srcDir: string;
}

export default class CopyRootFileSystem implements IPlugin {
  readonly #srcDir;
  public constructor(options: ICopyRootFileSystemOptions) {
    this.#srcDir = options.srcDir;
  }
  public async run(ctx: IPluginContext): Promise<void> {
    console.log(this.#srcDir);
    await spawn('find', [
      this.#srcDir,
      '-type', 'f',
      '-exec',
      'install',
      '-v',
      '-D',
      // '-t',
      '{}',
      `${ctx.airootfsDir}/{}`,
      ';',
    ]).wait();
  }
}
