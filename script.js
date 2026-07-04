document.addEventListener('DOMContentLoaded', () => {
    const apps = [
        // Jocs de lletres i paraules
        { 
            name: "Joc del Penjat", 
            path: 'https://ja.cat/penjat', 
            category: 'Jocs de lletres i paraules', 
            description: "Endevina la paraula oculta abans que es completi la figura del penjat.",
            icon: 'Penjat/favicon.svg'
        },
        { 
            name: "Tutti Frutti", 
            path: 'https://ja.cat/tutifruti', 
            category: 'Jocs de lletres i paraules', 
            description: "Posa a prova el teu vocabulari. Troba paraules de diferents categories que comencin amb la mateixa lletra.",
            icon: 'Tutifruti/favicon.svg'
        },

        // Jocs de lògica i nombres
        { 
            name: "2048", 
            path: 'https://ja.cat/2048', 
            category: 'Jocs de lògica i nombres', 
            description: "Combina les fitxes numèriques per arribar a la xifra 2048. Un repte d'estratègia.",
            icon: '2048/favicon.svg'
        },
        { 
                        name: "SlitherLink",
                        path: 'https://ja.cat/slither',
                        category: 'Jocs de lògica i nombres',
                        description: "Tanca el bucle. Un trencaclosques on has de crear una única línia contínua seguint les pistes numèriques.",
                        icon: 'SlitherLink/favicon.svg'
                    },
                    {
                        name: "Sudoku",
                        path: 'https://ja.cat/sudoku',
                        category: 'Jocs de lògica i nombres',
                        description: "Un clàssic trencaclosques de lògica numèrica. Omple la graella amb números de l'1 al 9 sense repetir-los en cap fila, columna o bloc de 3x3.",
                        icon: 'Sudoku/favicon.svg'
                    },
                    {
                        name: "Puzzle de Klotski",
                        path: 'https://ja.cat/klotski',
                        category: 'Jocs de lògica i nombres',
                        description: "Mou les peces lliscants per alliberar la peça vermella fins a la sortida. Inclou 400 nivells amb dificultat progressiva.",
                        icon: 'Klotski/favicon.png'
                    },
                    {
                        name: "Simon",
                        path: 'https://ja.cat/jocsimon',
                        category: 'Jocs de lògica i nombres',
                        description: "Posa a prova la teva memòria. Repeteix la seqüència de colors i sons que et mostra el joc.",
                        icon: 'Simon/favicon.png'
                    }    ];

    const mainContainer = document.getElementById('apps-container');
    if (!mainContainer) return;

    // Agrupa les aplicacions per categoria
    const appsByCategory = apps.reduce((acc, app) => {
        if (!acc[app.category]) {
            acc[app.category] = [];
        }
        acc[app.category].push(app);
        return acc;
    }, {});

    // Ordena les categories alfabèticament, però posa "Altres" al final
    const sortedCategories = Object.keys(appsByCategory).sort((a, b) => {
        if (a === 'Altres') return 1;
        if (b === 'Altres') return -1;
        return a.localeCompare(b);
    });

    // Genera l'HTML per a cada categoria
    sortedCategories.forEach(category => {
        const section = document.createElement('section');
        section.className = 'category-section mb-5';

        const categoryTitle = document.createElement('h2');
        categoryTitle.className = 'category-title';
        categoryTitle.textContent = category;
        section.appendChild(categoryTitle);

        const grid = document.createElement('div');
        grid.className = 'row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4';

        appsByCategory[category].forEach(app => {
            const col = document.createElement('div');
            col.className = 'col d-flex';
            
            // Intenta trobar un favicon SVG, si no, prova PNG, si tampoc, mostra una inicial
            const faviconSvgSrc = `${app.path}favicon.svg`;
            const faviconPngSrc = `${app.path}favicon.png`;
            const fallbackIcon = `https://via.placeholder.com/64/3498db/ffffff?text=${app.name.charAt(0)}`;

            col.innerHTML = `
                <a href="${app.path}" class="card-link" target="_blank" rel="noopener noreferrer">
                    <div class="card h-100">
                        <img src="${faviconSvgSrc}" class="card-img-top" alt="Icona de ${app.name}" onerror="this.onerror=null;this.src='${faviconPngSrc}'" onload="this.onload=null;this.onerror=function(){this.onerror=null;this.src='${fallbackIcon}';};">
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title">${app.name}</h5>
                            <p class="card-text flex-grow-1">${app.description}</p>
                        </div>
                    </div>
                </a>
            `;
            grid.appendChild(col);
        });

        section.appendChild(grid);
        mainContainer.appendChild(section);
    });
});
