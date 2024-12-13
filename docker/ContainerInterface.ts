import { IOptions } from 'child-process-utilities/createSpawnWithDefaultOptions';
import { spawn } from 'child-process-utilities';
import { dockerDefaultArguments } from './docker';

export interface IContainerInterfaceOptions {
  /**
   * Arguments to be passed to the `docker run` commands, after `-it`,
   * and before the `command` argument on the `run` method.
   *
   * This can be useful to append `sudo` to every command without having
   * to specifically use `sudo` everywhere.
   */
  containerCommandArguments: string[];

  /**
   * Arguments to be passed to the `docker exec` commands, after `-it`,
   */
  dockerExecArguments: string[];
}

/**
 * @deprecated Use the `Docker` class instead
 */
export default class ContainerInterface {
  /**
   * Path to the local directory which will be transformed into
   * a remote volume where we should link to `workDir`.
   */
  readonly #rootDir;
  readonly #dockerArgs: string[];
  readonly #options;

  public constructor(
    rootDir: string,
    dockerArgs: string[] = [],
    options: Partial<IContainerInterfaceOptions> = {}
  ) {
    this.#options = {
      //       workDir: `/tmp/build-${crypto.randomUUID()}`,
      workDir: `/tmp/build`,
      containerCommandArguments: [],
      dockerExecArguments: [],
      ...options
    };

    this.#rootDir = rootDir;
    this.#dockerArgs = dockerArgs;
  }

  /**
   * This command will run inside `rootDir` by default. Unless `-w` is specified
   * in the `dockerArgs` argument.
   *
   * This command only work if the Docker container is already running.
   */
  public exec(cmd: string, args: string[] = [], options: IOptions = {}) {
    return this.#spawn('exec', cmd, args, options);
  }

  /**
   * This command will run inside `rootDir` by default. Unless `-w` is specified
   * in the `dockerArgs` argument.
   */
  public run(cmd: string, args: string[] = [], options: IOptions = {}) {
    return this.#spawn('run', cmd, args, options);
  }

  /**
   * Call the Docker executable from this Node.js process
   * according to the given arguments.
   *
   * @param dockerSubcommand The Docker subcommand to be executed (`run` or `exec`).
   * @param cmd The command to be executed.
   * @param args The arguments for the `cmd` parameter.
   */
  #spawn(
    dockerSubcommand: 'exec' | 'run',
    cmd: string,
    args: string[],
    options: IOptions
  ) {
    const dockerArgs = [
      '-w',
      this.#options.workDir,
      ...this.#dockerArgs,
      ...dockerDefaultArguments
    ];

    if (dockerSubcommand === 'run') {
      dockerArgs.push('-v', `${this.#rootDir}:${this.#options.workDir}`);
    } else {
      dockerArgs.push(...this.#options.dockerExecArguments);
    }

    const containerCommandArguments = Array.from(
      this.#options.containerCommandArguments
    );

    // Add the command prefix arguments to the command
    if (containerCommandArguments.length) {
      // Cache the initially given `cmd` variable
      const initialCmd = cmd;

      // If there is at least one item in `containerCommandArguments`, this will be the new `cmd` argument.
      cmd = containerCommandArguments.shift() ?? cmd;

      args = [...containerCommandArguments, initialCmd, ...args];
    }

    return spawn('docker', [dockerSubcommand, ...dockerArgs, cmd, ...args], {
      log: true,
      ...options
    });
  }
}
