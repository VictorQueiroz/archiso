import {IPackage} from "../../Preset";

export default function processPackageItem(pkg: IPackage | string) {
  const packageNames = new Array<string>();

  if (typeof pkg !== 'string') {
    for(const current of pkg.packages) {
      if(typeof current !== 'string') {
        console.warn('`installation` property is not supported for packages yet, adding the package name only: %s', current.name);
        packageNames.push(current.name);
        continue;
      }
      packageNames.push(...processPackageItem(current));
    }
  } else {
    packageNames.push(pkg);
  }

  return packageNames;
}

