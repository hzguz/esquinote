# EsquiNote 📝

Uma parede de notas adesivas digitais fluida e offline-first, projetada para liberdade criativa e organização orgânica.

![EsquiNote Preview](https://via.placeholder.com/800x400?text=Preview+EsquiNote)

## ✨ Funcionalidades

- **Criação Livre**: Adicione notas adesivas que se posicionam aleatoriamente para uma sensação natural.
- **Offline-First**: Seus dados são salvos automaticamente no LocalStorage do navegador.
- **Personalização**: Escolha entre diversas cores pastéis e avalie suas notas.
- **Backup de Dados**: Exporte e importe seu quadro completo via arquivo JSON.
- **Interface Fluida**: Animações suaves com Framer Motion e design responsivo.

## 🛠️ Tecnologias

Este projeto utiliza uma arquitetura moderna sem necessidade de build (No-Build), utilizando ES Modules diretamente no navegador.

- **React 18** (via ESM)
- **Tailwind CSS** (via CDN)
- **Framer Motion** (Animações)
- **Tabler Icons** (Ícones)

## 🚀 Como Rodar

Como este projeto não requer compilação (não precisa de `npm install` ou `npm run build`), você só precisa servir os arquivos estáticos.

### Opção 1: VS Code (Live Server)
1. Abra a pasta do projeto no VS Code.
2. Instale a extensão **Live Server**.
3. Clique em "Go Live" na barra inferior.

### Opção 2: Python
Se você tem Python instalado, abra o terminal na pasta do projeto e execute:
```bash
python3 -m http.server
# Acesse http://localhost:8000
```

### Opção 3: Node.js (npx)
Se preferir usar Node.js:
```bash
npx serve .
# Acesse o endereço mostrado no terminal
```

## 📄 Estrutura

- `index.html`: Ponto de entrada e configuração do Import Map.
- `App.tsx`: Componente principal e gerenciamento de estado.
- `components/`: Componentes reutilizáveis (Notas, Editor, Controles).
- `types.ts`: Definições de tipos TypeScript.
- `constants.ts`: Configurações globais e paleta de cores.

---
Desenvolvido com 💚
