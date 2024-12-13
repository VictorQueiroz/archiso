import path from "path";
import CopyRootFileSystem from "../../plugin/CopyRootFileSystem";
import LocalRepository from "../../plugin/LocalRepository/LocalRepository";
import { IPackage, IPreset } from "../Preset";
import SymbolicLink from "../../plugin/SymbolicLink";

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

        // Audio
        "audacity",

        // Video
        "obs-studio",
        // "obs-virtualcam;aur",
        "vlc",

        // Subtitles
        'aegisub',

        // XDG
        'libportal',
        'libportal-docs',
        'libportal-gtk3',
        'libportal-gtk4',
        'libportal-qt5',
        'libportal-qt6',

        // XDG
//         'libportal-gtk3;aur',
//         'libportal-gtk4;aur',
//         'libportal-qt5;aur',
//         'libportal-qt6;aur',
        'xdg-desktop-portal',
        'xdg-desktop-portal-gnome',
//         'xdg-desktop-portal-gtk',
//         'xdg-desktop-portal-gtk3;aur',
//         'xdg-desktop-portal-gtk4;aur',
//         'xdg-desktop-portal-qt5;aur',
//         'xdg-desktop-portal-qt6;aur',

        // Terminal emulators
        'ptyxis;aur',
        'alacritty',

        // Virtual Camera
        "v4l2loopback-dkms",
        "v4l2loopback-utils",

        // DKMS
        "dkms",

        // Sysdig
        'sysdig-dkms',
        'vhba-module-dkms',

        // Android kernel driver fork by @choff in DKMS format, binder only.
	      'binder_linux-dkms;aur',

        // Screen key: Print the keys on X while you're typing them
        'screenkey-git;aur',

        // Intel wireless chips driver from linux (6.11.1) with patch for lar_disable parameter 5GHz band support.
        // 'iwlwifi-lar-disable-dkms;aur',

        // Modern Linux driver for Xbox One and Xbox Series X|S controllers
        // 'xone-dkms;aur',

        // 'wireguard-dkms;aur',

        // File system
        // 'zfs-dkms;aur',

        // AppArmor
        "apparmor",

        // Install `yay`
        'yay;aur',

        // LTS kernel
        "linux-lts",
        "linux-lts-headers",

        // rxvt-unicode-terminfo for the `TERM` environment variable
        "rxvt-unicode-terminfo",

        // System audio
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

        // Kernel headers
        'kernel-headers-musl',

        // Busybox
        'busybox',
        'mkinitcpio-busybox',
        'mkinitcpio',

        'glibc',

        // Emulation
        'libnbd',
        'fuse3',

        // GRUB-EFI
        'edk2-aarch64',
        'edk2-arm',

        // Linux hardened
        "linux-hardened",
        "linux-hardened-headers",

        // Virtualization
        'libvirt',

        // NordVPN
        'nordvpn-bin;aur',

        // X11
        'xorg-font-utils;aur',
        'xorg-xwayland-git;aur',
        'xorg-server-git;aur',

        // Wayland: Screen recorder
        'green-recorder;aur',

        'xinput-gui;aur',

        // Browser
        'google-chrome;aur',

        // Console-based Audio Visualizer for Alsa
        'cava;aur',

        // uniform-looking between Qt5 and Qt6
        'adwaita-qt-git;aur',
        'qgnomeplatform-git;aur',
        'qgnomeplatform-git;aur',
//         'adwaita-qt4;aur',
//         'adwaita-qt5-git;aur',
//         'adwaita-qt6-git;aur',
//         'qt5ct;aur',
//         'qt6ct-git;aur',
//         'qgnomeplatform-qt6-git;aur',
//         'qgnomeplatform-common-git;aur',
//         'qgnomeplatform-qt5-git;aur;cleanbuild',
//       	'adwaita-qt5-git;aur',
//        'adwaita-qt6-git;aur',

        // Adwaita
        'adwaita-color-schemes;aur',
        'qt5-x11extras',
        'qt5-base',

        // GNOME
        'adwaita-icon-theme',
        'adwaita-cursors',
        /**
         * Adwaita Colors enhances the Adwaita icon theme by integrating GNOME's accent color feature.
         * It ensures that your Adwaita icons reflect the same accent color as your GNOME theme.
         */
        'adwaita-colors-icon-theme;aur',
        'morewaita-icon-theme;aur',
//         'adwsteamgtk;aur',

        // DDCP
        'ddcutil;aur',
        'ddcci-driver-linux-dkms-git;aur',

        // Intel
        'intel-media-driver',
        'intel-gpu-tools',
        'lib32-libva-intel-driver',
        'lib32-vulkan-intel',
        'libva-intel-driver',
        'libva-utils',
        'vulkan-intel',

        // Intel's modular network connection manager
        'connman',

        // Docker
        'docker',
        'docker-buildx',

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

        // Neovim
        'neovim',

        // Neovide
        'neovide',

        // Snap
        "snapd;aur",

        // Default kernel
        "linux",

        // Tiling window manager
        'hyprland-git;aur',

        'octopi;aur',

        'vscodium-bin;aur',

        'pwvucontrol;aur',

        // Firmware
        'jetbrains-toolbox;aur',
        'upd72020x-fw;aur',
        "linux-firmware-git;aur",
        'mkinitcpio-firmware;aur', // Optional firmware for the default linux kernel to get rid of the annoying 'WARNING: Possibly missing firmware for module:' messages

        // Archive tools
        '7-zip-full;aur',
        'unzip',
        'zip',

        // Audio
        'spotube-bin;aur',

        // Clipboard
        'gallery-dl;aur',

        // Development
        'docker',
        /**
         * The desktop user interface for pgAdmin. pgAdmin is the most popular and feature rich Open Source administration and development platform for PostgreSQL, the most advanced Open Source database in the world.
         */
        'pgadmin4-desktop;aur',

        // GNOME Extensions
        'extension-manager;aur',


        // Containerization
	      'docker-git;aur',
        'lazydocker;aur',
        'docker-buildx',

        // Python
        'python',
        // 'python-pyenv',
        // 'python-pyenv-virtualenv',
        // 'python-pyenv-virtualenvwrapper',
        // 'python-pyenv-tox',
        'python-openstackclient',

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
    new SymbolicLink({
      from: '/usr/share/zoneinfo/America/Fortaleza',
      to: '/etc/localtime'
    }),
    new CopyRootFileSystem({ srcDir: path.resolve(__dirname, 'rootfs') }),
    new LocalRepository()
  ]
}

export default workPreset;
