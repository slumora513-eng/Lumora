#!/usr/bin/env python3
"""
Verificação técnica dos assets oficiais Lumora.

Somente leitura. Este script NUNCA escreve, converte, redimensiona ou altera
um único byte dos arquivos oficiais (regra 13 do Brand Agent: preservar os
originais, não regenerar, não aplicar filtros, não alterar pixels ou cores).

Uso:
    python3 ferramentas/verificar_assets.py              # integridade + formato + fundo
    python3 ferramentas/verificar_assets.py --paleta     # extrai a paleta medida
    python3 ferramentas/verificar_assets.py --contraste  # razões WCAG 2.2
    python3 ferramentas/verificar_assets.py --tudo

--paleta exige Pillow (`pip install pillow`); as demais verificações usam
apenas a biblioteca padrão.
"""

import argparse
import hashlib
import pathlib
import struct
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
OFICIAIS = RAIZ / "assets" / "oficiais"

# sha256 registrados em assets/oficiais/MANIFESTO.md na verificação de 05/09/2026.
CHECKSUMS = {
    "01_lumora_glass_orb.png": "40bccea5b6395fcf40e870f8f0a2409d13e4977e7f2430853694c52cac0905ed",
    "02_lumora_neon_coins.png": "fa6a69b90dc0c19353f6afa8f8ce468e23dcacd9f30f20cf16ed90a6c219fe8f",
    "03_lumora_star_path.png": "1fcc14630b7a02421c2c46b998e5906da1dbceace5bbef70bb114a0a8b5338c8",
    "04_lumora_bubble_glyph.png": "7079af4ce3b6a722221da78d86daf9bbf5cdcf101c0c5e65899b10e699cb5ec8",
    "05_lumora_aurora_glyph.png": "eb4ad9864f26da8f2ca0b5824cec6ab1dc9f9a49bfa3a30f753d63ac76dcfe42",
    "06_lumora_atom_glyph.png": "34690eb8215b0b7dc5b508525e45db1354fcf59f0f58fe991e852e1174367d05",
    "07_lumora_migration_glyph.png": "7fd7efe6b8f792584bb4f5f7e5ac42374a824defa2822e0767a0420088dbe67a",
    "08_lumora_ecosystem_orbit.png": "aea2ef678b2c73e1d356c00684c913629a3d16a8948243b4ae750df4ea83c676",
    "09_lumora_comunidade_wordmark.png": "bcdeffbbc074d37a8266ff309bc67046f856adad4cbce1db46f4dd0bdc1b615d",
    "10_lumora_aurora_wordmark.png": "f40f8f3f3f4881b097f241127f5a77dda4f0b3024d074b1f36bd8e9e298cdba9",
    "11_lumora_elio_wordmark.png": "e861d3493c1dcbab2ce09684307d269798b1d37fbeee57c7fdf6546593e47860",
    "12_lumora_migralumora_wordmark.png": "8fd0871d500b4d235367290bab0ae35b82646a8797c966646f32ba5d80d9e2f9",
    "13_lumora_ecossistema_wordmark.png": "7da77d438d3371d67741eaef4d88e7461a4a5aa40193d466df228f5209968a53",
}

# Paleta medida nos assets oficiais. DEFAULT DO AGENTE - o Guia nomeia cores
# mas nao fixa nenhum hexadecimal; ver docs/10-paleta.md.
PALETA = {
    "--texto-1": "#FFFFFF",
    "--texto-2": "#C8D2E8",
    "--texto-3": "#8FA0BF",
    "--lumora-violeta": "#B01DFF",
    "--lumora-azul": "#0072FF",
    "--aurora-verde": "#2BCF92",
    "--aurora-teal": "#1D8FC5",
    "--aurora-violeta": "#8541FA",
    "--business-verde": "#16E793",
    "--rotacerta-ambar": "#FFA238",
    "--vidro-borda": "#5A6B8C",
}
DEEP_SPACE = "#00040F"
VIDRO = "#0A1526"
PAPEL = "#FFFFFF"


# ----------------------------------------------------------------- formato

