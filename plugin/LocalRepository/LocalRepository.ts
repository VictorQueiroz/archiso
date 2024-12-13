import path from 'path';
import fs from 'fs';
import { IPlugin, IPluginContext } from '../Plugin';
import configuration from '../../src/configuration';
import processPackageItem from '../../preset/core/package/processPackageItem';
import PackageNameParser, {
  IParsedPackageName
} from '../../preset/core/package/PackageNameParser';
import { ParsedPackageFlag } from '../../preset/core/package/ParsedPackageFlag';
import RootFileSystemResolver from '../../src/core/RootFileSystemResolver';
import { spawn } from 'child-process-utilities';
import os from 'os';
import Docker, { DockerMode } from '../../docker/utility/Docker';
import { glob } from 'glob';

export default class LocalRepository implements IPlugin {
  //  readonly #dockerWorkDir;
  //  readonly #dockerRunPrefixArguments;
  //  readonly #dockerOptions;
  readonly #zstDirectories;
  readonly #docker;
  readonly #sudo;
  readonly #localPaths;
  readonly #paths;
  readonly #localRepoDatabaseFile;
  readonly #rootfs;

  public constructor() {
    /**
     * Create the instance that will resolve paths such as `/etc/pacman.conf`
     * to `$projectRootDir/airootfs/etc/pacman.conf`
     */
    const rootfs = new RootFileSystemResolver(configuration.paths.aiRootFs);

    const localPaths = (() => {
      const buildDirectory = '/opt/build';
      const pacman = { db: '/var/lib/pacman' };
      return {
        build: buildDirectory,
        repositories: {
          local: `/opt/repositories/${configuration.localRepository.databaseFileName}`
        },
        aur: {
          gitRepostories: path.resolve(buildDirectory, 'aur')
        },
        pacman: {
          pgp: '/etc/pacman.d/gnupg',
          data: pacman.db,
          configurationFile: '/etc/pacman.conf',
          cache: '/var/cache/pacman',
          sync: path.resolve(pacman.db, 'sync')
        }
      };
    })();

    const paths = {
      build: configuration.paths.buildDirectory,
      aur: {
        gitRepositories: configuration.paths.aurPackages
      },
      repositories: {
        local: rootfs.resolve(localPaths.repositories.local)
      },
      pacman: {
        pgp: rootfs.resolve(localPaths.pacman.pgp),
        configurationFile: rootfs.resolve(localPaths.pacman.configurationFile),
        data: rootfs.resolve(localPaths.pacman.data),
        cache: rootfs.resolve(localPaths.pacman.cache),
        sync: rootfs.resolve(localPaths.pacman.sync)
      }
    };

    const localRepoDatabaseFile = path.resolve(
      localPaths.repositories.local,
      `${configuration.localRepository.databaseFileName}.db.tar.gz`
    );

    const dockerWorkDir = '/opt/rootfs';
    const dockerRunPrefixArguments = [
      // Link /var/lib/pacman/sync
      '-v',
      `${paths.pacman.sync}:${localPaths.pacman.sync}`,

      '-v',
      `${configuration.paths.aiRootFs}:${dockerWorkDir}`,

      '-w',
      dockerWorkDir,

      // Link Pacman's PGP directoryq
      '-v',
      `${paths.pacman.pgp}:${localPaths.pacman.pgp}`,

      '-v',
      `${paths.repositories.local}:${localPaths.repositories.local}`,

      // Link `/opt/build/aur`
      '-v',
      `${paths.aur.gitRepositories}:${localPaths.aur.gitRepostories}`,

      // Link mirrorlist
      '-v',
      `${paths.pacman.configurationFile}:${localPaths.pacman.configurationFile}`,

      // Link pacman's cache
      '-v',
      `${paths.pacman.cache}:${localPaths.pacman.cache}`,

      // Connect systemd enabled/disabled system services directories in case any links happen.
      '-v',
      `${rootfs.resolve('/etc/systemd/system')}:/etc/systemd/system`,

      '-v',
      '/run/systemd/system-disabled:/etc/systemd/system-disabled'
    ];

    const dockerOptions = {
      dockerArguments: {
        mode: {
          [DockerMode.Run]: {
            prefix: dockerRunPrefixArguments
          },
          [DockerMode.Exec]: {
            prefix: []
          }
        }
      }
    };

    const docker = new Docker(dockerOptions);

    const sudo = new Docker({
      ...dockerOptions,
      user: 'root'
    });

    /**
     * Outside-of-the-container directories containing `.zst` files.
     */
    const zstDirectories = [paths.pacman.cache, paths.aur.gitRepositories];

    //    this.#dockerWorkDir = dockerWorkDir;
    //    this.#dockerRunPrefixArguments = dockerRunPrefixArguments;
    //    this.#dockerOptions = dockerOptions;
    this.#docker = docker;
    this.#sudo = sudo;
    this.#localPaths = localPaths;
    this.#paths = paths;
    this.#localRepoDatabaseFile = localRepoDatabaseFile;
    this.#rootfs = rootfs;
    this.#zstDirectories = zstDirectories;
  }

