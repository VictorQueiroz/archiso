import path from 'path';

const isoFolder = path.resolve(__dirname, '../archiso');
const aiRootFs = path.resolve(isoFolder, 'airootfs');
const buildDir = path.resolve(__dirname, '../build');

const paths = {
  aiRootFs,
  aurPackages: path.resolve(buildDir, 'aur'),
  /**
   * Parent directory of the temporary build directory. This folder
   * should be used for things like `aur` Git repositories, and more.
   */
  buildDirectory: buildDir,
  packageManager: {
    mirrorList: path.resolve(aiRootFs, 'etc/pacman.d/archzfs_mirrorlist')
  }
};

const configuration = {
  docker: {
    image: { user: 'archuser', name: 'archlinux-iso-agent' },
    containerName: 'archlinux-iso-agent-tmp'
  },

  localRepository: {
    // FIXME: Add this to the `/etc/pacman.conf` to somehow (without needing to change both parts at the same time).
    databaseFileName: 'custom',
  },
  isoFolder,
  paths
};

export default configuration;
