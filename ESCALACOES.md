# Escalações ao Fundador

> Regra 24 do prompt operacional: *"Quando houver dúvida crítica de identidade, não improvisar:
> registrar a dúvida e escalar ao Fundador."*

Sete itens registrados. Em 05/09/2026, **seis foram resolvidos**: dois por decisão direta do
Fundador (§1, §5) e quatro sob autorização dele — primeiro *"pode resolver os problemas que
deu tranquilamente"*, depois *"pode decidir. Eu deixo você tomar controle de tudo"* (§2, §3,
§4, §7) — e depois *"tenta resolver a §6 também"* (§6). **As sete estão fechadas.**

A §3 fechou quando o alfa passou a ser **recuperado** do próprio arquivo oficial em vez de
esperado de um arquivo novo. A §7 fechou quando o teste em simulador de daltonismo virou
código verificável — e, ao virar código, encontrou e corrigiu um defeito de acessibilidade que
ninguém tinha visto. A §6 fechou por auditoria: das sete linhas de assets faltantes, duas já
eram decisão tomada, duas foram revogadas ou perderam função, duas foram superadas por código,
e a última nunca foi asset — é uma pergunta de produto.

**Nenhum arquivo foi inventado em nenhuma das três.**

Ainda em 05/09/2026 o Fundador **desbloqueou a parte de áudio da §6**, decidindo que a fala das
aberturas entra como **texto** em vez de arquivo sonoro. Os arquivos continuam não entregues —
o que mudou é que a ausência deixou de travar as animações.

Tudo que foi resolvido sob autorização está marcado como **DEFAULT DO AGENTE** — nenhum deles
é registrado como decisão do Fundador, conforme a regra 22.

Itens **congelados** (§64 — caridade e animações 3D) **não aparecem nesta lista**, conforme
§64.3: aparecem apenas como "congelado (ver §64)", sem status de pendência.

---

## ~~§1 — Qual "L" é a L canônica?~~ — ✅ RESOLVIDA pelo Fundador em 05/09/2026

**Decisão do Fundador (05/09/2026):** *"a L canônica é a dominante, confirma e registra"*.

A **L canônica** é a variante **dominante** — ombro arredondado, espinha interna curva,
gradiente violeta→azul, presente em **9 dos 13 arquivos oficiais** (05, 06, 07, 08, 09, 10,
11, 12, 13).

Registrada em [`docs/11-l-canonica.md`](docs/11-l-canonica.md), com anatomia, arquivos
portadores, variantes divergentes e regras de uso.

As duas variantes divergentes (**01** geométrica chapada, **04** traço "candy") permanecem na
biblioteca como **arquivos oficiais preservados**, mas **não são a L canônica** e não podem ser
usadas onde o Guia pede "a L canônica em destaque" (§70.5/§71.5).

> **Aberto dentro desta decisão:** o Fundador confirmou *qual* L é canônica, não o *status* das
> duas divergentes. Elas continuam preservadas e sem função atribuída — ver
> [`docs/11-l-canonica.md`](docs/11-l-canonica.md), seção "O que ficou em aberto".

---

## §2 — O "A" do wordmark LUMORA — ✅ RESOLVIDA em 05/09/2026 (por evidência)

**Autorização do Fundador (05/09/2026):** *"pode resolver os problemas que deu
tranquilamente"*.

| Arquivo | Forma do "A" |
|---|---|
| 09 `comunidade`, 10 `aurora`, 11 `elio`, 12 `migralumora` | **Sem travessão** — `Λ` |
| 13 `ecossistema` | Com travessão — `A` convencional |

**Decisão registrada:** o "A" oficial do wordmark é o **sem travessão (`Λ`)** — presente em
**4 dos 5** lockups oficiais. O `13_lumora_ecossistema_wordmark` é o desvio.

> **(DEFAULT DO AGENTE — resolvido por evidência majoritária sob autorização do Fundador,
> não por decisão de marca dele.** Nenhum wordmark foi redesenhado: a regra 14 continua
> valendo e o PNG oficial segue sendo a fonte canônica. O que mudou é qual dos cinco
> arquivos vale como referência de forma quando eles discordam.)

