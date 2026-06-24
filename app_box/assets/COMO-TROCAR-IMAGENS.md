# Imagens HPBOX

Podes trocar estas imagens diretamente. Mantem o mesmo nome e o formato `.png`.

| Onde aparece | Ficheiro a substituir |
| --- | --- |
| Fundo lateral do quadro do atleta | `training-bg-clean.png` |
| Cabecalho Warm Up | `training-warm-up-header-clean.png` |
| Cabecalho Strength | `training-strength-header-clean.png` |
| Cabecalho WOD | `training-wod-header-clean.png` |

## Troca simples

1. Prepara a imagem em PNG.
2. Da-lhe exatamente o nome da tabela.
3. Substitui o ficheiro dentro desta pasta `assets` no GitHub.
4. Faz o commit. O Cloudflare atualiza a app automaticamente.

O tamanho e a altura do cabecalho ajustam-se automaticamente. Para melhores resultados, usa uma imagem larga e com fundo preto ou transparente.

## Usar outro nome de ficheiro

Abre `hpbox.config.js` e muda apenas o caminho dentro de `visualAssets`.

Se o novo Warm Up ja for verde, deixa `warmupFilter` como `"none"`. Se for laranja/preto, muda esse valor para `"hue-rotate(88deg) saturate(1.12)"` e a HPBOX transforma-o em verde.

Nota: um padrao quadriculado que esteja gravado na imagem nao e transparencia. Nesse caso, o padrao aparecera tambem na app; escolhe uma versao com fundo preto ou realmente transparente.
