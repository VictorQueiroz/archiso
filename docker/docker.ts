import {spawn} from "child-process-utilities";
import {IOptions} from "child-process-utilities/createSpawnWithDefaultOptions";

/**
 * @deprecated Renamed to `dockerRunDefaultArguments`
 */
export const dockerDefaultArguments = [
  '--name', 'tmp-container',
  '-t',
  'archlinux-iso-agent:latest',
];

export const dockerExecDefaultArguments = [
  '-t',
  'archlinux-iso-agent:latest',
]

export const dockerRunDefaultArguments = [
  '--rm',
  '--privileged',
]

/**
 * Run the command into a docker container running
 * a clean Arch Linux machine.
 * @param command the command to be executed within the Docker container
 * @param args arguments to be executed on the Docker command
 * @param dockerArgs Arguments to be passed to the `docker run` commands, before `-it`
 */
export default function docker(command: string, args: string[], dockerArgs: string[] = [], options: IOptions = {}) {
  return spawn('docker', [
    'run',
    ...dockerArgs,
    ...dockerDefaultArguments,
    command,
    ...args
  ], {log: true, ...options});
}

