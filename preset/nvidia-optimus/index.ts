import { IPreset } from "../Preset";

const SOURCE_DATE_EPOCH = new Date().getTime();

const nvidiaOptimusPreset: IPreset = {
  profileDefinition: {
    iso_name: "cristovarch-nvidia-optimus",
    iso_label: `CRISTOVARCH_$(date --date: "${SOURCE_DATE_EPOCH}")`,
    iso_publisher: "JScript Lab <https://jscriptlab.com>",
    iso_application:
      "Arch Linux - NVIDIA Optimus, featuring a an Intel UHD and NVIDIA GTX-1060 Ti 4 GB",
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
        "cloud-init",
        "hyperv",
        "linux",
        "mkinitcpio",
        "mkinitcpio-archiso",
        "open-vm-tools",
        "openssh",
        "pv",
        "qemu-guest-agent",
        "syslinux",
        "virtualbox-guest-utils-nox",
        "zsh",

        // NVIDIA optimus
        "aur:optimus-manager",

        "nvidia-beta-dkms",
        "nvidia-beta",

        "linux",
        "aur:linux-firmware-git",

        // Snap
        "aur:snapd",

        // GNOME
        "gnome-extra",
        "gnome",
        "gnome-shell-extensions",
        "aur:gdm-prime",

        // CVS
        "git",
        "git-lfs",

        // Bootloader
        "efibootmgr",
        "grub",
      ]
    }
  }
}

export default nvidiaOptimusPreset;