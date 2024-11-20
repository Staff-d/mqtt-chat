{pkgs ? import (import ./pinned-nixpkgs.nix) {}}: let
  authConfig = pkgs.stdenv.mkDerivation {
    name = "mqtt-for-webdevs-mosquitto-auth-config";
    src = pkgs.lib.fileset.toSource {
      root = ./mosquitto-conf/auth;
      fileset = ./mosquitto-conf/auth;
    };
    patchPhase = ''
      sed -i 's|acl_file /mosquitto/config/aclfile|acl_file '"$out"'/share/aclfile|' mosquitto.conf
      sed -i 's|password_file  /mosquitto/config/passwordfile|password_file '"$out"'/share/passwordfile|' mosquitto.conf
    '';
    installPhase = ''
      mkdir -p $out/share
      cp -r . $out/share
    '';
  };

  unAuthConfig = pkgs.stdenv.mkDerivation {
    name = "mqtt-for-webdevs-mosquitto-auth-config";
    src = pkgs.lib.fileset.toSource {
      root = ./mosquitto-conf/unauth;
      fileset = ./mosquitto-conf/unauth;
    };
    patchPhase = ''
      sed -i 's|acl_file /mosquitto/config/aclfile|acl_file '"$out"'/share/aclfile|' mosquitto.conf
      sed -i 's|password_file  /mosquitto/config/passwordfile|password_file '"$out"'/share/passwordfile|' mosquitto.conf
    '';
    installPhase = ''
      mkdir -p $out/share
      cp -r . $out/share
    '';
  };

  wrappedAuthMosquitto = pkgs.writeScriptBin "mosquitto-auth" ''
    ${pkgs.mosquitto}/bin/mosquitto -c ${authConfig}/share/mosquitto.conf
  '';
  wrappedUnAuthMosquitto = pkgs.writeScriptBin "mosquitto-unauth" ''
    ${pkgs.mosquitto}/bin/mosquitto -c ${unAuthConfig}/share/mosquitto.conf
  '';
in
  pkgs.writeShellScriptBin "mosquittos" ''
    _term() {
      kill -TERM "$AUTH_PID" 2>/dev/null
      kill -TERM "$UNAUTH_PID" 2>/dev/null
      waitpid "$AUTH_PID" "$UNAUTH_PID"
    }
    trap _term EXIT

    ${wrappedAuthMosquitto}/bin/mosquitto-auth &
    AUTH_PID=$!
    ${wrappedUnAuthMosquitto}/bin/mosquitto-unauth &
    UNAUTH_PID=$!
    waitpid "$AUTH_PID" "$UNAUTH_PID"
  ''
