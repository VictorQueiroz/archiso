import { IPlugin, IPluginContext } from './Plugin';
import Docker from '../docker/utility/Docker';
import path from 'path';

export interface ICopyRootFileSystemOptions {
  srcDir: string;
}

export default class CopyRootFileSystem implements IPlugin {
  /**
   * Root file system files
   */
  readonly #srcDir;
  public constructor(options: ICopyRootFileSystemOptions) {
    this.#srcDir = options.srcDir;
  }
  public async run(ctx: IPluginContext): Promise<void> {
    const localSrcDirectory = '/opt/rootfs/source';
    const localDestDirectory = '/opt/rootfs/dest';

    const docker = new Docker({
      dockerArguments: {
        mode: {
          exec: { prefix: [] },
          run: {
            prefix: [
              '-v',
              `${this.#srcDir}:${localSrcDirectory}`,
              '-v',
              `${ctx.airootfsDir}:${localDestDirectory}`,
              '-w',
              this.#srcDir
            ]
          }
        }
      }
    });

    const files = (
      await docker
        .run('find', [localSrcDirectory, '-type', 'f'], { stdio: 'pipe' })
        .output()
        .stdout()
        .decode('utf8')
    )
      .split('\n')
      .map((f) =>
        /**
         * Remove trailing newline
         */
        f.replace(/\r$/, '')
      )

      /**
       * Remove empty paths
       */
      .filter((f) => f.length > 0);

    for (const file of files) {
      const installPath = (
        await docker
          .run('realpath', ['--relative-to', localSrcDirectory, file], {
            stdio: 'pipe'
          })
          .output()
          .stdout()
          .decode('utf8')
      ).trim();

      await docker
        .run('install', [
          '-v',
          '-D',
          file,
          path.join(localDestDirectory, installPath)
        ])
        .wait();
    }
  }
}