**Continua sem resposta possível:** nenhuma família tipográfica é nomeada em 59 páginas e
nenhum arquivo de fonte foi entregue. `--lum-fonte` usa pilha de sistema justamente para
**não** simular o wordmark. Enquanto não houver fonte ou vetor, o wordmark só existe como
imagem — e a imagem é JPEG 1024×1024 com perda. Registrado na §6.

---

## §3 — Falta de canal alfa — ✅ RESOLVIDA em 05/09/2026 (tela e papel)

**Autorização do Fundador (05/09/2026):** *"pode decidir. Eu deixo você tomar
controle de tudo"*.

Os 13 arquivos são JPEG (apesar da extensão `.png`), portanto **sem transparência**.

### A saída não foi conseguir um arquivo novo — foi recuperar o alfa do que já existe

A arte oficial é **luz aditiva sobre preto**. Achatar luz aditiva sobre preto é uma
operação conhecida e **inversível**:

```
observado   C = A·K + (1−A)·0 = A·K
recupera    A = max(C)/255          (a máscara)
            K = C · 255/max(C)      (a cor despremultiplicada)
```

Implementado em [`runtime/marca-com-alfa.js`](runtime/marca-com-alfa.js). **Nenhum byte
dos oficiais foi alterado** — a extração roda em memória, e os sha256 do MANIFESTO
continuam conferindo. Isto **não é desenhar a marca** (regra 14): é a mesma categoria de
medição com que `docs/10-paleta.md` extraiu a paleta.

### O piso de ruído é medido, não estimado

JPEG deixa lixo no campo escuro. Medido na borda de 40 px dos oficiais de fundo Deep
Space (09 e 11): p50 = 2–8, p99 = 8–10, **p99.9 = 12, máximo = 12**. O piso ficou em
12/255 com joelho suave até 20/255.

| Verificação | Resultado |
|---|---|
| Alfa do campo depois da extração | **0 exato** |
| Erro de ida-e-volta sobre preto puro | **máximo 12/255** — o pior pixel é `(0,0,12) → (0,0,0)` |
| Campo branco de 01/02 (chave inversa) | ruído **zero** medido; alfa vai a 0 exato |

Ou seja: só se perde o ruído que se queria remover. A arte sai intacta.

### A tabela da escalação anterior, refeita

| Fundo | Antes (`mix-blend-mode: screen`) | Agora (alfa recuperado) |
|---|---|---|
| **Deep Space** — o Céu Vivo real | ✅ passa | ✅ passa |
| Cortina de aurora acesa | 🟡 a caixa some, mas o gradiente **desbota** | ✅ **não desbota mais** |
| **Papel branco** (papel-mãe) | ❌ a marca **desaparece** | ✅ **compõe íntegra** |

O cabeçalho do papel-mãe **deixou de ser área reservada e vazia**: `.lum-doc-marca`
agora recebe a L canônica. Os três elementos que §70.5 pede para o papel-mãe estão os
três em pé.

### A regra de recorte é computada, não uma coordenada escrita à mão

1. o **maior componente conexo** é a marca-base (a L);
2. entram também os componentes **contidos na caixa dela** — é assim que a bolha-ponto
   entra, sendo ela elemento opcional da L (`docs/11-l-canonica.md`);
3. o wordmark fica de fora porque está abaixo, nunca contido.

Medido em 11: L = 48 494 px em (369,198)–(655,562); bolha = 10 862 px em
(519,241)–(635,358), contida; letras do wordmark começam em y = 619. Em 09 a mesma regra
devolve a L com os anéis orbitais, que ali fazem parte do símbolo — generaliza sem
exceção escrita.

### O que **não** foi resolvido, e por que não tem conserto por este caminho

O wordmark "LUMORA" é **branco**. Sobre papel branco ele some — e isso não é perda de
informação nem defeito da extração: é o resultado fisicamente correto de luz branca sobre
papel branco. Para wordmark sobre fundo claro continua faltando **uma versão em tinta
escura**, que só o produtor entrega.

Isso **não bloqueia nada hoje**: §70.5/§71.5 pedem *"a L canônica em destaque"*, e a L é
cromática — sobrevive ao papel. Se algum dia se quiser o wordmark impresso sobre claro, aí
sim é pedido ao produtor.

> **(DEFAULT DO AGENTE — método técnico e reversível, sob autorização do Fundador.**
> Se a decisão for esperar um arquivo com alfa do produtor, basta apontar
> `data-lum-marca` para ele: o resto do runtime não muda.)

