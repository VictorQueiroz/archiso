import path from "path";

export default class RootFileSystemResolver {
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

