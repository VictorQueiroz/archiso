import assert from 'assert';
import { ParsedPackageFlag } from './ParsedPackageFlag';
import parsedPackageFlagFromString from './parsedPackageFlagFromString';

export interface IParsedPackageName {
  packageName: string;
  flags: ParsedPackageFlag[];
}

export default class PackageNameParser {
  #offset = 0;
  readonly #contents: string;

  public constructor(contents: string) {
    this.#contents = contents;
  }

  public read(): IParsedPackageName {
    // Read the package name
    const identifier = this.#readIdentifier();

    const flags = new Array<string>();

    while (!this.#eof() && this.#consume(';')) {
      flags.push(this.#readIdentifier());
    }

    return {
      packageName: identifier,
      flags: flags.map((flag) => parsedPackageFlagFromString(flag))
    };
  }

  #consume(ch: string) {
    // Make sure `ch` has length 1
    assert.strictEqual(ch.length, 1, `Expected a single character, got: ${ch}`);
    if (this.#peek() !== ch) {
      return false;
    }
    this.#advance();
    return true;
  }

  #readIdentifier() {
    const start = this.#offset;
    while (!this.#eof() && this.#peek(/^[a-z0-9-_]$/)) {
      this.#advance();
    }
    return this.#contents.substring(start, this.#offset);
  }

  #peek(match: RegExp | null = null): string | null {
    if (this.#eof()) {
      return null;
    }

    const ch = this.#contents[this.#offset] ?? null;

    assert.strict.ok(ch !== null, 'Unexpected end of file');

    if (match !== null && !match.test(ch)) {
      return null;
    }

    return ch;
  }

  #advance() {
    this.#offset++;
  }

  #eof() {
    return this.#offset >= this.#contents.length;
  }
}
