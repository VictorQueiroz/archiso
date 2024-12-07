import {spawn} from "child-process-utilities";
import {IOptions} from "child-process-utilities/createSpawnWithDefaultOptions";

export default function git(additionlArgs: string[], options?: IOptions) {
  return spawn("git", [
    ...additionlArgs,
  ], options);
}

