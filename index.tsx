/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// --- Constants ---
const REAL_GAME_DURATION_SECONDS = 180; // 3 minutes
const SIMULATED_GAME_DURATION_MINUTES = 60; // 1 hour
const TIME_COMPRESSION_FACTOR = (SIMULATED_GAME_DURATION_MINUTES * 60) / REAL_GAME_DURATION_SECONDS;

type CookState = 'notAdded' | 'raw' | 'cooking' | 'perfect' | 'overcooked' | 'burnt';

interface Ingredient {
    id: string;
    name: string;
    icon: string;
    addedToPan: boolean;
    simTimeAdded: number | null; // Simulated seconds into game when added
    cookState: CookState;

    // Timing for ADDING the ingredient
    correctSimTimeStart: number; // Earliest sim game time to add
    correctSimTimeEnd: number;   // Latest sim game time to add

    // Timing for COOKING DURATION IN PAN (simulated seconds in pan)
    minCookTimeInPanSim: number;       // Min duration in pan to not be 'raw'
    idealCookTimeInPanEndSim: number;  // Max duration in pan for 'perfect'
    overcookTimeInPanEndSim: number;   // Max duration in pan for 'overcooked' (beyond this is 'burnt')

    pointsForAddingOnTime: number;
    penaltyForAddingWrongTime: number;
    penaltyForMissing: number;
    
    pointsForPerfectCook: number;
    penaltyForRaw: number;
    penaltyForOvercooked: number;
    penaltyForBurnt: number;
    
    essential: boolean;
}

