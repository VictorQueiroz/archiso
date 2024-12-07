import path from 'path';
import fs from 'fs';
import { IPlugin, IPluginContext } from './Plugin';
import { spawn } from 'child-process-utilities';
import TextStreamWritableStream from '../src/TextStreamWritableStream';
import gitClone from '../preset/core/git/gitClone';
import ContainerInterface from '../docker/ContainerInterface';
import configuration from '../src/configuration';
import processPackageItem from '../preset/core/package/processPackageItem';
import PackageNameParser, {ParsedPackageFlag} from '../preset/core/package/PackageNameParser';

function removeLeadingSlash(str: string) {
  return str.replace(/^\/+/, '');
}

class RootFileSystemResolver {
  readonly #localRootFileSystem;
  public constructor(localRootFileSystem: string) {
    this.#localRootFileSystem = localRootFileSystem;
  }
  public resolve(absolutePath: string) {
    return path.resolve(
      this.#localRootFileSystem,
      absolutePath.replace(/^\/+/, '')
    );
  }
}

function hasFlag(flagName: string): (pkgName: string) => string | null {
  return (pkgName) => {
    const transformedPkgName = pkgName.replace(
      new RegExp(`(${flagName};|;${flagName}$)`),
      ''
    );
    // Let's avoid unnecessarily cleaning the package-building directory
    if (transformedPkgName === pkgName) {
      return null;
    }

    // Return the package name without the suffix
    return transformedPkgName;
  };
}

export default class LocalRepository implements IPlugin {
  public async run(ctx: IPluginContext): Promise<void> {
    await this.#createLocalRepository(ctx);
  }

  async #createLocalRepository(ctx: IPluginContext) {
    const rootfs = new RootFileSystemResolver(ctx.airootfsDir);
    const { packages } = ctx.preset.architecture.x86_64;

    const localPaths = {
      repositories: {
        local: '/opt/repositories/local'
      },
      pacman: {
        database: '/var/lib/pacman/db',
        configurationFile: '/etc/pacman.conf',
        cache: '/var/cache/pacman/pkg'
      }
    };

    const paths = {
      repositories: {
        local: rootfs.resolve(localPaths.repositories.local)
      },
      pacman: {
        configurationFile: rootfs.resolve(localPaths.pacman.configurationFile),
        cache: rootfs.resolve(localPaths.pacman.cache),
        database: rootfs.resolve(localPaths.pacman.database)
      }
    };

    // Create local repository directories
    for (const dir of [paths.pacman.cache, paths.pacman.database]) {
      await fs.promises.mkdir(dir, { recursive: true });
    }

    const allPackages = new Array<string>();

    for(const pkg of packages) {
      allPackages.push(...processPackageItem(pkg));
    }

    /**
     * AUR repositories
     */
    const aurPackages = new Array<string>();

    /**
     * Package names
     */
    const packageNames = new Array<string>();

    // Iterate over the `packages` array, and remove the packages that start with the `aur:` prefix
    // and add them to the `aurPackages` array without the prefix.
    for (const pkgName of allPackages) {
      const parsed = new PackageNameParser(pkgName).read();

      if(parsed.flags.includes(ParsedPackageFlag.ArchLinuxUserRepository)) {
        aurPackages.push(parsed.packageName);
        continue;
      }

      packageNames.push(pkgName);
    }

    const pacmanArgs = [
      '--dbpath',
      paths.pacman.database,
      '--cachedir',
      paths.pacman.cache,
      '--config',
      paths.pacman.configurationFile
    ];

    const localRepositoryFiles = new Array<string>();

    const absolutePackageManagerCache = path.resolve(
      ctx.rootDir,
      removeLeadingSlash(localPaths.pacman.cache)
    );

    for (let pkg of aurPackages) {
      const aurPath = configuration.paths.aurPackages;
      const outPkgRepo = path.resolve(aurPath, `${pkg}`);
      const runner = new ContainerInterface(outPkgRepo, [
        '-v',
        `${absolutePackageManagerCache}:/var/cache/pacman/pkg`,
        // Link /etc/pacman.conf
        '-v',
        `${paths.pacman.configurationFile}:/etc/pacman.conf`
      ]);

      const makePkgArgs = ['--force', '--noconfirm', '--syncdeps'];

      // Let's avoid unnecessarily cleaning the package-building directory
      const testCleanBuild = hasFlag('cleanbuild')(pkg);

      if (testCleanBuild !== null) {
        makePkgArgs.push('--cleanbuild');
        pkg = testCleanBuild;
     }

      // Create the local repository path
      await fs.promises.mkdir(paths.repositories.local, { recursive: true });

      try {
        await fs.promises.access(outPkgRepo, fs.constants.R_OK);
      } catch (e) {
        console.error('Failed to access "%s": %o', aurPath, e);

        await gitClone(
          `https://aur.archlinux.org/${pkg}.git`,
          outPkgRepo
        ).wait();
      }

      await runner.run('makepkg', makePkgArgs);

      /**
       * Find *.zst generated package files and add them to a list to be later
       * added to the custom local repository.
       */
      const builtZstFiles = spawn.pipe(
        'find',
        [
          outPkgRepo,
          '-maxdepth',
          '1',
          '-name',
          '*.zst',
        ],
        {
          log: true
        }
      );
      for await(const zstFile of builtZstFiles.output().stdout().split('\n')) {
        console.log('Found package: %s', zstFile);
        localRepositoryFiles.push(zstFile);
      }
    }

    // pacman -Tv
    await spawn('sudo', ['pacman', ...pacmanArgs, '--noconfirm', '-Tv']).wait();

    // Now that we have the `pacman` directories created, let's synchronize pacman
    await spawn('sudo', ['pacman', ...pacmanArgs, '--noconfirm', '-Sy']).wait();

    await spawn('sudo', [
      'pacman',
      ...pacmanArgs,
      '--noconfirm',
      '-Sw',
      ...packageNames
    ]).wait();

    const localRepoWritable = new TextStreamWritableStream(
      rootfs.resolve('/etc/pacman.d/local-repo.conf')
    );

    localRepoWritable.write('[local]\n');
    localRepoWritable.write(`SigLevel = Optional TrustAll\n`);
    localRepoWritable.write(
      `Server = file://${localPaths.repositories.local}\n\n`
    );

    const localRepoDatabaseFile = path.resolve(paths.repositories.local, 'local.db.tar.gz');

    for(const file of localRepositoryFiles) {
      await spawn('repo-add',[
        rootfs.resolve(localRepoDatabaseFile),
        file
      ]).wait();
    }

    await localRepoWritable.wait();
  }
}
