export interface IRunOptions {
  /**
   * Arguments to be passed before the actual arguments given to the Docker command.
   */
  prefix: string[];
}

export interface IRunOptions {
  /**
   * Arguments to be passed before the actual arguments given to the Docker command.
   */
  prefix: string[];
}

export interface IDockerOptions {
  /**
   * Arguments that will be put after the docker subcommand (e.g. `run`, `exec`, etc).
   */
  dockerArguments: {
    mode: {
      [key in DockerMode]: IRunOptions;
    };
  };

  /**
   * Docker to use when executting the command.
   */
  user: string | null;
}

export enum DockerMode {
  Run = 'run',
  Exec = 'exec'
}

export default function mergeDockerOptions(
  a: IDockerOptions,
  b: Partial<IDockerOptions> = {}
): IDockerOptions {
  return {
    user: b.user ?? a.user,
    dockerArguments: {
      mode: {
        [DockerMode.Run]: {
//           ...a.dockerArguments.mode[DockerMode.Run],
//           ...b.dockerArguments?.mode[DockerMode.Run]
          prefix: [
            ...a.dockerArguments.mode[DockerMode.Run].prefix,
            ...(b.dockerArguments?.mode[DockerMode.Run]?.prefix ?? [])
          ]
        },
        [DockerMode.Exec]: {
          ...a.dockerArguments.mode[DockerMode.Exec],
          ...(b.dockerArguments?.mode[DockerMode.Exec]?.prefix ?? [])
        }
      }
    }
  };
}

