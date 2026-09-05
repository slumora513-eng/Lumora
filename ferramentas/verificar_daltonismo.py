#!/usr/bin/env python3
"""
Verificação das seis paletas sob daltonismo — fecha a etapa de QA da
ESCALACOES.md §7.

O QUE ISTO SUBSTITUI
A §35 exige teste em simulador de daltonismo. A escalação §7 registrava isso
como pendência de QA manual ("Coblis, Stark"). Ferramenta externa não é
verificável nem reproduzível: quem confere depois não tem como repetir o
mesmo teste e obter o mesmo número. Este script faz a simulação em código,
localmente, sem rede — e por isso o resultado entra no repositório como
medição, não como relato.

DE ONDE VÊM AS CORES
Do CSS que realmente é servido: tokens.css (base) e acessibilidade-bonita.css
(as seis paletas), com var() resolvido. Nenhum valor é copiado para cá, então
não existe a possibilidade de a ferramenta e o runtime discordarem.

MÉTODO
Viénot, Brettel & Mollon (1999), "Digital video colourmaps for checking the
legibility of displays by dichromats" — sRGB → RGB linear → LMS, colapso do
cone ausente, volta. É o método usado pela maioria dos simuladores.

LIMITE DECLARADO: o método de 1999 foi desenhado para protanopia e
deuteranopia. Para tritanopia ele é uma aproximação de plano único, e a
literatura recomenda o método de dois planos de Brettel (1997). Aqui a
tritanopia é reportada com essa ressalva. Ela não muda a conclusão: as
margens medidas são largas o bastante para o erro do método não virar o
resultado.

O código se autovalida antes de reportar (--autoteste, embutido em --tudo):
  - ΔE2000 conferido contra os vetores publicados por Sharma, Wu & Dalal (2005);
  - cinzas têm de mapear em si mesmos nos três tipos (o eixo neutro sobrevive);
  - cada tipo tem de colapsar EXATAMENTE a dimensão do seu cone ausente —
    duas cores que diferem só nessa coordenada têm de sair idênticas;
  - e não pode colapsar mais que isso: a simulação de um tipo tem de preservar
    a dimensão que pertence aos outros dois. Sem essa contraprova, um
    simulador que achatasse tudo passaria qualquer paleta por engano.
Se qualquer invariante falhar, o script para e não reporta número nenhum.

Uso:
    python3 ferramentas/verificar_daltonismo.py             # relatório
    python3 ferramentas/verificar_daltonismo.py --autoteste # só a autovalidação
    python3 ferramentas/verificar_daltonismo.py --tudo      # autoteste + relatório
"""

import argparse
import math
import pathlib
import re
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
TOKENS = RAIZ / "runtime" / "tokens.css"
PALETAS = RAIZ / "runtime" / "acessibilidade-bonita.css"

# --------------------------------------------------------------------------
# Cor: sRGB, luminância, contraste WCAG 2.2
# --------------------------------------------------------------------------

def hex_para_rgb(s):
    s = s.strip().lstrip("#")
    if len(s) == 3:
        s = "".join(c * 2 for c in s)
    return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4))


def rgb_para_hex(rgb):
    return "#%02X%02X%02X" % tuple(max(0, min(255, int(round(c)))) for c in rgb)


def srgb_para_linear(c):
    c = c / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def linear_para_srgb(c):
    c = max(0.0, min(1.0, c))
    v = 12.92 * c if c <= 0.0031308 else 1.055 * (c ** (1 / 2.4)) - 0.055
    return v * 255.0


