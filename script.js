// Configuración
const valores = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
const palos = ['♠', '♥', '♦', '♣'];
const valorNumMap = {'2':2, '3':3, '4':4, '5':5, '6':6, '7':7, '8':8, '9':9, 'T':10, 'J':11, 'Q':12, 'K':13, 'A':14};

// Estado global
let flopActual = [];
let manoActual = [];
let accionCorrecta = '';
let stats = { correctas: 0, incorrectas: 0 };

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    nuevaMano();
});

// Generar nueva mano random
function nuevaMano() {
    flopActual = generarCartasRandom(3);
    manoActual = generarCartasRandom(2);
    accionCorrecta = calcularAccionCorrecta();
    
    mostrarCartasVisuales();
    resetearResultado();
}

// Generar array de cartas random
function generarCartasRandom(cantidad) {
    const cartas = [];
    for (let i = 0; i < cantidad; i++) {
        const valor = valores[Math.floor(Math.random() * valores.length)];
        const palo = palos[Math.floor(Math.random() * palos.length)];
        cartas.push({ valor, palo, valorNum: valorNumMap[valor] });
    }
    return cartas;
}

// Mostrar cartas en la interfaz
function mostrarCartasVisuales() {
    // Flop
    const flopContainer = document.getElementById('flop-cards-visual');
    flopContainer.innerHTML = '';
    flopActual.forEach(carta => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.textContent = carta.valor + carta.palo;
        flopContainer.appendChild(cardElement);
    });

    // Mano
    const handContainer = document.getElementById('hand-cards-visual');
    handContainer.innerHTML = '';
    manoActual.forEach(carta => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.textContent = carta.valor + carta.palo;
        handContainer.appendChild(cardElement);
    });
}

// Calcular acción correcta según reglas
function calcularAccionCorrecta() {
    if (debeCheckear(flopActual)) return 'CHECK';
    if (debeApostar52(flopActual)) return 'BET_52';
    if (debeApostar127(flopActual, manoActual)) return 'BET_127';
    return 'BET_26';
}

// Reglas de estrategia (las mismas de antes)
function debeCheckear(flop) {
    const valores = flop.map(c => c.valorNum);
    const maxValor = Math.max(...valores);
    
    if (maxValor <= 10) {
        const sorted = [...valores].sort((a, b) => b - a);
        const diff1 = sorted[0] - sorted[1];
        const diff2 = sorted[1] - sorted[2];
        if (diff1 <= 2 && diff2 <= 2) return true;
    }
    
    if (valores.includes(14)) {
        const otrasCartas = valores.filter(v => v !== 14);
        if (otrasCartas.every(v => v <= 5)) return true;
    }
    
    const palos = flop.map(c => c.palo);
    if (new Set(palos).size === 1) return true;
    
    return false;
}

function debeApostar52(flop) {
    const valores = flop.map(c => c.valorNum);
    const palos = flop.map(c => c.palo);
    
    if (Math.min(...valores) >= 10) {
        const conteoPalos = {};
        palos.forEach(p => conteoPalos[p] = (conteoPalos[p] || 0) + 1);
        if (Object.values(conteoPalos).includes(2)) return true;
    }
    
    if (new Set(valores).size === 1) return true;
    
    if (new Set(palos).size === 3) {
        if (Math.max(...valores) <= 9) return true;
    }
    
    return false;
}

function debeApostar127(flop, mano) {
    const valores = flop.map(c => c.valorNum);
    const palos = flop.map(c => c.palo);
    
    const valoresAltos = valores.filter(v => v >= 10);
    const valoresBajos = valores.filter(v => v < 10);
    
    if (valoresAltos.length !== 2 || valoresBajos.length !== 1) return false;
    
    const conteoPalos = {};
    palos.forEach(p => conteoPalos[p] = (conteoPalos[p] || 0) + 1);
    if (!Object.values(conteoPalos).includes(2)) return false;
    
    // Verificar mano (reglas simplificadas)
    const valoresMano = mano.map(c => c.valorNum);
    if (valores.includes(14)) { // Si hay A en flop
        return valoresMano.includes(14) && 
               (valoresMano.includes(13) || valoresMano.includes(12) || valoresMano.includes(11));
    }
    
    return true;
}

// Verificar respuesta del usuario
function verificarRespuesta(accionUsuario) {
    const resultMessage = document.getElementById('result-message');
    
    if (accionUsuario === accionCorrecta) {
        resultMessage.innerHTML = `<p>✅ <strong>¡Correcto!</strong> ${obtenerExplicacion()}</p>`;
        resultMessage.className = 'result-message correct';
        stats.correctas++;
    } else {
        resultMessage.innerHTML = `<p>❌ <strong>Incorrecto.</strong> La acción correcta era <strong>${accionCorrecta.replace('_', ' ')}</strong>. ${obtenerExplicacion()}</p>`;
        resultMessage.className = 'result-message incorrect';
        stats.incorrectas++;
    }
    
    actualizarEstadisticas();
}

// Obtener explicación de la acción
function obtenerExplicacion() {
    if (accionCorrecta === 'CHECK') return 'Flop cumple reglas de check (coordinado bajo, Axx bajo o monocolor)';
    if (accionCorrecta === 'BET_52') return 'Flop cumple reglas de bet 52% (dos cartas mismo palo + altas, trío o rainbow seco bajo)';
    if (accionCorrecta === 'BET_127') return 'Flop cumple reglas de bet 127% (dos cartas altas + baja + proyecto color con mano adecuada)';
    return 'No se cumplen otras reglas (apuesta por defecto 26%)';
}

// Resetear resultado
function resetearResultado() {
    const resultMessage = document.getElementById('result-message');
    resultMessage.innerHTML = '<p>Selecciona la acción correcta para este flop y mano</p>';
    resultMessage.className = 'result-message';
}

// Actualizar estadísticas
function actualizarEstadisticas() {
    document.getElementById('correct-count').textContent = stats.correctas;
    document.getElementById('incorrect-count').textContent = stats.incorrectas;
    
    const total = stats.correctas + stats.incorrectas;
    const accuracy = total > 0 ? Math.round((stats.correctas / total) * 100) : 0;
    document.getElementById('accuracy').textContent = accuracy + '%';
}