FROM archlinux:multilib-devel

RUN pacman -Syu --noconfirm

RUN pacman -S --noconfirm \
  base-devel \
  git \
  findutils

ENV USER=builder
ENV HOME="/home/$USER"

RUN useradd -m -d "$HOME" "$USER"

# Add user to sudoers
RUN printf '%s ALL=(ALL:ALL) NOPASSWD: ALL' "$USER" > /etc/sudoers.d/"$USER"

USER "$USER"