const ALL_INGREDIENTS_BASE: Omit<Ingredient, 'addedToPan' | 'simTimeAdded' | 'cookState'>[] = [
    // Times are in simulated game seconds. Durations are for time IN PAN.
    { id: 'oil', name: 'Aceite', icon: '💧', correctSimTimeStart: 0, correctSimTimeEnd: 120, minCookTimeInPanSim: 1, idealCookTimeInPanEndSim: 3600, overcookTimeInPanEndSim: 3600, pointsForAddingOnTime: 2, penaltyForAddingWrongTime: 1, penaltyForMissing: 5, pointsForPerfectCook: 1, penaltyForRaw: 0, penaltyForOvercooked: 0, penaltyForBurnt: 1, essential: true },
    { id: 'chicken', name: 'Pollo', icon: '🍗', correctSimTimeStart: 60, correctSimTimeEnd: 300, minCookTimeInPanSim: 600, idealCookTimeInPanEndSim: 1200, overcookTimeInPanEndSim: 1500, pointsForAddingOnTime: 5, penaltyForAddingWrongTime: 3, penaltyForMissing: 10, pointsForPerfectCook: 5, penaltyForRaw: 8, penaltyForOvercooked: 4, penaltyForBurnt: 10, essential: true }, // Sofrito: 10-20 min cook, overcooked after 25 min
    { id: 'rabbit', name: 'Conejo', icon: '🐇', correctSimTimeStart: 60, correctSimTimeEnd: 300, minCookTimeInPanSim: 600, idealCookTimeInPanEndSim: 1200, overcookTimeInPanEndSim: 1500, pointsForAddingOnTime: 5, penaltyForAddingWrongTime: 3, penaltyForMissing: 10, pointsForPerfectCook: 5, penaltyForRaw: 8, penaltyForOvercooked: 4, penaltyForBurnt: 10, essential: true },
    { id: 'greenBeans', name: 'Judías V.', icon: '🌿', correctSimTimeStart: 300, correctSimTimeEnd: 600, minCookTimeInPanSim: 300, idealCookTimeInPanEndSim: 720, overcookTimeInPanEndSim: 900, pointsForAddingOnTime: 3, penaltyForAddingWrongTime: 2, penaltyForMissing: 5, pointsForPerfectCook: 3, penaltyForRaw: 4, penaltyForOvercooked: 2, penaltyForBurnt: 5, essential: true }, // Sofrito: 5-12 min cook
    { id: 'garrofo', name: 'Garrofó', icon: '🫘', correctSimTimeStart: 300, correctSimTimeEnd: 600, minCookTimeInPanSim: 300, idealCookTimeInPanEndSim: 720, overcookTimeInPanEndSim: 900, pointsForAddingOnTime: 3, penaltyForAddingWrongTime: 2, penaltyForMissing: 5, pointsForPerfectCook: 3, penaltyForRaw: 4, penaltyForOvercooked: 2, penaltyForBurnt: 5, essential: true },
    { id: 'tomato', name: 'Tomate', icon: '🍅', correctSimTimeStart: 480, correctSimTimeEnd: 720, minCookTimeInPanSim: 180, idealCookTimeInPanEndSim: 480, overcookTimeInPanEndSim: 600, pointsForAddingOnTime: 4, penaltyForAddingWrongTime: 2, penaltyForMissing: 5, pointsForPerfectCook: 3, penaltyForRaw: 3, penaltyForOvercooked: 2, penaltyForBurnt: 5, essential: true }, // Sofrito: 3-8 min cook
    { id: 'paprika', name: 'Pimentón', icon: '🌶️', correctSimTimeStart: 600, correctSimTimeEnd: 780, minCookTimeInPanSim: 10, idealCookTimeInPanEndSim: 30, overcookTimeInPanEndSim: 45, pointsForAddingOnTime: 3, penaltyForAddingWrongTime: 2, penaltyForMissing: 4, pointsForPerfectCook: 2, penaltyForRaw: 1, penaltyForOvercooked: 4, penaltyForBurnt: 8, essential: true }, // Critical: 10-30s, burns fast
    { id: 'water', name: 'Agua', icon: '🚰', correctSimTimeStart: 720, correctSimTimeEnd: 1020, minCookTimeInPanSim: 1, idealCookTimeInPanEndSim: 3600, overcookTimeInPanEndSim: 3600, pointsForAddingOnTime: 3, penaltyForAddingWrongTime: 2, penaltyForMissing: 8, pointsForPerfectCook: 0, penaltyForRaw: 0, penaltyForOvercooked: 0, penaltyForBurnt: 0, essential: true },
    { id: 'saffron', name: 'Azafrán', icon: '✨', correctSimTimeStart: 720, correctSimTimeEnd: 1020, minCookTimeInPanSim: 1, idealCookTimeInPanEndSim: 3600, overcookTimeInPanEndSim: 3600, pointsForAddingOnTime: 4, penaltyForAddingWrongTime: 2, penaltyForMissing: 4, pointsForPerfectCook: 1, penaltyForRaw: 0, penaltyForOvercooked: 0, penaltyForBurnt: 0, essential: true },
    { id: 'salt', name: 'Sal', icon: '🧂', correctSimTimeStart: 0, correctSimTimeEnd: 1500, minCookTimeInPanSim: 1, idealCookTimeInPanEndSim: 3600, overcookTimeInPanEndSim: 3600, pointsForAddingOnTime: 1, penaltyForAddingWrongTime: 1, penaltyForMissing: 2, pointsForPerfectCook: 0, penaltyForRaw: 0, penaltyForOvercooked: 0, penaltyForBurnt: 0, essential: true },
    { id: 'rice', name: 'Arroz', icon: '🍚', correctSimTimeStart: 1500, correctSimTimeEnd: 1800, minCookTimeInPanSim: 900, idealCookTimeInPanEndSim: 1200, overcookTimeInPanEndSim: 1380, pointsForAddingOnTime: 10, penaltyForAddingWrongTime: 8, penaltyForMissing: 20, pointsForPerfectCook: 10, penaltyForRaw: 15, penaltyForOvercooked: 8, penaltyForBurnt: 20, essential: true }, // Cooks 15-20 min, overcooked 23 min, burnt after
    { id: 'rosemary', name: 'Romero', icon: '🌱', correctSimTimeStart: 2700, correctSimTimeEnd: 3300, minCookTimeInPanSim: 60, idealCookTimeInPanEndSim: 300, overcookTimeInPanEndSim: 480, pointsForAddingOnTime: 1, penaltyForAddingWrongTime: 1, penaltyForMissing: 0, pointsForPerfectCook: 1, penaltyForRaw: 0, penaltyForOvercooked: 1, penaltyForBurnt: 2, essential: false }, // Added near end for ~5 min
];