  public async run(ctx: IPluginContext): Promise<void> {
    await this.#createLocalRepository(ctx);
  }

  async #createLocalRepository(ctx: IPluginContext) {
    await spawn('sudo', ['systemctl', 'daemon-reload']).wait();
    await spawn('sudo', ['systemctl', 'restart', 'reflector']).wait();

    /**
     * NOTE: Inside this function, anything prefixed with `local`, means that
     * it is something related to outside of the Docker container.
     */

    /**
     * Get the preset packages
     */
    const { packages } = ctx.preset.architecture.x86_64;

    const localPaths = this.#localPaths;
    const paths = this.#paths;
    const sudo = this.#sudo;
    const docker = this.#docker;

    /**
     * Create the following directories while giving permission to the container user.
     */
    for (const dir of [
      localPaths.repositories.local,
      localPaths.aur.gitRepostories
    ]) {
      await sudo.run('mkdir', ['-pv', dir]).wait();
      await sudo
        .run('chown', [
          '-v',
          `${configuration.docker.image.user}:${configuration.docker.image.user}`,
          dir
        ])
        .wait();
    }

    const databaseFileName = `${configuration.localRepository.databaseFileName}.db.tar.gz`;

    /**
     * Local absolute path to the local repository database
     */
    const localRepoDatabaseFile = path.resolve(
      localPaths.repositories.local,
      databaseFileName
    );

    // Create the local repository database
    {
      /**
       * Sign the database from the Docker containe
       */
      await sudo.run('repo-add', ['-v', '-s', localRepoDatabaseFile]).wait();
    }

    /**
     * Create local repository directories from the
     * Docker container.
     */
    for (const dir of ['/var/cache/pacman/pkg', '/etc/pacman.d/gnupg']) {
      await sudo.run('mkdir', ['-pv', dir]).wait();
    }

    /**
     * Initialize the pacman keyring
     */
    await sudo.run('pacman-key', ['--init']).wait();

    /**
     * Initialize the pacman keyring
     */
    await sudo.run('pacman-key', ['--populate', 'archlinux']).wait();

    const allPackages = new Array<string>();

    for (const pkg of packages) {
      allPackages.push(...processPackageItem(pkg));
    }

    /**
     * AUR repositories
     */
    const aurPackages = new Array<IParsedPackageName>();

    /**
     * Package names
     */
    const packageNames = new Array<string>();

    // Iterate over the `packages` array, and remove the packages that start with the `aur:` prefix
    // and add them to the `aurPackages` array without the prefix.
    for (const pkgName of allPackages) {
      const parsed = new PackageNameParser(pkgName).read();

      if (parsed.flags.includes(ParsedPackageFlag.ArchLinuxUserRepository)) {
        aurPackages.push(parsed);
        continue;
      }

      packageNames.push(parsed.packageName);
    }

    const pacmanArgs: string[] = ['--noconfirm'];

    // Now that we have the `pacman` directories created, let's synchronize pacman
    await sudo.run('pacman', [...pacmanArgs, '-Sy']).wait();

    // pacman -Tv
    await sudo.run('pacman', [...pacmanArgs, '-Tv']).wait();

    // FIXME: Make this optional, it can become problematic.
    let shouldDownloadPackages = true;

    while (shouldDownloadPackages) {
      try {
        await sudo
          .run('pacman', [...pacmanArgs, '-Syw', ...packageNames])
          .wait();
        shouldDownloadPackages = false;
      } catch (reason) {
        console.log(
          'Failed! It is possible the repository already exists: %o',
          reason
        );
        shouldDownloadPackages = true;

        // Wait 1 second
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await spawn('sudo', [
          // Run reflector and get as many mirrors as possible to avoid any sort of network failure
          'reflector',
          '--verbose',
          '--protocol',
          'https',
          '--latest',
          '40',
          '--sort',
          'rate',
          '--save',
          this.#rootfs.resolve('/etc/pacman.d/mirrorlist')
        ]).wait();
      }
    }

