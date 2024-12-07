import path from "path";

const isoFolder = path.resolve(__dirname, "../archiso");
const aiRootFs = path.resolve(isoFolder, "airootfs");

const paths = {
  aiRootFs,
  aurPackages: path.resolve(__dirname, '../aur'),
  packageManager: {
    mirrorList: path.resolve(aiRootFs, "etc/pacman.d/archzfs_mirrorlist"),
  },
};

const configuration = {
  isoFolder,
  paths,
};

export default configuration;