// --- State Variables ---
let gameState: "pre-start" | "playing" | "finished" = "pre-start";
let realTimeRemainingSeconds: number = REAL_GAME_DURATION_SECONDS;
let simulatedTimeElapsedSeconds: number = 0;
let fireLevel: number = 5;
let isPaellaCovered: boolean = false;
let ingredients: Ingredient[] = [];
let stirCountAfterRice: number = 0;
let riceAddedSimTime: number | null = null;
let score: number = 0;
let detailedFeedback: string[] = [];
let gameIntervalId: number | null = null;

// --- DOM Elements ---
const realTimeTimerEl = document.getElementById('real-time-timer')!;
const simulatedTimeTimerEl = document.getElementById('simulated-time-timer')!;
const ingredientsListEl = document.getElementById('ingredients-list')!;
const paellaPanVisualEl = document.getElementById('pan-ingredients-visual')!;
const paellaLidEl = document.getElementById('paella-lid')!;
const fireSliderEl = document.getElementById('fire-slider') as HTMLInputElement;
const fireValueDisplayEl = document.getElementById('fire-value-display')!;
const fireLevelDisplayEl = document.getElementById('fire-level-display')!;
const fireFlames = document.querySelectorAll('#fire-animation .flame') as NodeListOf<HTMLElement>;
const stirButtonEl = document.getElementById('stir-button') as HTMLButtonElement;
const coverButtonEl = document.getElementById('cover-button') as HTMLButtonElement;
const serveButtonEl = document.getElementById('serve-button') as HTMLButtonElement;
const startModalEl = document.getElementById('start-modal')!;
const endModalEl = document.getElementById('end-modal')!;
const startGameButtonEl = document.getElementById('start-game-button') as HTMLButtonElement;
const playAgainButtonEl = document.getElementById('play-again-button') as HTMLButtonElement;
const scoreDisplayEl = document.getElementById('score-display')!;
const feedbackMessageEl = document.getElementById('feedback-message')!;
const endTitleEl = document.getElementById('end-title')!;

