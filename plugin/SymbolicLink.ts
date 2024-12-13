import path from 'path';
import Docker from '../docker/utility/Docker';
import RootFileSystemResolver from '../src/core/RootFileSystemResolver';
import { IPlugin, IPluginContext } from './Plugin';
import Exception from '../src/core/Exception';

export interface ISymbolicLinkOptions {
  /**
   * Absolute path since the rootfs
   */
  from: string;
  /**
   * Absolute path since the rootfs
   */
  to: string;
}

const enum SymbolicLinkTargetType {
  File,
  Directory
}

export default class SymbolicLink implements IPlugin {
  readonly #options;
  public constructor(opts: ISymbolicLinkOptions) {
    this.#options = opts;
  }
  public async run(ctx: IPluginContext): Promise<void> {
    const rootfs = new RootFileSystemResolver(ctx.airootfsDir);

    const bareContainer = new Docker();
    const symLinkInfo: {
      from: SymbolicLinkTargetType | null;
      to: SymbolicLinkTargetType | null;
    } = {
      from: null,
      to: null
    };

    for (const target of ['from', 'to'] as const) {
      for (const [arg, checkType] of [
        ['-f', 'file'],
        ['-d', 'directory']
      ] as const) {
        try {
          const testArgs: string[] = [arg];

          if (target === 'from') {
            testArgs.push(this.#options.from);
          } else {
            testArgs.push(this.#options.to);
          }

          await bareContainer.run('test', testArgs).wait();
        } catch (err) {
          console.error(
            'Failed to run `test` executable for %s: %o',
            target,
            err
          );
          continue;
        }

        /**
         * If we reach here, the `test` command exited with status zero.
         */
        switch (checkType) {
          case 'file':
            symLinkInfo[target] = SymbolicLinkTargetType.File;
            break;
          case 'directory':
            symLinkInfo[target] = SymbolicLinkTargetType.Directory;
            break;
        }
      }
    }

    /**
     * If the source file does not exist, throw a descriptive error.
     */
    if (symLinkInfo.from === null) {
      throw new Exception(
        `The source file does not exist: ${this.#options.from}`
      );
    }

    /**
     * If the source file is a file, make sure the destination does not exist.
     */

    /**
     * Check if the source is a file
     */
    const docker = new Docker({
      dockerArguments: {
        mode: {
          run: {
            prefix: [
              '-v',
              `${path.dirname(rootfs.resolve(this.#options.to))}:/opt/rootfs/${path.dirname(this.#options.to)}`
            ]
          },
          exec: { prefix: [] }
        }
      },
      user: 'root',
    });

    await docker
      .run('ln', [
        '-v',
        '-s',
        '-f',
        this.#options.from,
        `/opt/rootfs/${this.#options.to}`
      ])
      .wait();
  }
}
