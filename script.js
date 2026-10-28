// Elementos do DOM
const goalInput = document.getElementById('goalInput');
const saveGoalBtn = document.getElementById('saveGoalBtn');
const notifyBtn = document.getElementById('notifyBtn');
const waterWave = document.getElementById('waterWave');
const percentageText = document.getElementById('percentage');
const litersText = document.getElementById('liters');
const customMlInput = document.getElementById('customMl');
const addCustomBtn = document.getElementById('addCustomBtn');
const historyList = document.getElementById('historyList');
const resetBtn = document.getElementById('resetBtn');
const quickButtons = document.querySelectorAll('.btn-water');

// Estado da Aplicação
let dailyGoal = parseInt(localStorage.getItem('water_goal')) || 2000;
let totalDrank = parseInt(localStorage.getItem('water_drank')) || 0;
let history = JSON.parse(localStorage.getItem('water_history')) || [];
let notificationInterval = null;

goalInput.value = dailyGoal;
updateUI();

// Som suave de gota (Web Audio API - sem arquivos externos)
function playWaterSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        // Efeito de frequência subindo (simulando gota d'água)
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
        // Ignora caso o navegador bloqueie áudio automático
    }
}

// Salvar Meta
saveGoalBtn.addEventListener('click', () => {
    const newGoal = parseInt(goalInput.value);
    if (newGoal && newGoal > 0) {
        dailyGoal = newGoal;
        localStorage.setItem('water_goal', dailyGoal);
        updateUI();
        alert('Meta atualizada com sucesso!');
    }
});

// Adicionar Água pelos botões rápidos
quickButtons.forEach(button => {
    button.addEventListener('click', () => {
        const ml = parseInt(button.getAttribute('data-ml'));
        addWater(ml);
    });
});

// Adicionar Água pelo campo customizado
addCustomBtn.addEventListener('click', () => {
    const ml = parseInt(customMlInput.value);
    if (ml && ml > 0) {
        addWater(ml);
        customMlInput.value = '';
    }
});

// Função central para adicionar água
function addWater(ml) {
    totalDrank += ml;
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    history.unshift({ id: Date.now(), ml, time: timeString });
    
    saveData();
    updateUI();
    playWaterSound();
}

// Remover item do histórico
function removeHistoryItem(id) {
    const item = history.find(h => h.id === id);
    if (item) {
        totalDrank = Math.max(0, totalDrank - item.ml);
        history = history.filter(h => h.id !== id);
        saveData();
        updateUI();
    }
}

// Reiniciar dia
resetBtn.addEventListener('click', () => {
    if (confirm('Deseja zerar o consumo de água de hoje?')) {
        totalDrank = 0;
        history = [];
        saveData();
        updateUI();
    }
});

// Salvar dados no navegador
function saveData() {
    localStorage.setItem('water_drank', totalDrank);
    localStorage.setItem('water_history', JSON.stringify(history));
}

// Atualizar interface visual
function updateUI() {
    let percentage = Math.round((totalDrank / dailyGoal) * 100);
    if (percentage > 100) percentage = 100;

    waterWave.style.height = `${percentage}%`;
    percentageText.textContent = `${percentage}%`;
    litersText.textContent = `${totalDrank} / ${dailyGoal} ml`;

    // Renderizar Histórico
    historyList.innerHTML = '';
    if (history.length === 0) {
        historyList.innerHTML = '<li class="history-item" style="justify-content: center; color: #94A3B8;">Nenhum registro hoje.</li>';
        return;
    }

    history.forEach(item => {
        const li = document.createElement('li');
        li.className = 'history-item';
        li.innerHTML = `
            <span><strong>+${item.ml} ml</strong>s - ${item.time}</span>
            <button onclick="removeHistoryItem(${item.id})"><i class="fa-solid fa-trash"></i></button>
        `;
        historyList.appendChild(li);
    });
}

// Sistema de Notificações do Navegador
notifyBtn.addEventListener('click', async () => {
    if (!("Notification" in window)) {
        alert("Seu navegador não suporta notificações.");
        return;
    }

    if (Notification.permission === "granted") {
        toggleNotifications();
    } else if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
            toggleNotifications();
        }
    } else {
        alert("As notificações estão bloqueadas nas configurações do seu navegador.");
    }
});

function toggleNotifications() {
    if (notificationInterval) {
        clearInterval(notificationInterval);
        notificationInterval = null;
        notifyBtn.innerHTML = '<i class="fa-solid fa-bell-slash"></i> Ativar Lembretes';
        notifyBtn.classList.remove('active');
        alert("Lembretes desativados.");
    } else {
        // Dispara a cada 1 hora (3600000 ms). Para testes rápidos, pode trocar para 10000 (10 seg)
        notificationInterval = setInterval(() => {
            new Notification("Hora de beber água! 💧", {
                body: "Mantenha-se hidratado para ter mais foco e energia.",
                icon: "https://cdn-icons-png.flaticon.com/512/3105/3105807.png"
            });
        }, 3600000);

        notifyBtn.innerHTML = '<i class="fa-solid fa-bell"></i> Lembretes Ativos (1h)';
        notifyBtn.classList.add('active');
        alert("Lembretes ativados! Você receberá um aviso a cada 1 hora.");
    }
}