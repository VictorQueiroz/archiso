import Exception from "../../../src/core/Exception";
import {ParsedPackageFlag} from "./ParsedPackageFlag";

export default function parsedPackageFlagFromString(flag: string): ParsedPackageFlag {
  switch(flag) {
    case 'aur':
      return ParsedPackageFlag.ArchLinuxUserRepository;
    case 'cleanbuild':
      return ParsedPackageFlag.CleanBuild;
    default:
      throw new Exception(`Unknown flag: ${flag}`);
  }
}