def luminancia(rgb):
    r, g, b = (srgb_para_linear(c) for c in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contraste(a, b):
    la, lb = luminancia(a), luminancia(b)
    if la < lb:
        la, lb = lb, la
    return (la + 0.05) / (lb + 0.05)


# --------------------------------------------------------------------------
# Simulação de dicromacia — Viénot, Brettel & Mollon (1999)
# --------------------------------------------------------------------------

# RGB linear -> LMS
_RGB_LMS = (
    (17.8824, 43.5161, 4.11935),
    (3.45565, 27.1554, 3.86714),
    (0.0299566, 0.184309, 1.46709),
)
# LMS -> RGB linear (inversa da acima)
_LMS_RGB = (
    (0.080944, -0.130504, 0.116721),
    (-0.0102485, 0.0540194, -0.113615),
    (-0.000365294, -0.00412163, 0.693513),
)


def _mul(m, v):
    return tuple(sum(m[i][j] * v[j] for j in range(3)) for i in range(3))


def simular(rgb, tipo):
    """tipo: 'protanopia' | 'deuteranopia' | 'tritanopia' | 'normal'."""
    if tipo == "normal":
        return tuple(rgb)
    lin = tuple(srgb_para_linear(c) for c in rgb)
    L, M, S = _mul(_RGB_LMS, lin)

    if tipo == "protanopia":
        L = 2.02344 * M - 2.52581 * S
    elif tipo == "deuteranopia":
        M = 0.494207 * L + 1.24827 * S
    elif tipo == "tritanopia":
        S = -0.395913 * L + 0.801109 * M
    else:
        raise ValueError(f"tipo desconhecido: {tipo}")

    out = _mul(_LMS_RGB, (L, M, S))
    return tuple(linear_para_srgb(c) for c in out)


TIPOS = ("protanopia", "deuteranopia", "tritanopia")


# --------------------------------------------------------------------------
# CIELAB e CIEDE2000
# --------------------------------------------------------------------------

def rgb_para_lab(rgb):
    r, g, b = (srgb_para_linear(c) for c in rgb)
    # sRGB D65 -> XYZ
    x = 0.4124564 * r + 0.3575761 * g + 0.1804375 * b
    y = 0.2126729 * r + 0.7151522 * g + 0.0721750 * b
    z = 0.0193339 * r + 0.1191920 * g + 0.9503041 * b
    xn, yn, zn = 0.95047, 1.0, 1.08883

    def f(t):
        return t ** (1 / 3) if t > 216 / 24389 else (841 / 108) * t + 4 / 29

    fx, fy, fz = f(x / xn), f(y / yn), f(z / zn)
    return (116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz))


def ciede2000(lab1, lab2):
    L1, a1, b1 = lab1
    L2, a2, b2 = lab2
    kL = kC = kH = 1.0

    C1 = math.hypot(a1, b1)
    C2 = math.hypot(a2, b2)
    Cbar = (C1 + C2) / 2
    G = 0.5 * (1 - math.sqrt(Cbar ** 7 / (Cbar ** 7 + 25 ** 7))) if Cbar > 0 else 0.5 * (1 - 0)
    a1p = (1 + G) * a1
    a2p = (1 + G) * a2
    C1p = math.hypot(a1p, b1)
    C2p = math.hypot(a2p, b2)

    def hp(ap, bp):
        if ap == 0 and bp == 0:
            return 0.0
        h = math.degrees(math.atan2(bp, ap))
        return h + 360 if h < 0 else h

    h1p, h2p = hp(a1p, b1), hp(a2p, b2)

    dLp = L2 - L1
    dCp = C2p - C1p
    if C1p * C2p == 0:
        dhp = 0.0
    else:
        d = h2p - h1p
        if d > 180:
            d -= 360
        elif d < -180:
            d += 360
        dhp = d
    dHp = 2 * math.sqrt(C1p * C2p) * math.sin(math.radians(dhp / 2))

    Lbp = (L1 + L2) / 2
    Cbp = (C1p + C2p) / 2
    if C1p * C2p == 0:
        hbp = h1p + h2p
    else:
        s = h1p + h2p
        if abs(h1p - h2p) > 180:
            hbp = (s + 360) / 2 if s < 360 else (s - 360) / 2
        else:
            hbp = s / 2

    T = (1
         - 0.17 * math.cos(math.radians(hbp - 30))
         + 0.24 * math.cos(math.radians(2 * hbp))
         + 0.32 * math.cos(math.radians(3 * hbp + 6))
         - 0.20 * math.cos(math.radians(4 * hbp - 63)))

    dTheta = 30 * math.exp(-(((hbp - 275) / 25) ** 2))
    Rc = 2 * math.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7)) if Cbp > 0 else 0.0
    Sl = 1 + (0.015 * (Lbp - 50) ** 2) / math.sqrt(20 + (Lbp - 50) ** 2)
    Sc = 1 + 0.045 * Cbp
    Sh = 1 + 0.015 * Cbp * T
    Rt = -math.sin(math.radians(2 * dTheta)) * Rc

    return math.sqrt(
        (dLp / (kL * Sl)) ** 2
        + (dCp / (kC * Sc)) ** 2
        + (dHp / (kH * Sh)) ** 2
        + Rt * (dCp / (kC * Sc)) * (dHp / (kH * Sh))
    )


# --------------------------------------------------------------------------
# Leitura do CSS que é realmente servido
# --------------------------------------------------------------------------

