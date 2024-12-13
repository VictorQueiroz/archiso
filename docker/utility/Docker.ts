import { spawn } from 'child-process-utilities';
import { IOptions } from 'child-process-utilities/createSpawnWithDefaultOptions';
import Exception from '../../src/core/Exception';
import configuration from '../../src/configuration';
import mergeDockerOptions, {
  DockerMode,
  IDockerOptions,
  IRunOptions
} from './mergeDockerOptions';

export { DockerMode };

export interface IDockerRunOptions extends IOptions {
  /**
   * Arguments before `-it`
   */
  dockerPrefixArguments: string[];
}

export default class Docker {
  readonly #options: IDockerOptions;

  public constructor(options: Partial<IDockerOptions> = {}) {
    this.#options = mergeDockerOptions(
      {
        dockerArguments: {
          mode: {
            [DockerMode.Run]: {
              prefix: []
            },
            [DockerMode.Exec]: {
              prefix: []
            }
          }
        },
        user: null,
        ...options
      },
      options
    );
  }

  public setRunOptions(mode: DockerMode, dockerArguments: IRunOptions) {
    this.#options.dockerArguments.mode[mode] = dockerArguments;
  }

  public exec(cmd: string, args: string[], options: IOptions = {}) {
    return this.#spawn('exec', cmd, args, options);
  }

  public run(cmd: string, args: string[], options: Partial<IDockerRunOptions> = {}) {
    return this.#spawn('run', cmd, args, options);
  }

  public fromWorkDir(rootDir: string, workDir = '/opt/build') {
    return new Docker(
      mergeDockerOptions(this.#options, {
        dockerArguments: {
          mode: {
            [DockerMode.Run]: {
              prefix: ['-v', `${rootDir}:${workDir}`, '-w', workDir]
            },
            [DockerMode.Exec]: {
              prefix: ['-w', workDir]
            }
          }
        }
      })
    );
  }

  #spawn(
    dockerSubCommand: 'exec' | 'run',
    cmd: string,
    args: string[],
    options: IDockerRunOptions | IOptions = {}
  ) {
    let dockerSubCommandArgs: string[];
    switch (dockerSubCommand) {
      case 'exec':
        dockerSubCommandArgs =
          this.#options.dockerArguments.mode[DockerMode.Exec].prefix;
        break;
      case 'run':
        if('dockerPrefixArguments' in options) {
          dockerSubCommandArgs = options.dockerPrefixArguments;
        } else {
          dockerSubCommandArgs = [];
        }
        dockerSubCommandArgs = [
          ...this.#options.dockerArguments.mode[DockerMode.Run].prefix,
          ...dockerSubCommandArgs,
          '--rm',
        ];
        break;
      default:
        throw new Exception(`Unknown docker subcommand: ${dockerSubCommand}`);
    }

    /**
     * Clone the array to avoid mutating the original array.
     */
    dockerSubCommandArgs = dockerSubCommandArgs.slice(0);

    if (this.#options.user) {
      dockerSubCommandArgs.push('--user', this.#options.user);
    }

    /**
     * Add the container name argument.
     */
    dockerSubCommandArgs.push('--name', configuration.docker.containerName);

    /**
     * Add the last Docker command arguments before the actual commands.
     */
    switch(dockerSubCommand) {
      case 'exec':
        dockerSubCommandArgs.push('-it', configuration.docker.image.name);
        break;
      case 'run':
        dockerSubCommandArgs.push('-t', configuration.docker.image.name);
        break;
    }

    return spawn(
      'docker',
      [
        dockerSubCommand,
        '--network=host',
        '--privileged',
        ...dockerSubCommandArgs,
        cmd,
        ...args
      ],
      { log: true, ...options }
    );
  }
}
