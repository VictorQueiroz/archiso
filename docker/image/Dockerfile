FROM archlinux:multilib-devel

ARG USER=builder
ARG REFLECTOR_COUNTRY="BR,US"
ARG DEFAULT_BRANCH="master"
ARG CC="/usr/bin/clang"
ARG CXX="/usr/bin/clang++"

ENV CC="$CC"
ENV CXX="$CXX"
ENV HOME="/home/$USER"
ENV XDG_CACHE_HOME="$HOME/.cache"
ENV USER="$USER"

# Create the user right away so the UID/GID match (not sure about the last part, that's Codeium fault)
RUN useradd -m -d "$HOME" "$USER"

RUN pacman -Syy --noconfirm

RUN pacman -Syu --noconfirm

RUN pacman -S --noconfirm \
  base base-devel \
  git git-lfs \
  findutils \
  tmux neovim \
  vi vim reflector \
  pkgfile clang clang-tools-extra \
  python python-pip python-virtualenv python-pytest python-pytest-cov \
  xdg-utils xdg-user-dirs \
  sudo

RUN git lfs install

# Install full GNOME
RUN pacman -S --noconfirm \
  gnome \
  gnome-desktop gnome-tweaks \
  gnome-shell-extensions \
  gdm

# Update pkgfile
RUN pkgfile --update

# Update mirrorlist using reflector
RUN reflector \
  --country "$REFLECTOR_COUNTRY" \
  --verbose \
  --latest 6 \
  --sort rate \
  --save /etc/pacman.d/mirrorlist

# Add user to sudoers
RUN printf '%s ALL=(ALL:ALL) NOPASSWD: ALL' "$USER" > /etc/sudoers.d/"$USER"

RUN mkdir -pv "$XDG_CACHE_HOME"
RUN chown "$USER":"$USER" "$XDG_CACHE_HOME"

USER "$USER"

# Set `master` as the default Git branch
RUN git config --global init.defaultBranch "$DEFAULT_BRANCH"