---

## §4 — RotaCerta: teal ou violeta? — ✅ RESOLVIDA em 05/09/2026 (leitura)

**Autorização do Fundador (05/09/2026):** *"pode resolver os problemas que deu tranquilamente"*.

§65.1 especifica: *"malha de **rotas luminosas (teal + âmbar)** ligando waypoints em forma de
constelação"*. A frase descreve a **malha de rotas**, não o símbolo.

**Leitura adotada:** o **teal é da malha de rotas** — a camada procedural de fundo. O
**símbolo** mantém o violeta→azul da L canônica, com o âmbar (`#FFA238`, que confere com o
asset) nos waypoints e no rastro. Assim **não há divergência**: o asset oficial
`03_lumora_star_path` e a §65.1 falam de coisas diferentes.

A leitura deixou de ser teoria e virou código: a cena 3D `abertura.rotacerta` desenha a
malha de rotas **em teal** ligando waypoints **em âmbar**, sobre o plano de chão em
perspectiva — exatamente o "GPS espacial" da §65.1.

> **(DEFAULT DO AGENTE — interpretação de texto sob autorização do Fundador.** Se a intenção
> era que o próprio símbolo fosse teal, é só dizer: nada foi alterado no asset, que continua
> preservado byte a byte.)

---

## ~~§5 — Briefing da abertura do Lumora Business~~ — ✅ RESOLVIDA pelo Fundador em 05/09/2026

**Decisão do Fundador (05/09/2026):** *"usa o céu estrelado puro como briefing oficial"*.

O briefing do slot `abertura.business` passa a ser:

> **Céu estrelado puro** — estrelas, partículas e constelações do Céu Vivo, **sem motivo
> extra** (§65.1).

Substitui o original — *"gota de aquarela se espalhando formando o nome"* — revogado com a
aquarela em §60.1. Era o único dos seis slots de abertura órfão dessa revogação; agora os seis
têm briefing vigente.

Registrado em `runtime/animations.manifest.json` e implementado em `runtime/animacoes.js`.
A cena deixou de ser placeholder: **nenhuma das 11 cenas dos slots é mais provisória.**

**Consequência na encenação:** a cena foi ajustada para ser fiel ao "sem motivo extra". Antes,
as estrelas convergiam de posições dispersas para formar a constelação — um movimento de
montagem, que é justamente o motivo extra que a §65.1 exclui. Agora elas **acendem onde estão**
(§70.1, "cada ação acende uma estrela") e a constelação **se desenha entre elas** (§71.1, a
Constelação do Dia). O céu não monta nada: ele faz o que já faz.

Fixa, sem variação por horário — §44 registra que a animação de inicialização de um sistema é
sempre a mesma.

> **Continua aberto (dentro da §6):** o áudio `business_abertura_som.mp3` está marcado
> `[REVOGADO]` na §45 porque acompanhava a gota de aquarela. Com o briefing novo, **precisa ser
> refeito** — e áudio é produção do profissional contratado (§48), não desta plataforma.

---

## §6 — Assets citados no Guia que não foram entregues — ✅ AUDITADA em 05/09/2026

**Autorização do Fundador (05/09/2026):** *"tenta resolver a §6 também"*.

Nenhum arquivo foi inventado — a regra continua sendo registrar a ausência. O que esta
auditoria fez foi outra coisa: **perguntar, linha por linha, se a ausência ainda significa
alguma coisa.** Sete linhas; nenhuma delas bloqueia mais nada.

| Citado em | O que é | Situação |
|---|---|---|
| **§45** | 10 arquivos da Biblioteca de Áudio | **Decidido.** O Fundador trocou por texto em 05/09/2026. Identidade sonora é do profissional contratado (§48/§64.2, congelada) |
| **§44** | 3 sons antigos do Elio | **Decidido.** Rejeitados pelo Fundador em 23/08/2026 |
| **§65.6** | Amostras conceituais: fundos RotaCerta e Hub, tema Aurora | **Superadas** — ver abaixo |
| **§65.6, §66.5, §67.10, §68.8** | 4 protótipos HTML (v1–v4) | **Superados** — ver abaixo |
| **§49.4** | ZIP com assets de referência **provisórios** para os vídeos | **Sem função.** As 11 cenas existem em código; §49.3 já define que o vídeo final do profissional entra como versão superior sem mexer no código. Referência provisória para uma coisa que já está pronta não referencia nada |
| **§65.1** | Wallpapers padrão Global/Américas/Europa | **Revogados.** §60.1/§60.2 revogaram wallpaper por país/região. Entregar Américas e Europa hoje seria violar uma revogação em vigor. O "Global" é o Céu Vivo, que é procedural |
| **§49.3, §45** | Slots **"fia alto"** e **"magos"** | **Não são slots.** O próprio Guia os marca como pendentes de definição na §18 |

