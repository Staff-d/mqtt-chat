let
  spec = {
    owner = "NixOS";
    repo = "nixpkgs";
    # 1365af737ea6d7c1d8d764fc56aaa431e82f6ab1 is release 24.05 as of 2024-10-10
    rev = "1365af737ea6d7c1d8d764fc56aaa431e82f6ab1";
    sha256 = "1kgzlwi00ybivjdffl5r88620gg1z021qplz8jcgbrvfv1ncana5";
  };
  url = "https://github.com/${spec.owner}/${spec.repo}/archive/${spec.rev}.tar.gz";
in
  builtins.fetchTarball {
    url = url;
    sha256 = spec.sha256;
  }
