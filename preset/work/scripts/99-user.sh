#!/bin/bash

GROUP_SUDO=sudo
USER_PASSWORD=123456789
USER_NAME=victorqueiroz

# Create user
useradd -m -G "$GROUP_SUDO" -s /bin/zsh "${USER_NAME}"

# Set user password
echo "${USER_NAME}:${USER_PASSWORD}" | chpasswd

# Add currently created user to `sudo` group
echo "%${GROUP_SUDO} ALL=(ALL) ALL" > /etc/sudoers.d/"${GROUP_SUDO}"