### Por que as amostras conceituais foram superadas

A §65.6 registra três amostras aprovadas em 01/09/2026 (fundo RotaCerta "GPS espacial", fundo
Hub "Núcleo de Controle", tema Aurora). Elas nunca chegaram. Mas a §65.1 diz o que elas são:

> "as amostras conceituais servem de **direção**, não de asset final — a renderização final
> será procedural (canvas/WebGL), **nunca imagem estática**."

E a direção **já estava escrita**, em `docs/04-identidade-por-sistema.md`: "malha de rotas
luminosas (teal + âmbar) ligando waypoints em forma de constelação, com leve rastro de
navegação" para o RotaCerta; "núcleo de luz + anéis orbitais + satélites-bolha" para o Hub.

Faltava a **implementação**, não a direção — e faltava mesmo: esses motivos existiam só como
*abertura* (animação de entrada, slot §49), nunca como ambiente permanente de uso.

Agora existem: `runtime/camada-de-sistema.js` desenha a camada complementar de cada sistema
sobre o Céu Vivo, em Canvas 2D, como a §65.1 exige. Uma amostra estática hoje não acrescentaria
nada ao que já está desenhado — e a §65.1 proíbe que ela fosse o asset final de qualquer forma.

**Business e Comunidade têm camada vazia de propósito**, e o código registra o motivo de cada
um: céu estrelado puro por decisão do Fundador; e, na Comunidade, o Atlas Estelar já *é* a
camada.

### Por que os protótipos v1–v4 foram superados

A escalação dizia deles: *"são a única demonstração executável da Interface Viva"*. **Deixaram
de ser.** `runtime/verificacao.html` é uma demonstração executável de todo o sistema — Céu Vivo,
Interface Viva, navegação em bolhas e em ondas, notificações, Atlas, animações, seis paletas,
papel-mãe — com **135 checagens automatizadas** rodando por cima
(`node ferramentas/testes/rodar.mjs`).

Os protótipos continuam sendo **registro histórico** de quatro decisões (§67.10, §68.8), e como
registro histórico eles seguem não entregues. Isso é diferente de bloquear alguma coisa.

### O que sobrou

Uma pergunta, e ela não é sobre asset: **"fia alto" e "magos" existem como sistema?** O Guia
os cita em §49.3/§45 e ao mesmo tempo os marca como pendentes de definição na §18. Se forem
sistemas de verdade, precisam de briefing; se não forem, saem da lista da §45. É decisão de
produto do Fundador, não arquivo faltando.

> **(DEFAULT DO AGENTE — a camada complementar é implementação de direção já registrada, não
> assinatura nova: cada motivo vem citado de §65.1 e docs/04. A geometria, as densidades por
> nível e a decisão de desligar o ambiente na paleta preto/branco são deste agente.)**

---

## §7 — As três paletas de alto contraste — ✅ RESOLVIDA em 05/09/2026 (QA incluído)

**Autorização do Fundador (05/09/2026):** *"pode resolver os problemas que deu
tranquilamente"* e, depois, *"pode decidir. Eu deixo você tomar controle de tudo"*.

**As seis paletas estão implementadas** em `runtime/acessibilidade-bonita.css`:

| Paleta | Origem | Fundo | Menor contraste de texto |
|---|---|---|---|
| Padrão | §35 item 7 | `#00040F` | 7,76:1 — AAA |
| Preto / branco | §35 item 7 | `#000000` | 21,00:1 — AAA |
| Daltonismo (Okabe-Ito) | §35 item 7 | `#00040F` | 5,30:1 — AA |
| **Fogo de Nebulosa** | §70.6 | `#1A0603` (vermelho-laranja profundo) | 10,14:1 — AAA |
| **Aurora Noite** | §70.6 | `#01100E` | 10,12:1 — AAA |
| **Aurora Dia** | §70.6 | `#F4FBF8` | 6,62:1 — AA |

