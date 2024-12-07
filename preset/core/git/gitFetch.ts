import git from "./git";

export default function gitFetch(additionalArgs: string[]) {
  return git([
    "fetch",
    ...additionalArgs,
  ]);
}

