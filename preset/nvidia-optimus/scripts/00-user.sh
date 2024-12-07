#!/bin/bash

GROUP_SUDO=sudo
USER_PASSWORD=123456789
USER_NAME=victorqueiroz

pacman -Syu --noconfirm sudo

useradd -m -G "$GROUP_SUDO" -s /bin/zsh "${USER_NAME}"
echo "${USER_NAME}:${USER_PASSWORD}" | chpasswd
echo "%${GROUP_SUDO} ALL=(ALL) ALL" > /etc/sudoers.d/"${GROUP_SUDO}"