**As duas listas foram tratadas como uma só feature de seis paletas:** a §35 garante o
mínimo funcional, a §70.6 acrescenta as três com identidade. Isso resolve a divergência de
nomenclatura que a escalação apontava.

### O teste em simulador de daltonismo deixou de ser pendência

Era o que faltava. Em vez de rodar uma ferramenta externa (Coblis, Stark) e relatar o
resultado — que ninguém depois consegue repetir e obter o mesmo número — a simulação virou
código no repositório: [`ferramentas/verificar_daltonismo.py`](ferramentas/verificar_daltonismo.py).

Método: Viénot, Brettel & Mollon (1999). As cores são lidas **do CSS que é realmente
servido**, com `var()` resolvido, então a ferramenta não pode divergir do runtime. O script
**se autovalida antes de reportar** (ΔE2000 conferido contra os vetores publicados por
Sharma, Wu & Dalal; eixo neutro preservado; cada tipo colapsa exatamente a dimensão do seu
cone ausente, e não mais que isso). Se um invariante falhar, ele não reporta número nenhum.

**Resultado:** o texto fica **acima de AA (4,5:1) nas seis paletas e nos três tipos de
dicromacia** — o menor valor medido é 6,21:1 (Aurora Dia, `--lum-texto-3`, protanopia).

### Dois achados, e o que foi feito com cada um

**1. A paleta daltonismo já estava no ótimo — e o ótimo é 8,6, não 11.**
Sob tritanopia, `--lum-atencao` e `--lum-critico` ficam a ΔE00 = 8,6. Busca exaustiva: das
7 cores Okabe-Ito, 6 passam em AA sobre o Deep Space (o azul `#0072B2` mede 3,95:1 e sai —
esses tokens são usados como `color:` de texto). Das **15 combinações de 4 dessas 6, todas
empatam em 8,6** sob tritanopia. Não há atribuição melhor dentro de Okabe-Ito.

Isso não é defeito da paleta: Okabe-Ito foi construída para o eixo vermelho-verde
(protanopia e deuteranopia), não para o azul-amarelo. **Nada foi trocado** — trocar
pioraria o eixo que a paleta existe para resolver, ou obrigaria a inventar cores fora de
uma referência publicada. O limiar da ferramenta ficou em 8,0 para tritanopia, o que ainda
pega regressão, com a justificativa registrada no próprio código.

**2. Um nível de urgência dependia só da cor — isso sim foi corrigido.**
A busca encontrou um defeito real de acessibilidade que o teste de paletas revelou: a
urgência **"alta"** das Notificações Vivas se distinguia de "normal" apenas pela cor âmbar.
O ritmo (respiração de 1,5 s) seria o canal de reserva, mas `prefers-reduced-motion` o
desliga; e na variante de faixa (tema Aurora) "alta" era só um brilho âmbar, sem ritmo
próprio nenhum. Com `--lum-atencao` e `--lum-critico` a ΔE00 = 8,6 sob tritanopia, a cor
sozinha não sustentava a hierarquia.

Corrigido em `runtime/notificacoes-vivas.css`: "alta" ganhou **forma própria** (losango —
terceira forma, distinta do círculo de "normal" e do quadrado de "crítica") e **sufixo de
texto** (`" · prioridade"`), nas duas variantes. Texto sobrevive a movimento reduzido, a
dicromacia e a impressão sem cor. O comentário do arquivo, que prometia "cor E ritmo E
ícone", foi corrigido para descrever o que o código faz de fato.

> **(DEFAULT DO AGENTE — os valores das paletas e o microtexto `" · prioridade"` são deste
> agente, sob autorização do Fundador. Pendentes de conferência dele.)**

---

## Nota de método

Todas as sete escalações seguem a mesma regra: **onde o Guia decide, este repositório obedece;
onde o Guia cala e a decisão é de marca, este repositório pergunta.**

Onde o Guia cala mas a decisão é técnica e reversível, o repositório escolheu um default e o
marcou como **"(DEFAULT DO AGENTE — justificativa)"** — nunca como decisão do Fundador.
Esses defaults estão listados no [`README.md`](README.md).