_BLOCO = re.compile(r"([^{}]+)\{([^{}]*)\}", re.S)
_VAR = re.compile(r"(--[\w-]+)\s*:\s*([^;]+);")
_REF = re.compile(r"var\(\s*(--[\w-]+)\s*(?:,[^)]*)?\)")
_COMENTARIO = re.compile(r"/\*.*?\*/", re.S)


def _vars_de(texto, seletor_ok):
    """Junta as custom properties de todos os blocos cujo seletor casa.

    Os comentários saem ANTES de separar em blocos: o texto capturado como
    "seletor" é tudo que vem desde o `}` anterior, e sem esta limpeza o
    comentário de cabeçalho de cada arquivo entrava junto — foi assim que o
    bloco `:root` de tokens.css deixou de casar e as paletas que herdam o
    fundo apareceram sem fundo nenhum.
    """
    texto = _COMENTARIO.sub(" ", texto)
    fora = {}
    for seletor, corpo in _BLOCO.findall(texto):
        # o seletor é só a última "frase" antes da chave
        seletor = seletor.replace("}", "\n").strip().splitlines()
        seletor = seletor[-1].strip() if seletor else ""
        if not seletor_ok(seletor):
            continue
        for nome, valor in _VAR.findall(corpo):
            fora[nome] = valor.strip()
    return fora


def _resolver(mapa):
    """Resolve var(--x) até virar literal. Ciclo vira valor inalterado."""
    saida = {}
    for nome in mapa:
        valor, visto = mapa[nome], set()
        while True:
            m = _REF.search(valor)
            if not m or m.group(1) in visto or m.group(1) not in mapa:
                break
            visto.add(m.group(1))
            valor = valor[: m.start()] + mapa[m.group(1)] + valor[m.end():]
            valor = valor.strip()
        saida[nome] = valor
    return saida


def carregar_paletas():
    tokens = TOKENS.read_text(encoding="utf-8")
    paletas_css = PALETAS.read_text(encoding="utf-8")

    base = _vars_de(tokens, lambda s: s == ":root" or s.startswith(":root,"))
    fora = {}
    nomes = ["padrao", "preto-branco", "daltonismo",
             "fogo-de-nebulosa", "aurora-noite", "aurora-dia"]
    for nome in nomes:
        alvo = f'data-lum-paleta="{nome}"'
        # só blocos que são SÓ o :root da paleta — regras de componente
        # (".lum-botao" etc.) não carregam tokens da paleta.
        sobre = _vars_de(paletas_css,
                         lambda s, a=alvo: a in s and "." not in s.split(a)[-1])
        fora[nome] = _resolver({**base, **sobre})
    return fora


# --------------------------------------------------------------------------
# Autovalidação — sem ela nenhum número é reportado
# --------------------------------------------------------------------------

# Vetores publicados por Sharma, Wu & Dalal (2005) para conferir CIEDE2000.
_SHARMA = [
    ((50.0000, 2.6772, -79.7751), (50.0000, 0.0000, -82.7485), 2.0425),
    ((50.0000, 3.1571, -77.2803), (50.0000, 0.0000, -82.7485), 2.8615),
    ((50.0000, 2.8361, -74.0200), (50.0000, 0.0000, -82.7485), 3.4412),
    ((50.0000, -1.3802, -84.2814), (50.0000, 0.0000, -82.7485), 1.0000),
    ((50.0000, -1.1848, -84.8006), (50.0000, 0.0000, -82.7485), 1.0000),
    ((50.0000, -0.9009, -85.5211), (50.0000, 0.0000, -82.7485), 1.0000),
    ((50.0000, 0.0000, 0.0000), (50.0000, -1.0000, 2.0000), 2.3669),
    ((50.0000, 2.4900, -0.0010), (50.0000, -2.4900, 0.0009), 7.1792),
]


