# esquinote

uma parede de notas adesivas digitais fluida e offline-first, projetada para liberdade criativa e organização orgânica.

## funcionalidades

* **criação livre**: adicione notas adesivas que se posicionam aleatoriamente para uma sensação natural.
* **offline-first**: seus dados são salvos automaticamente no localstorage do navegador.
* **personalização**: escolha entre diversas cores pastéis e avalie suas notas.
* **backup de dados**: exporte e importe seu quadro completo via arquivo json.
* **interface fluida**: animações suaves com framer motion e design responsivo.

## tecnologias

este projeto utiliza uma arquitetura moderna sem necessidade de build (no-build), utilizando es modules diretamente no navegador.

* **react 18** (via esm)
* **tailwind css** (via cdn)
* **framer motion** (animações)
* **tabler icons** (ícones)

## como rodar

como este projeto não requer compilação (não precisa de `npm install` ou `npm run build`), você só precisa servir os arquivos estáticos.

### opção 1: vs code (live server)

1. abra a pasta do projeto no vs code.
2. instale a extensão **live server**.
3. clique em "go live" na barra inferior.

### opção 2: python

se você tem python instalado, abra o terminal na pasta do projeto e execute:

```bash
python3 -m http.server
# acesse http://localhost:8000
```

### opção 3: node.js (npx)

se preferir usar node.js:

```bash
npx serve .
# acesse o endereço mostrado no terminal
```

## estrutura

* `index.html`: ponto de entrada e configuração do import map.
* `app.tsx`: componente principal e gerenciamento de estado.
* `components/`: componentes reutilizáveis (notas, editor, controles).
* `types.ts`: definições de tipos typescript.
* `constants.ts`: configurações globais e paleta de cores.