    for (const pkg of aurPackages) {
      // Output directory of AUR packages
      const outPkgRepo = path.resolve(
        localPaths.aur.gitRepostories,
        `${pkg.packageName}`
      );
      const aurRoot = docker.fromWorkDir(paths.build);

      try {
        await aurRoot
          .run('git', [
            'clone',
            `https://aur.archlinux.org/${pkg.packageName}.git`,
            outPkgRepo
          ])
          .wait();
      } catch (reason) {
        console.error(
          'Failed! It is possible the repository already exists: %o',
          reason
        );

        // Pull the repository if it already exists
        await aurRoot.run('git', ['-C', outPkgRepo, 'pull']).wait();
      }

      const makePkg = docker.fromWorkDir(
        path.resolve(paths.aur.gitRepositories, pkg.packageName),
        '/tmp/makepkg'
      );

      // Delete `.git/objects/info/alternates` if it exists, to avoid the "error: not a git repository"
      await makePkg
        .run('rm', ['-f', '-v', '.git/objects/info/alternates'])
        .wait();

      // git repack -a -d
      await makePkg.run('git', ['repack', '-a', '-d']).wait();

      // git prune
      await makePkg.run('git', ['prune']).wait();

      const makePkgArgs = [
        '--geninteg',
        '--sign',
        '--log',
        '--noconfirm',
        '--syncdeps'
      ];

      if (pkg.flags.includes(ParsedPackageFlag.CleanBuild)) {
        makePkgArgs.push('--cleanbuild');
      }

      // Build the package
      await makePkg.run('makepkg', makePkgArgs).wait();

      // Add the package to the local repository
      await this.#refreshPackages();
    }

    await this.#refreshPackages();

    const tmpDir = await fs.promises.mkdtemp(os.tmpdir());
    const dockerPrefixArguments = new Array<string>();
    const containerZstDirectoryList = new Array<string>();

    for (let i = 0; i < this.#zstDirectories.length; i++) {
      const localZstDirectoryName = `/tmp/built/repo${i}`;

      // Bind the zst directory to the container
      dockerPrefixArguments.push(
        '-v',
        `${this.#zstDirectories[i]}:${localZstDirectoryName}`
      );

      containerZstDirectoryList.push(localZstDirectoryName);
    }

    const builtPackages = sudo.run('find', containerZstDirectoryList, {
      stdio: 'pipe',
      dockerPrefixArguments
    });

    const builtPackageListFile = path.resolve(tmpDir, 'packages');

    builtPackages.childProcess.stdout?.pipe(
      fs.createWriteStream(builtPackageListFile)
    );

    // Wait for the built packages to finish being pipped to the file that contains the list of package absolute paths
    await builtPackages.wait();

    console.log('All package names saved to: %s', builtPackageListFile);

    await sudo
      .run('rsync', [
        '--progress',
        '-avz',
        '--files-from',
        builtPackageListFile,
        localPaths.repositories.local
      ])
      .wait();
  }

  async #refreshPackages() {
    const sudo = this.#sudo;
    const localRepoDatabaseFile = this.#localRepoDatabaseFile;

    /**
     * Find *.zst generated pckage files and add them to a list to be later
     * added to the custom local repository.
     */
    //     const findArgs = await sudo
    //       .run('find', findBuiltPackagesArgs, {
    //         log: true,
    //         /**
    //          * Make sure we can pipe the stdout of the command, so we can use it
    //          */
    //         stdio: 'pipe'
    //       })
    //       .output()
    //       .stdout()
    //       .decode('utf8');

    const files = await glob(
      this.#zstDirectories.map((folder) => path.join(folder, '**/*.zst'))
    );

    // const packageFileList = Array.from(files);
    const packageFileList = new Map<string, string[]>();

    for (const file of files) {
      const key = path.dirname(file);
      let packages = packageFileList.get(key) ?? null;

      if (packages === null) {
        packages = [];
        packageFileList.set(key, packages);
      }

      packages.push(file);
    }

    /**
     * Define how many packages we are going to add to the local repository
     * per `repo-add` command.
     */
    const packagePerCommand = 40;

    for (const [packagesRootDir, packages] of packageFileList) {
      while (packages.length > 0) {
        /**
         * Since during the `find` call, the container will be running,
         * let's use `exec` here to avoid Docker errors.
         *
         * TODO: Check how reliable is this!
         */
        const localZstFolder = `/tmp/packages`;
        const localPackagePaths = packages
          .splice(0, packagePerCommand)
          .map((file) => path.resolve(localZstFolder, path.basename(file)));
        console.log(
          'Adding %d packages, %d remaining',
          localPackagePaths.length,
          packages.length
        );
        await sudo
          .run('repo-add', [localRepoDatabaseFile, ...localPackagePaths], {
            dockerPrefixArguments: [
              '-v',
              `${packagesRootDir}:${localZstFolder}`
            ]
          })
          .wait();
      }
    }
  }
}
