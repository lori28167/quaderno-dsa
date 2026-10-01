{
  description = "Quaderno DSA - dev shell";
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };
  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let pkgs = import nixpkgs { inherit system; }; in
      {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            nodejs_22
            pnpm
            cargo
            rustc
            rust-analyzer
            rustfmt
            clippy
            pkg-config
            gobject-introspection
            at-spi2-atk
            atkmm
            cairo
            gdk-pixbuf
            glib
            gtk3
            harfbuzz
            librsvg
            libsoup_3
            pango
            webkitgtk_4_1
            openssl
            dbus
            speechd
          ];
          shellHook = ''
            export WEBKIT_DISABLE_COMPOSITING_MODE=1
            export PKG_CONFIG_PATH="${pkgs.openssl.dev}/lib/pkgconfig:$PKG_CONFIG_PATH"
            echo "Quaderno DSA dev shell pronta. Esegui: pnpm install && pnpm tauri dev"
          '';
        };
      });
}
