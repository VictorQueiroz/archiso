import {IPlugin} from "../plugin/Plugin";

// TODO: Maybe rename this to "PackagePreset"
export interface IPackage {
  packages: (string | {
    name: string;
    /**
     * If defined, it will always install this package along side with whatever
     * matches the `test` regular expression
     */
    installation: {
      togetherWith?: { test: RegExp };
    };
  })[];
}

export interface IPreset {
  profileDefinition: {
    iso_name: string;
    iso_label: string;
    iso_publisher: string;
    iso_application: string;
    iso_version: string;
    install_dir: string;
    buildmodes: string;
    bootmodes: string;
    arch: string;
    pacman_conf: string;
    airootfs_image_type: string;
    airootfs_image_tool_options: string;
    bootstrap_tarball_compression: string;
    file_permissions: Map<string, string>;
  };
  architecture: {
    x86_64: {
      packages: (string | IPackage)[];
    };
  };
  plugins: IPlugin[];
}

