// See: https://wiki.archlinux.org/title/Official_repositories_web_interface

export interface IArchLinuxWebInterfaceSearchResult {
  version: number;
  limit: number;
  valid: boolean;
  results: IArchLinuxWebInterfacePackage[];
  num_pages: number;
  page: number;
}

export interface IArchLinuxWebInterfacePackage {
  pkgname: string;
  pkgbase: string;
  repo: string;
  arch: string;
  pkgver: string;
  pkgrel: string;
  epoch: number;
  pkgdesc: string;
  url: string;
  filename: string;
  compressed_size: number;
  installed_size: number;
  build_date: string;
  last_update: string;
  flag_date?: string;
  maintainers: string[];
  packager: string;
  groups: any[];
  licenses: string[];
  conflicts: string[];
  provides: string[];
  replaces: string[];
  depends: string[];
  optdepends: string[];
  makedepends: string[];
  checkdepends: string[];
}

export default class ArchLinuxWebInterface {
  readonly #baseUrl = "https://archlinux.org/packages/search/json";

  public async search({ query: q }: { query: string }) {
    const res = await fetch(`${this.#baseUrl}?q=${q}`);

    const result = await res.json();

    return result;
  }
}

