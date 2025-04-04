# Pac-Man - Projeto de Portfólio

![Pac-Man Banner](assets/img/banner.gif)

## Sobre o Projeto

Este projeto é uma implementação moderna e responsiva do clássico jogo Pac-Man, desenvolvido como parte do meu portfólio de desenvolvimento web. O jogo mantém as mecânicas clássicas que todos amam, enquanto adiciona elementos modernos de design e experiência do usuário.

### Características

- ✨ Desenvolvido com HTML5 Canvas, JavaScript moderno e CSS3
- 🎮 Controles suaves e responsivos para desktop e dispositivos móveis
- 🎨 Temas claro e escuro com cores personalizadas
- 🧠 Inteligência artificial para os fantasmas com comportamentos únicos
- 🏆 Sistema de pontuação e high score salvo localmente
- 🔊 Efeitos sonoros nostálgicos
- 📱 Design responsivo que funciona em múltiplos dispositivos

## Tecnologias Utilizadas

- **HTML5 Canvas** para renderização do jogo
- **JavaScript** para lógica do jogo e manipulação do DOM
- **CSS3** para estilização e animações
- **LocalStorage API** para salvar highscores
- **Web Audio API** para efeitos sonoros
- **Bootstrap 5** para componentes UI responsivos
- **Font Awesome** para ícones

## Como Jogar

### Controles

- **Desktop**: Use as teclas de seta (↑, ↓, ←, →) para mover o Pac-Man
- **Mobile**: Use os botões direcionais na tela
- **Pause**: Pressione 'P' ou o botão de pausa
- **Mute**: Clique no botão de som para ativar/desativar áudio

### Objetivo

- Coma todos os pontos para completar o nível
- Evite os fantasmas ou perderá uma vida
- Coma power pellets (pontos grandes) para deixar os fantasmas vulneráveis e poder comê-los
- Coma frutas para ganhar pontos bônus

### Personagens

- **Pac-Man (Amarelo)**: O herói controlado pelo jogador
- **Blinky (Vermelho)**: O fantasma mais agressivo que persegue diretamente
- **Pinky (Rosa)**: Tenta emboscar o Pac-Man se posicionando à sua frente
- **Inky (Ciano)**: Movimento imprevisível, usando Blinky como referência
- **Clyde (Laranja)**: Alterna entre perseguir e fugir, o mais errático

![Print 1](assets/img/print1.png)
![Print 1](assets/img/print2.png)
![Print 1](assets/img/print3.png)
![Print 1](assets/img/print4.png)
![Print 1](assets/img/print5.png)
![Print 1](assets/img/print6.png)

## Instalação e Execução

O jogo não requer instalação. Para jogar:

1. Clone este repositório:
   ```
   git clone https://github.com/devnayaravieira/pacman-portfolio.git
   ```

2. Abra o arquivo `index.html` em um navegador moderno (Chrome, Firefox, Edge, Safari)

Ou acesse [a versão online](https://pacman-devnayaravieira.netlify.app) para jogar imediatamente.

## Estrutura do Projeto

```
pacman-portfolio/
  ├── index.html               # Página principal do jogo
  ├── assets/                  # Pasta para todos os recursos
  │   ├── css/                 # Estilos CSS
  │   │   └── style.css        # Arquivo principal de estilos
  │   ├── js/                  # Scripts JavaScript
  │   │   ├── game.js          # Lógica principal do jogo
  │   │   ├── player.js        # Classe do jogador (Pac-Man)
  │   │   ├── ghosts.js        # Classe dos fantasmas
  │   │   ├── map.js           # Configuração do mapa/labirinto
  │   │   ├── utils.js         # Funções utilitárias
  │   │   └── theme.js         # Controle do tema claro/escuro
  │   ├── audio/               # Arquivos de áudio
  │   │   ├── eat.wav          # Som ao comer pellets
  │   │   ├── power.wav        # Som ao comer power pellet
  │   │   ├── eat-ghost.wav    # Som ao comer fantasmas
  │   │   └── death.wav        # Som ao perder uma vida
  │   └── img/                 # Imagens e sprites
  │       ├── sprites.png      # Sprites de todos os elementos
  │       └── favicon.png      # Ícone do jogo
  └── README.md                # Documentação do projeto
```

## Futuras Implementações

- [ ] Sistema de ranking online
- [ ] Mapas personalizados adicionais
- [ ] Versão mobile nativa com React Native
- [ ] Modos de jogo alternativos
- [ ] Customização visual do Pac-Man

## Contribuições

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Faça commit das suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Envie para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para detalhes.

## Contato

Nayara Vieira - [nayvieira_@hotmail.com](mailto:nayvieira_@hotmail.com)

Links:
- [GitHub](https://github.com/devnayaravieira)
- [LinkedIn](https://linkedin.com/in/nayaravieira-pcd)
- [Instagram](https://instagram.com/nayaravieira_)

## Agradecimentos

- Namco pelo jogo original de Pac-Man
- Meus mentores e professores
- A comunidade de desenvolvimento de jogos que compartilha conhecimento

---

<p align="center">
  Desenvolvido com ❤️ por DevNayaraVieira
</p>