def ler_jpeg(dados):
    """Extrai metadados de um JPEG sem decodificar a imagem."""
    info = {"largura": None, "altura": None, "canais": None, "bits": None,
            "progressivo": False, "icc": False, "exif": False, "adobe": False}
    i = 2
    while i < len(dados) - 1:
        if dados[i] != 0xFF:
            i += 1
            continue
        marcador = dados[i + 1]
        if marcador in (0xD8, 0xD9, 0x01) or 0xD0 <= marcador <= 0xD7:
            i += 2
            continue
        tamanho = struct.unpack(">H", dados[i + 2:i + 4])[0]
        seg = dados[i + 4:i + 2 + tamanho]
        if marcador in (0xC0, 0xC1, 0xC2):
            info["progressivo"] = marcador == 0xC2
            info["bits"] = seg[0]
            info["altura"], info["largura"] = struct.unpack(">HH", seg[1:5])
            info["canais"] = seg[5]
        elif marcador == 0xE1 and seg[:4] == b"Exif":
            info["exif"] = True
        elif marcador == 0xE2 and seg[:4] == b"ICC_":
            info["icc"] = True
        elif marcador == 0xEE and seg[:5] == b"Adobe":
            info["adobe"] = True
        if marcador == 0xDA:
            break
        i += 2 + tamanho
    return info


def ler_png(dados):
    largura, altura = struct.unpack(">II", dados[16:24])
    tipos = {0: "Gray", 2: "RGB", 3: "Palette", 4: "GrayA", 6: "RGBA"}
    return {"largura": largura, "altura": altura, "bits": dados[24],
            "cor": tipos.get(dados[25], dados[25]),
            "alfa": dados[25] in (4, 6)}


def verificar_integridade():
    print("== Integridade e formato ==\n")
    if not OFICIAIS.is_dir():
        print(f"ERRO: {OFICIAIS} nao existe.")
        return 1

    arquivos = sorted(OFICIAIS.glob("*.png"))
    if not arquivos:
        print(f"ERRO: nenhum asset em {OFICIAIS}.")
        return 1

    falhas = 0
    print(f"{'arquivo':38} {'real':5} {'dim':11} {'alfa':5} {'sha256':8}")
    print("-" * 76)

    for caminho in arquivos:
        dados = caminho.read_bytes()
        nome = caminho.name
        digest = hashlib.sha256(dados).hexdigest()

        if dados[:8] == b"\x89PNG\r\n\x1a\n":
            real, meta = "PNG", ler_png(dados)
            alfa = "sim" if meta["alfa"] else "NAO"
        elif dados[:2] == b"\xff\xd8":
            real, meta = "JPEG", ler_jpeg(dados)
            alfa = "NAO"      # JPEG nunca tem canal alfa
        else:
            real, meta, alfa = "?", {"largura": "?", "altura": "?"}, "?"

        esperado = CHECKSUMS.get(nome)
        if esperado is None:
            estado = "NOVO"
            falhas += 1
        elif esperado == digest:
            estado = "ok"
        else:
            estado = "ALTERADO"
            falhas += 1

        dim = f"{meta['largura']}x{meta['altura']}"
        print(f"{nome:38} {real:5} {dim:11} {alfa:5} {estado:8}")

    ausentes = set(CHECKSUMS) - {c.name for c in arquivos}
    for nome in sorted(ausentes):
        print(f"{nome:38} {'-':5} {'-':11} {'-':5} {'AUSENTE':8}")
        falhas += 1

    print()
    if falhas:
        print(f"FALHA: {falhas} divergencia(s). Os assets oficiais nao podem ser")
        print("       alterados nem regenerados (regra 13). Investigue antes de commitar.")
    else:
        print(f"OK: {len(arquivos)} arquivos conferem byte a byte com o MANIFESTO.")
        print()
        print("Lembretes registrados (nao sao falhas deste script):")
        print("  - Todos os 13 sao JPEG apesar da extensao .png -> sem canal alfa.")
        print("  - 01 e 02 tem fundo branco puro; os outros 11 sao Deep Space.")
        print("  - Ver assets/oficiais/MANIFESTO.md e ESCALACOES.md.")
    return 1 if falhas else 0


# ------------------------------------------------------------------ fundo

