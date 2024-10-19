{pkgs ? import (import ./pinned-nixpkgs.nix) {}}:

let
    # see https://github.com/eclipse/mosquitto/blob/master/mosquitto.conf
    mosquittoConfig = pkgs.writeText "mosquitto.conf" ''
    listener 1883
    listener 8080
    protocol websockets
    allow_anonymous false
    #acl_file ${aclFile}
    password_file ${passwordFile}
    '';

    passwordFile = pkgs.writeText "passwordfile" ''
    admin:$7$101$r9HmhV9etTd0YOw8$b+rd4wAujQnNoU8E5iK2WVXKnBVNUZ4Wu+k4x038PpCtJ0dHca70cqk9+RUZS2HHusV2s6ufLzKYpW+Il2ZD1g==
    sebastian:$7$101$Kaa0Js+OIDfUyb9a$tbVmfA1sEyOEaaBathFdctIkPJi9pr5hJdDd5e2pOOvJ7/4iNWhW3LGOG8j5tQfypkZDQGPGSCkJOKQwZDTP0Q==
    peter:$7$101$6HmVFTGq8UYlnbVP$z2G5LuJsSeo9Ee3aam19eZlRq3FiS4E1aw00SoknUQtpMNdzSbgwU8p5CCEdRrRX13Rq40QnNPiIsFuKJxmt7w==
    hannes:$7$101$WpqhM5CCLhOUQEL6$OJurRE8J3qj2SuvZskAiWHVOmm9WT1jPdAJoL5wEiG5DZosYI7X3suRV2SfVj3it390V5qOTz2sNONckxiE1+Q==
    '';

    aclFile = pkgs.writeText "aclfile" ''
    # This affects all clients.
    pattern write chat/status/%u
    topic read chat/status/+

    pattern read chat/messages/%u/+
    pattern write chat/messages/+/%u
    '';

    wrappedMosquitto= pkgs.symlinkJoin {
       name = "mosquitto";
       paths = [ pkgs.mosquitto ];
       buildInputs = [ pkgs.makeWrapper ];
       postBuild = ''
         wrapProgram $out/bin/mosquitto \
           --add-flags "-c ${mosquittoConfig}"
       '';
     };
in
pkgs.mkShell {
  buildInputs = with pkgs; [
     nodejs_22
     wrappedMosquitto
  ];
}
