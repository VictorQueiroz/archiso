import { IOptions } from 'child-process-utilities/createSpawnWithDefaultOptions';
import git from './git';

// export default function gitClone(additionalArgs: string[], options: IOptions = {}) {
export default function gitClone(
  src: string,
  dest: string | null = null,
  additionalArgs: string[] | null = null,
  options: IOptions | null = null
) {
  const gitCloneArgs = [src];
  if(additionalArgs !== null) {
    gitCloneArgs.unshift(...additionalArgs);
  }

  if (dest !== null) {
    gitCloneArgs.push(dest);
  }

  return git(['clone', ...gitCloneArgs], {
    log: true,
    ...options
  });
}