def verificar_fundo():
    try:
        from PIL import Image
    except ImportError:
        print("\n(--fundo exige Pillow: pip install pillow)")
        return 0
    print("\n== Fundo (4 cantos) ==\n")
    for caminho in sorted(OFICIAIS.glob("*.png")):
        im = Image.open(caminho).convert("RGB")
        w, h = im.size
        cantos = [im.getpixel(p) for p in ((2, 2), (w - 3, 2), (2, h - 3), (w - 3, h - 3))]
        media = tuple(sum(c[i] for c in cantos) // 4 for i in range(3))
        L = luminancia("#%02X%02X%02X" % media)
        tipo = "BRANCO" if L > 0.6 else ("escuro" if L < 0.05 else "medio")
        alerta = "  <-- incompativel com Deep Space" if tipo == "BRANCO" else ""
        print(f"{caminho.name:38} {'#%02X%02X%02X' % media}  {tipo}{alerta}")
    return 0


# ----------------------------------------------------------------- paleta

def extrair_paleta():
    try:
        from PIL import Image
    except ImportError:
        print("ERRO: --paleta exige Pillow. Instale com: pip install pillow")
        return 1
    import colorsys

    print("== Paleta medida nos assets oficiais ==")
    print("(DEFAULT DO AGENTE - o Guia nao fixa hexadecimais; ver docs/10-paleta.md)\n")

    faixas = [
        ("L violeta", 265, 315), ("L azul", 185, 218),
        ("verde", 100, 165), ("teal", 165, 205), ("ambar", 25, 55),
    ]
    for caminho in sorted(OFICIAIS.glob("*.png")):
        im = Image.open(caminho).convert("RGB")
        pixels = im.load()
        melhores = {}
        for y in range(0, im.size[1], 2):
            for x in range(0, im.size[0], 2):
                r, g, b = pixels[x, y]
                matiz, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
                if s < 0.45 or v < 0.55:
                    continue
                graus = matiz * 360
                for nome, lo, hi in faixas:
                    if lo <= graus <= hi:
                        pontos = s * v
                        if nome not in melhores or pontos > melhores[nome][0]:
                            melhores[nome] = (pontos, (r, g, b), graus)
        achados = " ".join(
            f"{n}:{'#%02X%02X%02X' % v[1]}({v[2]:.0f}deg)"
            for n, v in melhores.items()
        )
        print(f"{caminho.name:38} {achados or '(sem cor de marca saturada)'}")
    return 0


# -------------------------------------------------------------- contraste

def _linear(canal):
    canal /= 255.0
    return canal / 12.92 if canal <= 0.04045 else ((canal + 0.055) / 1.055) ** 2.4


def luminancia(hexa):
    h = hexa.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
    return 0.2126 * _linear(r) + 0.7152 * _linear(g) + 0.0722 * _linear(b)


def contraste(a, b):
    la, lb = luminancia(a), luminancia(b)
    if la < lb:
        la, lb = lb, la
    return (la + 0.05) / (lb + 0.05)


def verificar_contraste():
    print("== Contraste WCAG 2.2 ==")
    print("AA texto >= 4,5:1  |  AAA texto (telas criticas, sec.35) >= 7:1  |  UI/grafico >= 3:1\n")
    for fundo, rotulo in ((DEEP_SPACE, "Deep Space"),
                          (VIDRO, "superficie de vidro"),
                          (PAPEL, "papel / impressao")):
        print(f"-- sobre {rotulo} ({fundo}) --")
        for token, hexa in PALETA.items():
            razao = contraste(hexa, fundo)
            if razao >= 7:
                nivel = "AAA"
            elif razao >= 4.5:
                nivel = "AA "
            elif razao >= 3:
                nivel = "UI "
            else:
                nivel = "-- "
            print(f"   {token:20} {hexa}  {razao:6.2f}:1  {nivel}")
        print()
    print("Regras derivadas: docs/06-acessibilidade.md e docs/08-impressao-e-documentos.md")
    return 0


def main():
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--paleta", action="store_true", help="extrai a paleta medida (exige Pillow)")
    p.add_argument("--contraste", action="store_true", help="razoes de contraste WCAG 2.2")
    p.add_argument("--fundo", action="store_true", help="classifica o fundo de cada asset")
    p.add_argument("--tudo", action="store_true", help="roda todas as verificacoes")
    args = p.parse_args()

    if args.tudo:
        args.paleta = args.contraste = args.fundo = True

    # Sem nenhuma flag, roda a verificacao padrao: integridade + formato.
    if not (args.paleta or args.contraste or args.fundo):
        return verificar_integridade()

    codigo = 0
    if args.paleta:
        codigo |= extrair_paleta()
    if args.contraste:
        codigo |= verificar_contraste()
    if args.tudo:
        codigo |= verificar_integridade()
    if args.fundo:
        codigo |= verificar_fundo()
    return codigo


if __name__ == "__main__":
    sys.exit(main())
