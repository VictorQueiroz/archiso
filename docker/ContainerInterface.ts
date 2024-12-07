import {IOptions} from "child-process-utilities/createSpawnWithDefaultOptions";
import docker from "./docker";

export default class ContainerInterface {
  /**
   * Path to the local directory which will be transformed into
   * a remote volume where we should link to `workDir`.
   */
  readonly #rootDir;
  readonly #workDir;
  readonly #dockerArgs: string[];

  public constructor(rootDir: string, dockerArgs: string[] = [], workDir: string = `/tmp/build-${crypto.randomUUID()}`) {
    this.#rootDir = rootDir;
    this.#workDir = workDir;
    this.#dockerArgs = dockerArgs;
  }

  public run(cmd: string, args: string[] = [], options: IOptions = {}) {
    return docker(cmd, args, [
      '-v',
      `${this.#rootDir}:${this.#workDir}`,
      '-w',
      this.#workDir,
      ...this.#dockerArgs,
    ], options);
  }
}
