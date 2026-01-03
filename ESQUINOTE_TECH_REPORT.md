# 📔 Relatório Técnico: Muranote

Este relatório detalha a arquitetura, as tecnologias e o roteiro de aprendizado para o projeto **Muranote**, uma aplicação de notas colaborativa com foco em UX fluida e sincronização em tempo real.

---

## 🛠️ Stack Tecnológica

### 1. Linguagens e Core
- **TypeScript:** Utilizado em 100% do código. Define a estrutura de dados para notas (`NoteData`), usuários (`UserProfile`) e colunas (`ColumnData`), garantindo que erros de "propriedade indefinida" sejam detectados antes de rodar o app.
- **React 19:** Utiliza os hooks mais modernos (`useCallback`, `useMemo`, `useRef`) para otimizar o desempenho, especialmente importante quando há dezenas de notas animadas na tela.
- **Vite:** Ferramenta de build que permite um ciclo de desenvolvimento ultra-rápido.

### 2. Interface e UX (Frontend)
- **Tailwind CSS:** Toda a estilização é baseada em classes utilitárias. O projeto usa um sistema de variáveis CSS (`:root`) no `index.html` para permitir temas dinâmicos e manutenção fácil de cores e fontes (Manrope).
- **Framer Motion:** Responsável pela "alma" do app. Gerencia:
  - **Canvas Infinito:** Uso de `useMotionValue` para arrastar a área de trabalho.
  - **Drag and Drop:** Sistema complexo que detecta se uma nota foi solta em uma coluna ou no canvas livre.
  - **Layout Transitions:** Animações automáticas quando uma nota muda de ordem ou de coluna.
- **Tabler Icons:** Biblioteca de ícones vetoriais com traços ajustáveis via código.

### 3. Backend e Persistência (BaaS)
- **Firebase (Google):** 
  - **Firestore:** Banco de dados NoSQL orientado a documentos. Utiliza o padrão `onSnapshot` para sincronização bidirecional em tempo real.
  - **Firebase Auth:** Autenticação via Google integrada ao perfil do usuário.
- **LocalStorage:** Utilizado como cache local e persistência para usuários "Guest" (visitantes).

---

## 🏗️ Arquitetura do Sistema

### Gerenciamento de Estado
O estado principal reside no `App.tsx`, que controla a lista global de notas e colunas. 
- **Modo Livre (Free):** Notas possuem coordenadas `x` e `y` absolutas.
- **Modo Grade (Grid):** Notas perdem o `x/y` visual e passam a obedecer a prioridade de `columnId` e `order`.

### Lógica de Sincronização
O projeto implementa uma função `syncLocalToCloud` que migra notas criadas anonimamente para a conta do usuário assim que ele faz login, garantindo que nenhum dado seja perdido na transição.

### Segurança
Todas as notas passam pelo **DOMPurify** antes de serem renderizadas no `NoteEditor.tsx`, impedindo ataques de injeção de scripts (XSS).

---

## 🚀 Guia de Aprendizado para Replicar o Muranote

Para construir algo similar, siga esta ordem de estudos:

### 1. A Base (1-2 meses)
- **HTML/CSS:** Foco em **Flexbox** e **CSS Grid**.
- **JavaScript Moderno:** Entender `Arrays` (map, filter, reduce), `Promises` e `Async/Await`.

### 2. React e Tipagem (2-3 meses)
- **React Hooks:** Entenda profundamente `useState`, `useEffect` e `useContext`.
- **TypeScript:** Aprenda a criar `Interfaces` e como tipar componentes React.

### 3. Backend Serverless (1 mês)
- **Firebase:** Aprenda a configurar o console do Firebase e usar os métodos `getDocs`, `addDoc` e `onSnapshot`.

### 4. Animações e Movimento (1 mês)
- **Framer Motion:** Comece com animações simples e avance para o `AnimatePresence` e `drag` events.

### 5. Projeto Prático
- **Desafio:** Crie uma lista de tarefas onde você pode arrastar itens entre "Pendente" e "Concluído" e salvar isso no Firebase. Esse é o "modelo reduzido" do Muranote.

---

> [!NOTE]
> **Curiosidade Técnica:** O Muranote utiliza uma técnica de "Espionagem" (Spy Mode) e "Pareamento" (Matching) onde um usuário pode ver o canvas do outro em tempo real, simplesmente trocando o `UID` de sincronização do Firebase.

---
*Relatório gerado por Antigravity AI.*
