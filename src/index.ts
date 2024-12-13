import path from 'node:path';
import configuration from './configuration';
import TextStreamWritableStream from './TextStreamWritableStream';
import installFiles from './installFiles';
import { spawn } from 'child-process-utilities';
import workPreset from '../preset/work';
import { getArgument } from 'cli-argument-helper';
import PackageNameParser from '../preset/core/package/PackageNameParser';

async function setMirrors() {
  // Fetch this in real-time from Arch Linux mirror list
  const mirrors = [
    'https://archzfs.com/$repo/$arch',
    'https://mirror.sum7.eu/archlinux/archzfs/$repo/$arch',
    'https://mirror.biocrafting.net/archlinux/archzfs/$repo/$arch',
    'https://mirror.in.themindsmaze.com/archzfs/$repo/$arch',
    'https://zxcvfdsa.com/archzfs/$repo/$arch'
  ];

  const cs = new TextStreamWritableStream(
    configuration.paths.packageManager.mirrorList
  );

  await cs.prepare();

  for (const m of mirrors) {
    cs.write(`Server = ${m}\n`);
  }

  await cs.wait();
}

(async () => {
  const args = process.argv.slice(2);
  const shouldBuildDockerImage = getArgument(args, '--build-image');

  if (shouldBuildDockerImage) {
    await spawn('docker', [
      'buildx',
      'build',
      // Enable verbose mode
      '--progress=plain',
      '--rm',
      // Define USER environment variable
      '--build-arg',
      `USER=${configuration.docker.image.user}`,
      '-t',
      'archlinux-iso-agent:latest',
      path.resolve(__dirname, '../docker/image')
    ], {log: true}).wait();
  }

  const preset = workPreset;
  const cs = new TextStreamWritableStream(
    path.resolve(configuration.isoFolder, 'profiledef.sh')
  );

  await cs.prepare();

  cs.write('#!/usr/bin/env bash\n');
  cs.write('# shellcheck disable=SC2034\n');
  cs.write('\n');

  for (const [key, value] of Object.entries(preset.profileDefinition)) {
    if (typeof value === 'string') {
      cs.write(`${key}="${value}"\n`);
      continue;
    }

    cs.write(
      `${key}=(\n`,
      () => {
        for (const [k, v] of Object.entries(value)) {
          cs.write(`["${k}"]="${v}"\n`);
        }
      },
      ')\n'
    );
  }

  cs.write('\n');

  await setMirrors();

  await installFiles('airootfs', [
    {
      source: {
        url: 'https://archzfs.com/archzfs.gpg'
      },
      dest: '/usr/share/pacman/keyrings/archzfs.gpg'
    },
    {
      source: { path: '/usr/lib/systemd/system/gpm.service' },
      dest: '/etc/systemd/system/multi-user.target.wants/gpm.service',
      symbolicLink: true
    },
//     {
//       source: { path: '/etc/pacman.conf' },
//       dest: '/etc/pacman.conf'
//     }
  ]);

  const airootfsDir = configuration.paths.aiRootFs;

  for (const plugin of preset.plugins) {
    await plugin.run({
      preset,
      rootDir: configuration.isoFolder,
      airootfsDir
    });
  }

  const packages = new TextStreamWritableStream(
    path.resolve(configuration.isoFolder, 'packages.x86_64')
  );

  for(const pkgName of preset.architecture.x86_64.packages) {
    let pkgNames: string[]
    if(typeof pkgName === 'string') {
      pkgNames = [pkgName];
    } else {
      pkgNames = pkgName.packages.map(pkg => typeof pkg === 'string' ? pkg : pkg.name);
    }

    for(const pkgName of pkgNames) {
      const pkg = new PackageNameParser(pkgName).read();
      packages.write(`${pkg.packageName}\n`);
    }
  }

  await packages.wait();
  console.log('Calling mkarchiso...');

  // Produce the ISO
  await spawn('mkarchiso',[
    //'-w',
    '-o',
    path.resolve(configuration.paths.buildDirectory),
    configuration.isoFolder,
  ],{log: true}).wait();

  await cs.wait();
})().catch((reason) => {
  console.error(reason);
  process.exitCode = 1;
});
