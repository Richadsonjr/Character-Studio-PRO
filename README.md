
# Character Studio PRO

![Character Studio PRO](https://i.imgur.com/your-project-screenshot.png) <!-- Substitua por um screenshot real do seu projeto -->

**Character Studio PRO** é uma aplicação web avançada para a criação de personagens completos, utilizando o poder da IA generativa do Google Gemini. A ferramenta permite aos usuários definir perfis detalhados e gerar representações visuais de alta fidelidade e vozes únicas, com suporte para clonagem a partir de áudio de referência.

O design é totalmente responsivo (Mobile-First) e focado em uma experiência de usuário fluida e intuitiva.

---

## ✨ Funcionalidades Principais

- **Criação Detalhada de Personagens**: Defina nome, idade, gênero, estilo, personalidade, traços físicos, localização e contexto.
- **Geração de Imagens por IA**: Cria múltiplas imagens de alta qualidade (`Full shot`, `Medium shot`, `Portrait`) com base no perfil.
- **Voz Neural (TTS)**: Gera uma narração para o personagem com base em um roteiro fornecido, usando vozes neurais.
- **Clonagem de Voz**: Utilize um arquivo de áudio (MP3) como referência para clonar o tom, sotaque e estilo da voz para o personagem.
- **Referência Visual**: Faça o upload de uma imagem de rosto para guiar a IA na geração de um personagem com traços consistentes.
- **Histórico de Sessão**: Acompanhe todas as gerações em um painel "drop-up" (bottom sheet) conveniente, permitindo revisitar, visualizar e baixar criações anteriores.
- **Visualização e Download**: Visualize as imagens em um lightbox e baixe todos os assets (imagens e áudio .wav) com um único clique.
- **Design Responsivo**: Experiência de uso otimizada para desktops, tablets e dispositivos móveis.
- **Backup no Google Drive (Opcional)**: Módulo de serviço (`driveService.ts`) preparado para fazer backup dos assets em uma pasta no Google Drive do usuário.

---

## 🚀 Stack de Tecnologia

- **Frontend**:
  - [**React**](https://react.dev/) (v19) com TypeScript
  - [**Tailwind CSS**](https://tailwindcss.com/) para estilização
  - **ES Modules (ESM)** via `esm.sh` para importação de pacotes sem a necessidade de um bundler.

- **Inteligência Artificial (Google Gemini)**:
  - **`@google/genai`**: SDK oficial para a API do Gemini.
  - **`gemini-2.5-flash-image`**: Geração de imagens.
  - **`gemini-2.5-flash-preview-tts`**: Síntese de voz (Text-to-Speech).
  - **`gemini-2.5-flash-native-audio-preview-09-2025`**: Clonagem de voz a partir de áudio de referência.

---

## 🛠️ Como Executar o Projeto Localmente

Para executar o Character Studio PRO, você precisa de um servidor web local para servir o arquivo `index.html`.

### Pré-requisitos

1.  Um navegador web moderno (Chrome, Firefox, Edge).
2.  Uma chave de API do **Google Gemini**.

### Configuração

1.  **Chave de API**:
    O projeto espera que a chave da API do Gemini esteja disponível como uma variável de ambiente. Em um ambiente de desenvolvimento ou de hospedagem, você deve configurar uma variável chamada `process.env.API_KEY`. O código acessa a chave diretamente através desta variável.

    *Importante*: A aplicação foi projetada para ter a chave de API injetada no ambiente de execução e não solicita que o usuário a insira manualmente.

2.  **Iniciando um Servidor Local**:
    Como o projeto não usa um bundler (como Webpack ou Vite), você pode servi-lo estaticamente. Uma das maneiras mais fáceis é usando o `serve` do `npm` ou o servidor HTTP do Python.

    **Opção A: Usando `serve` (Node.js)**
    Se você tem o Node.js instalado, execute no terminal na raiz do projeto:
    ```bash
    npx serve
    ```

    **Opção B: Usando Python**
    Se você tem o Python instalado, execute no terminal:
    ```bash
    # Para Python 3
    python -m http.server

    # Para Python 2
    python -m SimpleHTTPServer
    ```

3.  **Acesse a Aplicação**:
    Abra seu navegador e acesse a URL fornecida pelo servidor (geralmente `http://localhost:3000` ou `http://localhost:8000`).

---

## 📂 Estrutura do Projeto

```
/
├── components/
│   └── ProfileCard.tsx      # (Componente de exemplo, não utilizado na App principal)
├── services/
│   ├── geminiService.ts     # Lógica para chamadas à API do Gemini (imagem e voz)
│   └── driveService.ts      # Lógica para integração com a API do Google Drive
├── utils/
│   └── audioUtils.ts        # Funções utilitárias para manipulação de áudio (decode, WAV)
├── App.tsx                  # Componente principal da aplicação
├── index.html               # Arquivo HTML de entrada (inclui importmap e estilos)
├── index.tsx                # Ponto de entrada do React
├── types.ts                 # Definições de tipos do TypeScript
├── metadata.json            # Metadados da aplicação
└── README.md                # Este arquivo
```

---

## 🔮 Possíveis Melhorias

- **Persistência de Histórico**: Usar `localStorage` ou `IndexedDB` para salvar o histórico entre sessões.
- **Animação de Personagem**: Reintegrar uma funcionalidade de animação de vídeo (como o Veo) para dar vida às imagens estáticas.
- **Compartilhamento**: Gerar um link único para compartilhar um personagem criado.
- **Temas**: Adicionar temas de cores (claro/escuro) para a interface.