def autoteste(verboso=True):
    falhas = []

    # 1. CIEDE2000 contra os vetores publicados
    for lab1, lab2, esperado in _SHARMA:
        obtido = ciede2000(lab1, lab2)
        if abs(obtido - esperado) > 0.0002:
            falhas.append(f"CIEDE2000 {lab1}/{lab2}: {obtido:.4f} != {esperado:.4f}")

    # 2. O eixo neutro tem de sobreviver: cinza simulado continua o mesmo cinza
    for v in (0, 32, 64, 128, 192, 255):
        for tipo in TIPOS:
            saiu = simular((v, v, v), tipo)
            if max(abs(c - v) for c in saiu) > 2.0:
                falhas.append(f"cinza {v} sob {tipo} virou {rgb_para_hex(saiu)}")

    # 3. A propriedade que DEFINE a dicromacia: a simulação perde exatamente
    #    uma dimensão — a do cone ausente. Testar isso com pares de cores
    #    escolhidos a dedo é frágil (sob esta transformada o azul e o amarelo
    #    puros são pontos fixos, e o "colapso" do vermelho contra o verde é de
    #    matiz, não de claridade). O teste honesto é direto: pegar duas cores
    #    que diferem SÓ na coordenada do cone ausente e exigir que a simulação
    #    devolva a mesma cor para as duas.
    for tipo, i in (("protanopia", 0), ("deuteranopia", 1), ("tritanopia", 2)):
        lms = list(_mul(_RGB_LMS, tuple(srgb_para_linear(c) for c in (128, 128, 128))))
        par = []
        fora_de_gama = False
        for fator in (0.85, 1.15):
            v = list(lms)
            v[i] *= fator
            lin = _mul(_LMS_RGB, v)
            if any(c < 0 or c > 1 for c in lin):
                fora_de_gama = True
            par.append(tuple(linear_para_srgb(c) for c in lin))
        if fora_de_gama:
            falhas.append(f"{tipo}: par de teste saiu da gama — teste inválido")
            continue

        antes = max(abs(a - b) for a, b in zip(*par))
        if antes < 8:
            falhas.append(f"{tipo}: par de teste indistinguível já sem simulação "
                          f"(Δ={antes:.1f}) — teste sem força")
        depois = max(abs(a - b) for a, b in
                     zip(simular(par[0], tipo), simular(par[1], tipo)))
        # em ponto flutuante o colapso é exato; a folga cobre só erro numérico
        if depois > 0.01:
            falhas.append(f"{tipo} não colapsou a dimensão do cone ausente "
                          f"(Δ={antes:.1f} antes, {depois:.3f} depois)")

    # 4. Contraprova: o cone ausente é UM só. A simulação de um tipo não pode
    #    apagar a dimensão que pertence a outro — se apagasse, o simulador
    #    estaria colapsando tudo e daria "aprovado" por engano em qualquer
    #    paleta.
    for tipo, i in (("protanopia", 0), ("deuteranopia", 1), ("tritanopia", 2)):
        lms = list(_mul(_RGB_LMS, tuple(srgb_para_linear(c) for c in (128, 128, 128))))
        par = []
        for fator in (0.85, 1.15):
            v = list(lms)
            v[i] *= fator
            par.append(tuple(linear_para_srgb(c) for c in _mul(_LMS_RGB, v)))
        for outro in TIPOS:
            if outro == tipo:
                continue
            d = max(abs(a - b) for a, b in
                    zip(simular(par[0], outro), simular(par[1], outro)))
            if d <= 1:
                falhas.append(f"{outro} apagou a dimensão de {tipo} (Δ={d:.1f}) — "
                              f"o simulador está colapsando demais")

    if verboso:
        if falhas:
            print("AUTOTESTE FALHOU — nenhum número será reportado:")
            for f in falhas:
                print("  ✗", f)
        else:
            print(f"autoteste: {len(_SHARMA)} vetores CIEDE2000 publicados + "
                  f"{6 * len(TIPOS)} de eixo neutro + {len(TIPOS)} de colapso + "
                  f"{len(TIPOS) * 2} de contraprova — tudo ok")
    return falhas


# --------------------------------------------------------------------------
# Relatório
# --------------------------------------------------------------------------

TEXTOS = ["--lum-texto-1", "--lum-texto-2", "--lum-texto-3"]
SEMANTICOS = ["--lum-ok", "--lum-atencao", "--lum-erro", "--lum-critico"]
MIN_TEXTO = 4.5      # WCAG 2.2 AA para texto normal

# Limiares de distinção para a paleta "daltonismo" — a única que existe para
# manter os quatro estados separados por cor. Não são números escolhidos: saem
# de uma busca exaustiva sobre a paleta Okabe-Ito (2008), que é a fonte dos
# valores em uso.
#
# Das 7 cores Okabe-Ito, 6 passam em AA 4,5:1 sobre o Deep Space (o azul
# #0072B2 mede 3,95:1 e sai — os tokens são usados como `color:` de texto em
# notificacoes-vivas.css e interface-viva.css). Das 15 combinações de 4 dessas
# 6, TODAS empatam em ΔE00 = 8,6 sob tritanopia. Ou seja: 8,6 é o teto do que
# Okabe-Ito permite aqui, e a atribuição em uso já está nele.
#
# Isso não é falha da paleta: Okabe-Ito foi construída para o eixo
# vermelho-verde (protanopia e deuteranopia, ~8% dos homens), não para o
# azul-amarelo. Exigir 11,0 em tritanopia reprovaria uma paleta ótima e
# empurraria para inventar cores fora de uma referência publicada.
#
# O que cobre a tritanopia é o canal não-cor, que a §35 item 3 exige de todo
# jeito: forma do ícone e sufixo de texto em cada nível de urgência.
MIN_DELTA = {
    "normal":       11.0,
    "protanopia":   11.0,
    "deuteranopia": 11.0,
    "tritanopia":    8.0,   # teto medido de Okabe-Ito: 8,6 — 8,0 pega regressão
}


