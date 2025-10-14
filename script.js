document.addEventListener('DOMContentLoaded', () => {
    const games = [
        { name: '2048', path: '2048/' },
        { name: 'Penjat', path: 'Penjat/' },
        { name: 'SlitherLink', path: 'SlitherLink/' },
        { name: 'Tutifruti', path: 'Tutifruti/' }
    ];

    const gamesGrid = document.getElementById('games-grid');

    if (gamesGrid) {
        games.forEach(game => {
            const col = document.createElement('div');
            col.className = 'col';

            const cardHTML = `
                <a href="${game.path}index.html" class="card-link">
                    <div class="card h-100">
                        <img src="${game.path}favicon.svg" class="card-img-top" alt="Icona de ${game.name}">
                        <div class="card-body">
                            <h5 class="card-title">${game.name}</h5>
                        </div>
                    </div>
                </a>
            `;
            col.innerHTML = cardHTML;
            gamesGrid.appendChild(col);
        });
    }
});