// --- Helper Functions ---
function formatTime(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function resetIngredientsState(): Ingredient[] {
    return ALL_INGREDIENTS_BASE.map(base => ({
        ...base,
        addedToPan: false,
        simTimeAdded: null,
        cookState: 'notAdded',
    }));
}

// --- Game Logic Functions ---
function startGame(): void {
    gameState = "playing";
    realTimeRemainingSeconds = REAL_GAME_DURATION_SECONDS;
    simulatedTimeElapsedSeconds = 0;
    fireLevel = 5;
    isPaellaCovered = false;
    ingredients = resetIngredientsState();
    stirCountAfterRice = 0;
    riceAddedSimTime = null;
    score = 0;
    detailedFeedback = [];

    startModalEl.classList.remove('visible');
    endModalEl.classList.remove('visible');
    
    updateIngredientsPanel();
    updatePaellaVisual();
    updateControls();
    updateTimers();
    updateFireVisual();

    gameIntervalId = setInterval(updateGame, 1000);
}

function updateGame(): void {
    if (gameState !== "playing") return;

    realTimeRemainingSeconds--;
    simulatedTimeElapsedSeconds += TIME_COMPRESSION_FACTOR;

    // Update cook state of ingredients in pan
    let visualUpdateNeeded = false;
    ingredients.filter(ing => ing.addedToPan && ing.simTimeAdded !== null).forEach(ing => {
        const timeInPan = simulatedTimeElapsedSeconds - ing.simTimeAdded!;
        const oldCookState = ing.cookState;

        if (timeInPan > ing.overcookTimeInPanEndSim) {
            ing.cookState = 'burnt';
        } else if (timeInPan > ing.idealCookTimeInPanEndSim) {
            ing.cookState = 'overcooked';
        } else if (timeInPan > ing.minCookTimeInPanSim) {
            ing.cookState = 'perfect';
        } else if (timeInPan > 0) { 
             ing.cookState = 'cooking'; 
        } else { 
            ing.cookState = 'raw';
        }
        
        if(ing.id === 'oil' && timeInPan > 0) ing.cookState = 'perfect';

        if (oldCookState !== ing.cookState) {
            visualUpdateNeeded = true;
        }
    });

    if (visualUpdateNeeded) {
        updatePaellaVisual();
    }
    updateTimers();

    if (realTimeRemainingSeconds <= 0) {
        endGame(false); 
    }
}

function addIngredientToPaella(ingredientId: string): void {
    if (gameState !== "playing") return;

    const ingredient = ingredients.find(ing => ing.id === ingredientId);
    if (ingredient && !ingredient.addedToPan) {
        ingredient.addedToPan = true;
        ingredient.simTimeAdded = simulatedTimeElapsedSeconds;
        ingredient.cookState = 'raw'; 
        if (ingredient.id === 'rice') {
            riceAddedSimTime = simulatedTimeElapsedSeconds;
        }
        updateIngredientsPanel();
        updatePaellaVisual();
    }
}

function handleFireChange(newLevel: number): void {
    if (gameState !== "playing") return;
    fireLevel = newLevel;
    updateFireVisual(); 
}

function updateFireVisual() {
    const baseFlameHeight = 20; 
    fireFlames.forEach((flame, index) => {
        const activeFlames = Math.ceil(fireLevel / (10 / fireFlames.length));
        if (index < activeFlames ) {
            flame.style.opacity = '1';
            const heightPercentage = Math.min(1, (fireLevel / 10) * (1 + (index * 0.1)));
            flame.style.height = `${baseFlameHeight * heightPercentage * (0.8 + Math.random() * 0.4)}px`;
        } else {
            flame.style.opacity = '0';
            flame.style.height = '0px';
        }
    });
    fireSliderEl.value = String(fireLevel);
    fireValueDisplayEl.textContent = String(fireLevel);
    fireLevelDisplayEl.textContent = `Fuego: ${fireLevel}`;
}


function handleStirIngredients(): void {
    if (gameState !== "playing") return;
    if (riceAddedSimTime !== null && simulatedTimeElapsedSeconds > riceAddedSimTime) {
        stirCountAfterRice++;
    }
}

function handleCoverToggle(): void {
    if (gameState !== "playing") return;
    isPaellaCovered = !isPaellaCovered;
    coverButtonEl.textContent = isPaellaCovered ? "Destapar Paella" : "Tapar Paella";
    if (isPaellaCovered) {
        paellaLidEl.classList.remove('hidden');
        paellaLidEl.textContent = 'TAPADA';
    } else {
        paellaLidEl.classList.add('hidden');
    }
}

function servePaella(): void {
    if (gameState !== "playing") return;
    endGame(true); 
}

function calculateScore(servedByUser: boolean): void {
    let currentScore = 50; 
    detailedFeedback = [];

    ingredients.forEach(ing => {
        if (ing.addedToPan && ing.simTimeAdded !== null) {
            if (ing.simTimeAdded >= ing.correctSimTimeStart && ing.simTimeAdded <= ing.correctSimTimeEnd) {
                currentScore += ing.pointsForAddingOnTime;
            } else {
                currentScore -= ing.penaltyForAddingWrongTime;
                detailedFeedback.push(`El ${ing.name.toLowerCase()} se añadió ${ing.simTimeAdded < ing.correctSimTimeStart ? 'DEMASIADO PRONTO' : 'DEMASIADO TARDE'}. ¡El tempo es clave!`);
            }

            switch (ing.cookState) {
                case 'perfect':
                    currentScore += ing.pointsForPerfectCook;
                    break;
                case 'raw':
                    currentScore -= ing.penaltyForRaw;
                    if (ing.penaltyForRaw > 0) detailedFeedback.push(`El ${ing.name.toLowerCase()} quedó CRUDO. ¿Pretendías servirnos un tartar?`);
                    break;
                case 'overcooked':
                    currentScore -= ing.penaltyForOvercooked;
                     if (ing.penaltyForOvercooked > 0) detailedFeedback.push(`El ${ing.name.toLowerCase()} se pasó de cocción. Una pena, casi lo tenías.`);
                    break;
                case 'burnt':
                    currentScore -= ing.penaltyForBurnt;
                    if (ing.penaltyForBurnt > 0) detailedFeedback.push(`¡SACRILEGIO! El ${ing.name.toLowerCase()} está QUEMADO. Esto es inaceptable.`);
                    break;
            }
        } else if (ing.essential) {
            currentScore -= ing.penaltyForMissing;
            detailedFeedback.push(`Faltó ${ing.name.toLowerCase()}, un ingrediente ESENCIAL. ¡Imperdonable olvido!`);
        }
    });

    const rice = ingredients.find(i => i.id === 'rice');
    if (rice?.addedToPan && rice.simTimeAdded !== null) {
        const riceCookTime = simulatedTimeElapsedSeconds - rice.simTimeAdded;
        if (riceCookTime > (rice.idealCookTimeInPanEndSim - 600) && rice.cookState !== 'burnt' && rice.cookState !== 'overcooked') {
            if (fireLevel > 7) { 
                currentScore -= 8;
                detailedFeedback.push("El fuego INCINERANDO el arroz al final... ¡Control, por favor!");
            }
            if (fireLevel < 3 && riceCookTime > rice.minCookTimeInPanSim + 300) { 
                currentScore -= 8;
                detailedFeedback.push("Fuego demasiado BAJO para el arroz. ¿Esperabas un milagro?");
            }
        }
    } else if (ingredients.find(i => i.id === 'water')?.addedToPan && !rice?.addedToPan) { 
         currentScore -= 15;
         detailedFeedback.push("Agua sin arroz... Has hecho un caldo caro, no una paella. ¡Qué desperdicio!");
    }


    if (stirCountAfterRice > 1) { 
        currentScore -= Math.min(15, stirCountAfterRice * 3); 
        detailedFeedback.push(`Removiste el arroz ${stirCountAfterRice} veces. ¡El arroz NO SE TOCA una vez distribuido!`);
    }

    const riceCooked = rice?.cookState === 'perfect' || rice?.cookState === 'overcooked';
    if (riceCooked) {
        const simulatedRestTimeIdealStart = rice.simTimeAdded! + rice.idealCookTimeInPanEndSim;
        if (isPaellaCovered && servedByUser && simulatedTimeElapsedSeconds >= simulatedRestTimeIdealStart && simulatedTimeElapsedSeconds <= simulatedRestTimeIdealStart + (10 * 60) ) {
            currentScore += 5;
        } else if (!isPaellaCovered && servedByUser && simulatedTimeElapsedSeconds >= simulatedRestTimeIdealStart && simulatedTimeElapsedSeconds <= simulatedRestTimeIdealStart + (10*60)) {
            currentScore -= 5;
            detailedFeedback.push("La paella necesita REPOSAR TAPADA. Un detalle crucial que has ignorado.");
        }
    }


    if (servedByUser) {
        if (rice?.addedToPan && rice.cookState === 'raw') {
            currentScore -= 15; 
            // detailedFeedback already covers raw rice, but we ensure score hit
        }
        if (simulatedTimeElapsedSeconds < SIMULATED_GAME_DURATION_MINUTES * 60 * 0.7 && rice?.addedToPan) { 
             currentScore -= 5;
             detailedFeedback.push("Serviste con prisas. La paciencia es una virtud del paellero.");
        }
    } else { 
        currentScore -= 10; 
        detailedFeedback.push("¡TIEMPO! No has servido. Una paella no entregada es una paella fallida.");
    }
    
    score = Math.max(0, Math.min(100, Math.round(currentScore)));
}

function generateMasterChefFeedback(): void {
    let mainMessage: string;
    let title: string;
    let feedbackIntro: string;

    if (score === 100) {
        title = "¡PERFECCIÓN DIVINA!";
        mainMessage = "No tengo palabras. Has trascendido la cocina para crear ARTE. Cada grano, cada sabor, es una sinfonía. ¡ESTO es paella! ¡BRAVO!";
        feedbackIntro = "Matices de un genio (si es que hay alguno):";
    } else if (score >= 95) {
        title = "¡OBRA MAESTRA INMINENTE!";
        mainMessage = "Has rozado la perfección con la punta de los dedos. Una paella que emociona, que habla, que casi levita. Un suspiro te separa de la gloria eterna. ¡Impresionante!";
        feedbackIntro = "Detalles para la matrícula de honor:";
    } else if (score >= 90) {
        title = "¡TALENTO EXCEPCIONAL!";
        mainMessage = "Aquí hay madera de campeón. Técnica depurada, instinto y una ejecución brillante. Esta paella tiene alma y demuestra un profundo respeto por el producto. ¡Sigue así!";
        feedbackIntro = "Observaciones para pulir el diamante:";
    } else if (score >= 85) {
        title = "¡DESTACADO CON HONORES!";
        mainMessage = "Una paella muy notable, de esas que se recuerdan. Buen control, buen sabor, buena presentación. Demuestras oficio y pasión. ¡Muy bien!";
        feedbackIntro = "Apuntes para alcanzar la excelencia:";
    } else if (score >= 80) {
        title = "¡MUY PROMETEDOR, PERO...!";
        mainMessage = "Tienes la base, tienes la idea, pero te falta ese 'algo' que convierte lo bueno en extraordinario. Hay destellos, pero también sombras. ¡No te conformes!";
        feedbackIntro = "Áreas de mejora para un futuro campeón:";
    } else if (score >= 70) {
        title = "APROBADO, CON PEROS EVIDENTES";
        mainMessage = "Tu paella es... correcta. Pasa el corte, pero sin alardes. Hay intención, pero la ejecución se queda a medio gas. Necesitas más rigor y ambición.";
        feedbackIntro = "Aspectos a revisar urgentemente:";
    } else if (score >= 60) {
        title = "MEDIOCRE. SIN ALMA NI RIESGO";
        mainMessage = "Me has dejado completamente frío. Esta paella no transmite nada. Es un ejercicio de mínimos, insípido y falto de carácter. ¡Despierta o dedícate a otra cosa!";
        feedbackIntro = "Defectos que no se pueden ignorar:";
    } else if (score >= 50) {
        title = "PREOCUPANTEMENTE DEFICIENTE";
        mainMessage = "Empezamos a tener un problema serio. Los errores son demasiado evidentes y afectan gravemente al resultado. Esto se aleja mucho de una paella aceptable.";
        feedbackIntro = "Errores de bulto que sentencian el plato:";
    } else if (score >= 40) {
        title = "UN AUTÉNTICO DESPROPÓSITO";
        mainMessage = "Sinceramente, no sé ni por dónde empezar. Esto es un cúmulo de desatinos. Has maltratado el producto y la técnica. ¡Necesitas volver a los fundamentos, YA!";
        feedbackIntro = "Desastres culinarios detectados:";
    } else if (score >= 30) {
        title = "¡OFENSA CULINARIA!";
        mainMessage = "Esto no es una paella, es un insulto a la tradición y al buen gusto. Cada bocado es una penitencia. Francamente, impresentable.";
        feedbackIntro = "Atrocidades cometidas en esta paella:";
    } else if (score >= 20) {
        title = "¡VERGÜENZA AJENA!";
        mainMessage = "Dudo que esto se lo comiera ni el más hambriento. Es una sucesión de errores catastróficos. Deberías replantearte seriamente tu futuro en la cocina.";
        feedbackIntro = "Lista de horrores (no exhaustiva):";
    } else { // score < 20
        title = "¿ESTO ES UNA BROMA?";
        mainMessage = "No, en serio, ¿pretendías que evaluara ESTO? Es un atentado gastronómico. Has conseguido lo imposible: hacer una anti-paella. Retírate.";
        feedbackIntro = "Crónica de un fracaso anunciado:";
    }

    if(detailedFeedback.length > 0) {
        mainMessage += `\n\n${feedbackIntro}\n- ` + detailedFeedback.slice(0,4).join("\n- "); // Show top 3-4 specific points
    }

    feedbackMessageEl.textContent = mainMessage;
    endTitleEl.textContent = title;
}


function endGame(servedByUser: boolean): void {
    if (gameState !== "playing") return;
    gameState = "finished";
    if (gameIntervalId) clearInterval(gameIntervalId);
    gameIntervalId = null;

    calculateScore(servedByUser);
    generateMasterChefFeedback();

    scoreDisplayEl.textContent = `Puntuación: ${score}/100`;
    endModalEl.classList.add('visible');
    
    stirButtonEl.disabled = true;
    coverButtonEl.disabled = true;
    serveButtonEl.disabled = true;
    fireSliderEl.disabled = true;
    ingredients.forEach(ing => {
        const btn = document.getElementById(`ing-${ing.id}`) as HTMLButtonElement | null;
        if (btn) btn.disabled = true;
    });
}


// --- UI Update Functions ---
function updateTimers(): void {
    realTimeTimerEl.textContent = `Tiempo Real: ${formatTime(realTimeRemainingSeconds)}`;
    simulatedTimeTimerEl.textContent = `Tiempo Cocción: ${formatTime(Math.floor(simulatedTimeElapsedSeconds))} / ${formatTime(SIMULATED_GAME_DURATION_MINUTES * 60)}`;
}

function updateIngredientsPanel(): void {
    ingredientsListEl.innerHTML = ''; 
    ingredients.forEach(ingredient => {
        const button = document.createElement('button');
        button.id = `ing-${ingredient.id}`;
        button.classList.add('ingredient-button');
        button.innerHTML = `<span class="ingredient-icon">${ingredient.icon}</span> ${ingredient.name}`;
        button.setAttribute('aria-label', `Añadir ${ingredient.name}`);
        if (ingredient.addedToPan || gameState !== "playing") {
            button.disabled = true;
        }
        button.onclick = () => addIngredientToPaella(ingredient.id);
        ingredientsListEl.appendChild(button);
    });
}

function updatePaellaVisual(): void {
    paellaPanVisualEl.innerHTML = '';
    ingredients.filter(ing => ing.addedToPan).forEach(ing => {
        const span = document.createElement('span');
        span.classList.add('ingredient-in-pan');
        if (ing.cookState !== 'notAdded') {
             span.classList.add(ing.cookState);
        }
        span.textContent = ing.icon;
        span.setAttribute('aria-label', `${ing.name} (${ing.cookState})`);
        span.setAttribute('data-icon', ing.icon); 
        paellaPanVisualEl.appendChild(span);
    });
}

function updateControls(): void {
    fireSliderEl.value = String(fireLevel);
    fireValueDisplayEl.textContent = String(fireLevel);
    fireLevelDisplayEl.textContent = `Fuego: ${fireLevel}`;
    updateFireVisual();

    coverButtonEl.textContent = isPaellaCovered ? "Destapar Paella" : "Tapar Paella";
     if (isPaellaCovered) {
        paellaLidEl.classList.remove('hidden');
        paellaLidEl.textContent = 'TAPADA';
    } else {
        paellaLidEl.classList.add('hidden');
    }

    const isPlaying = gameState === "playing";
    stirButtonEl.disabled = !isPlaying;
    coverButtonEl.disabled = !isPlaying;
    serveButtonEl.disabled = !isPlaying;
    fireSliderEl.disabled = !isPlaying;
}

// --- Initialization ---
function init(): void {
    startGameButtonEl.onclick = startGame;
    playAgainButtonEl.onclick = () => { 
        endModalEl.classList.remove('visible');
        startModalEl.classList.add('visible');
        gameState = "pre-start";
        ingredients = resetIngredientsState(); 
        updateIngredientsPanel(); 
        updatePaellaVisual(); 
        fireLevel = 5; 
        isPaellaCovered = false; 
        updateControls(); 
        fireSliderEl.disabled = true; 
        realTimeRemainingSeconds = REAL_GAME_DURATION_SECONDS; 
        simulatedTimeElapsedSeconds = 0;
        updateTimers();
    };
    
    fireSliderEl.oninput = (e) => {
        const newLevel = parseInt((e.target as HTMLInputElement).value);
        fireValueDisplayEl.textContent = String(newLevel); 
        fireLevelDisplayEl.textContent = `Fuego: ${newLevel}`;
        if (gameState === "playing") { 
            handleFireChange(newLevel);
        } else { 
            fireLevel = newLevel;
            updateFireVisual();
        }
    };
    stirButtonEl.onclick = handleStirIngredients;
    coverButtonEl.onclick = handleCoverToggle;
    serveButtonEl.onclick = servePaella;

    startModalEl.classList.add('visible');
    ingredients = resetIngredientsState(); 
    updateIngredientsPanel(); 
    updateControls(); 
    updateTimers(); 
    updateFireVisual(); 
    fireSliderEl.disabled = true; 
}

// Start the application
init();