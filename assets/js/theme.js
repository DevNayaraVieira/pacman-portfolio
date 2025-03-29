/**
 * Pac-Man - Portfólio Nayara Vieira
 * Theme - Controlador do tema claro/escuro
 */

document.addEventListener('DOMContentLoaded', () => {
    // Elementos
    const themeToggle = document.getElementById('themeToggle');
    const body = document.documentElement;
    
    // Verificar tema salvo ou preferência do sistema
    const savedTheme = localStorage.getItem('theme');
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Definir tema inicial
    if (savedTheme) {
        body.setAttribute('data-theme', savedTheme);
        themeToggle.checked = savedTheme === 'dark';
    } else {
        body.setAttribute('data-theme', prefersDarkMode ? 'dark' : 'light');
        themeToggle.checked = prefersDarkMode;
    }
    
    // Evento de alternância do tema
    themeToggle.addEventListener('change', function() {
        if (this.checked) {
            body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            body.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
        }
        
        // Atualizar cores do mapa se o jogo estiver inicializado
        if (window.game && window.game.map) {
            window.game.map.updateColors();
        }
    });
    
    // Adicionar classe de transição ao body após um pequeno atraso
    // Isso evita transições visuais durante o carregamento inicial
    setTimeout(() => {
        document.body.classList.add('theme-transition');
    }, 300);
});

/**
 * Função para alternar o tema programaticamente
 * Pode ser chamada de outros scripts se necessário
 */
function toggleTheme() {
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.checked = !themeToggle.checked;
    
    // Acionar o evento de mudança para aplicar o tema
    themeToggle.dispatchEvent(new Event('change'));
}

// Função para obter o tema atual
function getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme');
}

// Função para definir o tema diretamente
function setTheme(theme) {
    if (theme !== 'light' && theme !== 'dark') return;
    
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.checked = theme === 'dark';
    
    // Acionar o evento de mudança para aplicar o tema
    themeToggle.dispatchEvent(new Event('change'));
}

// Expor funções globalmente
window.toggleTheme = toggleTheme;
window.getCurrentTheme = getCurrentTheme;
window.setTheme = setTheme;