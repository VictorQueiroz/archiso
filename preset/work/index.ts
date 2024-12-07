import path from "path";
import CopyRootFileSystem from "../../plugin/CopyRootFileSystem";
import LocalRepository from "../../plugin/LocalRepository";
import { IPackage, IPreset } from "../Preset";

const virtualBoxInstallConfiguration: IPackage = {
  packages: [
    "virtualbox",
    'virtualbox-guest-iso',
    'virtualbox-guest-utils',
    'virtualbox-guest-utils-nox',

    {
      name: "virtualbox-host-dkms",
      installation: {
        togetherWith: { test: /linux/ }
      }
    },
  ],
}

const SOURCE_DATE_EPOCH = new Date().getTime();

const workPreset: IPreset = {
  profileDefinition: {
    iso_name: "cristovarch-work-optimus",
    iso_label: `CRISTOVARCH_$(date --date: "${SOURCE_DATE_EPOCH}")`,
    iso_publisher: "JScript Lab <https://jscriptlab.com>",
    iso_application:
      "Arch Linux - For devices using Intel UHD",
    iso_version: `$(date --date: "${SOURCE_DATE_EPOCH}")`,
    install_dir: "arch",
    buildmodes: "iso",
    bootmodes: `(${[
      "bios.syslinux.mbr",
      "bios.syslinux.eltorito",
      "uefi-ia32.grub.esp",
      "uefi-x64.grub.esp",
      "uefi-ia32.grub.eltorito",
      "uefi-x64.grub.eltorito",
    ]
      .map((mode) => `'${mode}'`)
      .join(", ")})`,
    arch: "x86_64",
    pacman_conf: "pacman.conf",
    airootfs_image_type: "erofs",
    airootfs_image_tool_options: "'-zlzma,109' -E 'ztailpacking'",
    bootstrap_tarball_compression: `(zstd -c -T0 --long -19)`,
    file_permissions: new Map<string, string>([["/etc/shadow", "0:0:400"]]),
  },
  architecture: {
    'x86_64': {
      packages: [
        "base",
        "linux",
        "base-devel",
        "mkinitcpio",
        "mkinitcpio-archiso",
        "openssh",
        "zsh",

        // AppArmor
        "apparmor",

        // Install `yay`
        'yay;aur',

        // LTS kernel
        "linux-lts",
        "linux-lts-headers",

        // rxvt-unicode-terminfo for the `TERM` environment variable
        "extra/rxvt-unicode-terminfo",

        // PipeWire
        'pipewire',
        'pipewire-jack',
        'pipewire-pulse',
        'wireplumber',

        // Bluetooth
        "bluez",
        "bluez-utils",

        // QEMU
        "qemu-desktop",
        "qemu-emulators-full",

        // Linux hardened
        "linux-hardened",
        "linux-hardened-headers",

        // Virtualization
        'libvirt',

        // Linux Zen
        "linux-zen",
        "linux-zen-headers",

        // VirtualBox
        virtualBoxInstallConfiguration,

        // Linux RT LTS
        "linux-rt-lts",
        "linux-rt-lts-headers",

        // Intel
        "intel-ucode",

        // Network Manager
        "networkmanager",
        "network-manager-applet",
//         "networkmanager-openvpn",
//         "networkmanager-openvpn-gnome",

        // DKMS
        "dkms",

        // Neovim
        'neovim',

        // Neovide
        'neovide',

        // Snap
        "snapd;aur",

        // Default kernel
        "linux",
        // "aur:linux-firmware-git;cleanbuild",

        // GNOME
        "gnome-extra",
        "gnome",
        "gnome-shell-extensions",
        "gdm",

        // CVS
        "git",
        "git-lfs",

        // Bootloader
        "efibootmgr",
        "grub",
      ]
    }
  },

  plugins: [
    new CopyRootFileSystem({ srcDir: path.resolve(__dirname, 'rootfs') }),
    new LocalRepository()
  ]
}

export default workPreset;