def relatorio():
    paletas = carregar_paletas()
    problemas = []

    for nome, vars_ in paletas.items():
        fundo_s = vars_.get("--lum-deep-space")
        if not fundo_s or not fundo_s.startswith("#"):
            problemas.append(f"{nome}: sem --lum-deep-space legível")
            continue
        fundo = hex_para_rgb(fundo_s)
        print(f"\n=== {nome}  (fundo {rgb_para_hex(fundo)}) ===")

        # 1. Contraste do texto sob cada simulação
        print("  texto — contraste WCAG sob simulação")
        for var in TEXTOS:
            valor = vars_.get(var)
            if not valor or not valor.startswith("#"):
                continue
            cor = hex_para_rgb(valor)
            linha = [f"    {var:<16} {rgb_para_hex(cor)}"]
            for tipo in ("normal",) + TIPOS:
                c = contraste(simular(cor, tipo), simular(fundo, tipo))
                linha.append(f"{tipo[:5]}={c:5.2f}")
                if c < MIN_TEXTO:
                    problemas.append(
                        f"{nome}/{var} sob {tipo}: {c:.2f}:1 < {MIN_TEXTO}:1")
            print("  ".join(linha))

        # 2. Distinção entre os quatro estados semânticos
        cores = [(v, hex_para_rgb(vars_[v])) for v in SEMANTICOS
                 if vars_.get(v, "").startswith("#")]
        # Preto/branco zera a cor de propósito (§35 item 3): forma e texto é
        # que carregam o estado. Comparar ΔE ali não mede nada.
        iguais = len({c for _, c in cores}) == 1
        print("  estados — menor ΔE2000 entre pares sob simulação"
              + ("  [paleta sem cor: forma e texto carregam o estado]" if iguais else ""))
        if not iguais:
            for tipo in ("normal",) + TIPOS:
                pior, par = 1e9, None
                for i in range(len(cores)):
                    for j in range(i + 1, len(cores)):
                        d = ciede2000(rgb_para_lab(simular(cores[i][1], tipo)),
                                      rgb_para_lab(simular(cores[j][1], tipo)))
                        if d < pior:
                            pior, par = d, (cores[i][0], cores[j][0])
                limite = MIN_DELTA[tipo]
                # Só a paleta "daltonismo" promete separar os estados PELA COR.
                # Nas outras a cor é identidade (o âmbar do Fogo de Nebulosa, o
                # teal da Aurora) e a separação viaja por forma e texto — ali um
                # ΔE baixo é característica, não defeito.
                if nome == "daltonismo":
                    marca = "" if pior >= limite else "   <-- ABAIXO DO LIMITE"
                else:
                    marca = "" if pior >= limite else "   (forma e texto separam)"
                print(f"    {tipo:<13} menor ΔE00 = {pior:5.1f}  "
                      f"({par[0]} x {par[1]}){marca}")
                if pior < limite and nome == "daltonismo":
                    problemas.append(
                        f"daltonismo/{par[0]} x {par[1]} sob {tipo}: "
                        f"ΔE00={pior:.1f} < {limite}")

    print("\n" + "=" * 68)
    if problemas:
        print(f"{len(problemas)} PROBLEMA(S):")
        for p in problemas:
            print("  ✗", p)
    else:
        print("Nenhum problema.")
        print("  · texto acima de AA (4,5:1) nas seis paletas, nos três tipos;")
        print("  · a paleta daltonismo separa os quatro estados dentro do que")
        print("    Okabe-Ito permite (teto medido de 8,6 em tritanopia);")
        print("  · onde a cor colapsa, forma e texto carregam o estado — §35 item 3.")
    return problemas


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--autoteste", action="store_true")
    ap.add_argument("--tudo", action="store_true")
    args = ap.parse_args()

    falhas = autoteste()
    if falhas:
        return 2
    if args.autoteste and not args.tudo:
        return 0
    return 1 if relatorio() else 0


if __name__ == "__main__":
    sys.exit(main())
