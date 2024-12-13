import ContainerInterface, {IContainerInterfaceOptions} from "./ContainerInterface";

/**
 * @deprecated Use the `Docker` class instead
 */
export default class ContainerInterfaceBuilder {
  readonly #dockerArguments: string[];
  public constructor(dockerArgs: string[]) {
    this.#dockerArguments = dockerArgs;
  }

  /**
   * Create a new ContainerInterface using the initially given
   * `dockerArgs` argument during the creation of `ContainerInterfaceBuilder`.
   */
  public create(
    rootDir: string,
    options: Partial<IContainerInterfaceOptions> = {}
  ) {
    return new ContainerInterface(rootDir, this.#dockerArguments, options);
  }
}
