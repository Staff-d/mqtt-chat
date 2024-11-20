{pkgs ? import (import ./pinned-nixpkgs.nix) {}}:
pkgs.mkShell {
  buildInputs = with pkgs; [
    nodejs_22
    mosquitto
  ];
}
