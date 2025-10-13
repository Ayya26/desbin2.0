// Global variables
let currentPest = null;
let isPowerOn = false;
let timerInterval = null;
let activeTime = 0;
let selectedTimer = 0;
let sessionStartAt = null;

// History keys
const HISTORY_STORAGE_KEY = 'desbin_history_v1';

// Pest frequency configurations
const pestFrequencies = {
    mice: { freq: '20-30 kHz', icon: 'fas fa-mouse', color: '#8e44ad' },
    birds: { freq: '15-25 kHz', icon: 'fas fa-dove', color: '#3498db' }
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    updateDeviceStatus();
    updateWelcomeMessage();
    initializeWeather();
    updateLocationTime();
    initializeTabs();
    renderHistory();
    initHistoryFilters();
    
    // Update time every minute
    setInterval(updateLocationTime, 60000);
    // cek status tiap 5 detik
    setInterval(getStatus, 5000);
});

function initializeApp() {
    // Initialize timer display
    updateActiveTimeDisplay();
    
    // Add touch feedback for mobile
    addTouchFeedback();
    // Disable power until a pest is selected
    const powerBtn = document.getElementById('powerBtn');
    if (powerBtn) {
        powerBtn.disabled = true;
        powerBtn.style.opacity = '0.6';
        powerBtn.style.cursor = 'not-allowed';
    }
    
    console.log('Ultrasonic Pest Control App initialized');
}

// Navigation functions
function goToWelcome() {
    document.getElementById('welcomePage').classList.add('active');
    document.getElementById('pestSelectionPage').classList.remove('active');
    
    // Reset all selections
    resetAllSelections();
}

function goToPestSelection() {
    document.getElementById('welcomePage').classList.remove('active');
    document.getElementById('pestSelectionPage').classList.add('active');
    
    // Add entrance animation
    animatePageTransition();
}

function animatePageTransition() {
    const page = document.getElementById('pestSelectionPage');
    page.style.animation = 'none';
    setTimeout(() => {
        page.style.animation = 'fadeIn 0.5s ease-in-out';
    }, 10);
}

// Tabs handling
function initializeTabs() {
    setActiveTab('usir');
}
function handleBackFromPestSelection() {
    const tabRiwayatVisible = document.getElementById('tabRiwayat')?.style.display === 'block';
    if (tabRiwayatVisible) {
        setActiveTab('usir');
    } else {
        goToWelcome();
    }
}

function setActiveTab(tab) {
    const tabUsir = document.getElementById('tabUsir');
    const tabRiwayat = document.getElementById('tabRiwayat');
    const navUsir = document.getElementById('navUsir');
    const navRiwayat = document.getElementById('navRiwayat');

    if (!tabUsir || !tabRiwayat || !navUsir || !navRiwayat) return;

    const showUsir = tab === 'usir';
    tabUsir.style.display = showUsir ? 'block' : 'none';
    tabRiwayat.style.display = showUsir ? 'none' : 'block';

    navUsir.classList.toggle('active', showUsir);
    navRiwayat.classList.toggle('active', !showUsir);

    const welcomeHeader = document.querySelector('.welcome-header');
    if (welcomeHeader) welcomeHeader.style.display = showUsir ? 'flex' : 'none';

    if (!showUsir) {
        renderHistory();
    }
}

// Pest selection functions
function selectPest(pestType) {
    const categoryElement = event.currentTarget;
    const isCurrentlyActive = categoryElement.classList.contains('active');
    
    if (isCurrentlyActive) {
        // Cancel selection - remove active state
        categoryElement.classList.remove('active');
        currentPest = null;
        updateStatusIndicator(pestType, false);
        showNotification(`Mode ${getPestDisplayName(pestType)} dibatalkan`, 'info');
        
        // If power is on, stop the frequency
        if (isPowerOn) {
            showNotification('Alat ultrasonik dihentikan', 'warning');
        }
    } else {
        // Select new pest - remove active from others first
        document.querySelectorAll('.pest-category').forEach(category => {
            category.classList.remove('active');
        });
        
        // Add active class to selected category
        categoryElement.classList.add('active');
        
        // Update current pest
        currentPest = pestType;
        
        // Update status indicator
        updateStatusIndicator(pestType, true);
        
        // Show notification
        showNotification(`Mode ${getPestDisplayName(pestType)} dipilih`, 'success');
        
        // If power is on, apply the frequency immediately
        if (isPowerOn) {
            applyPestFrequency(pestType);
        }
    }
    
    updateDeviceStatus();
    updatePowerButtonAvailability();
    console.log(`Selected pest: ${currentPest || 'none'}`);
}

function getPestDisplayName(pestType) {
    const names = {
        mice: 'Tikus',
        birds: 'Burung'
    };
    return names[pestType] || pestType;
}

// Welcome message functions
function updateWelcomeMessage() {
    const welcomeElement = document.getElementById('welcomeMessage');
    if (welcomeElement) {
        const hour = new Date().getHours();
        const day = new Date().toLocaleDateString('id-ID', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        let greeting = 'Selamat Datang!';
        let emoji = '👋';
        
        if (hour >= 5 && hour < 12) {
            greeting = 'Selamat Pagi!';
            emoji = '🌅';
        } else if (hour >= 12 && hour < 15) {
            greeting = 'Selamat Siang!';
            emoji = '☀️';
        } else if (hour >= 15 && hour < 18) {
            greeting = 'Selamat Sore!';
            emoji = '🌇';
        } else {
            greeting = 'Selamat Malam!';
            emoji = '🌙';
        }
        
        welcomeElement.innerHTML = `${emoji} ${greeting}<br><small style="font-size: 0.7em; opacity: 0.8;">${day}</small>`;
    }
}

// Weather functions
function initializeWeather() {
    fetchGeolocationAndWeather();
    setInterval(fetchGeolocationAndWeather, 30 * 60 * 1000);
}

async function fetchGeolocationAndWeather() {
    try {
        const position = await getCurrentPosition();
        const { latitude, longitude } = position.coords;
        const place = await reverseGeocode(latitude, longitude);
        updateLocationText(place);

        const weather = await fetchOpenMeteo(latitude, longitude);
        updateWeatherDisplay(weather);
    } catch (e) {
        console.warn('Geolocation/weather failed, fallback to default');
        const fallbackWeather = { icon: 'fas fa-sun', temp: 28, desc: 'Cerah', color: '#f39c12', humidity: '60%', wind: '10 km/h' };
        updateWeatherDisplay(fallbackWeather);
    }
}

function updateWeatherDisplay(weatherData) {
    const weatherIcon = document.getElementById('weatherIcon');
    const temperature = document.getElementById('temperature');
    const weatherDescription = document.getElementById('weatherDescription');
    
    if (weatherIcon) {
        weatherIcon.className = weatherData.icon;
        weatherIcon.style.color = weatherData.color;
    }
    
    if (temperature) {
        const feels = typeof weatherData.feelsLike === 'number' ? weatherData.feelsLike : (weatherData.temp + 2);
        temperature.innerHTML = `${Math.round(weatherData.temp)}°C<br><small style="font-size: 0.6em;">Feels like ${Math.round(feels)}°C</small>`;
    }
    
    if (weatherDescription) {
        weatherDescription.innerHTML = `${weatherData.desc}<br><small style="font-size: 0.6em;">💧${weatherData.humidity} 🌬️${weatherData.wind}</small>`;
    }
}

function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 8000,
            maximumAge: 5 * 60 * 1000
        });
    });
}

async function reverseGeocode(lat, lon) {
    try {
        const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}` , {
            headers: { 'Accept-Language': 'id,en' }
        });
        const data = await resp.json();
        const { address } = data;
        const city = address.city || address.town || address.village || address.county || '';
        const state = address.state || address.region || '';
        const country = address.country || '';
        const display = [city, state || country].filter(Boolean).join(', ');
        return display || 'Lokasi tidak diketahui';
    } catch (e) {
        return 'Lokasi tidak diketahui';
    }
}

function updateLocationText(text) {
    const el = document.getElementById('locationText');
    if (el) el.textContent = text;
}

async function fetchOpenMeteo(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`;
    const resp = await fetch(url);
    const json = await resp.json();
    const cur = json.current || {};
    const temp = typeof cur.temperature_2m === 'number' ? cur.temperature_2m : 27;
    const humidity = typeof cur.relative_humidity_2m === 'number' ? `${cur.relative_humidity_2m}%` : '60%';
    const feelsLike = typeof cur.apparent_temperature === 'number' ? cur.apparent_temperature : temp;
    const wind = typeof cur.wind_speed_10m === 'number' ? `${Math.round(cur.wind_speed_10m)} km/h` : '10 km/h';
    const { icon, desc, color } = mapWeatherCodeToUi(cur.weather_code);
    return { temp, humidity, feelsLike, wind, icon, desc, color };
}

function mapWeatherCodeToUi(code) {
    // Open-Meteo WMO codes
    const map = {
        0: { icon: 'fas fa-sun', desc: 'Cerah', color: '#f39c12' },
        1: { icon: 'fas fa-cloud-sun', desc: 'Cerah Berawan', color: '#f1c40f' },
        2: { icon: 'fas fa-cloud-sun', desc: 'Berawan Sebagian', color: '#95a5a6' },
        3: { icon: 'fas fa-cloud', desc: 'Berawan', color: '#7f8c8d' },
        45: { icon: 'fas fa-smog', desc: 'Berkabut', color: '#95a5a6' },
        48: { icon: 'fas fa-smog', desc: 'Berkabut', color: '#95a5a6' },
        51: { icon: 'fas fa-cloud-rain', desc: 'Gerimis', color: '#3498db' },
        53: { icon: 'fas fa-cloud-rain', desc: 'Gerimis', color: '#3498db' },
        55: { icon: 'fas fa-cloud-rain', desc: 'Gerimis', color: '#3498db' },
        61: { icon: 'fas fa-cloud-showers-heavy', desc: 'Hujan', color: '#3498db' },
        63: { icon: 'fas fa-cloud-showers-heavy', desc: 'Hujan', color: '#3498db' },
        65: { icon: 'fas fa-cloud-showers-heavy', desc: 'Hujan Lebat', color: '#2980b9' },
        71: { icon: 'fas fa-snowflake', desc: 'Salju', color: '#5dade2' },
        73: { icon: 'fas fa-snowflake', desc: 'Salju', color: '#5dade2' },
        75: { icon: 'fas fa-snowflake', desc: 'Salju Lebat', color: '#85c1e9' },
        80: { icon: 'fas fa-cloud-sun-rain', desc: 'Hujan Lokal', color: '#8e44ad' },
        81: { icon: 'fas fa-cloud-sun-rain', desc: 'Hujan Lokal', color: '#8e44ad' },
        82: { icon: 'fas fa-cloud-sun-rain', desc: 'Hujan Lokal Lebat', color: '#8e44ad' },
        95: { icon: 'fas fa-bolt', desc: 'Badai Petir', color: '#8e44ad' },
        96: { icon: 'fas fa-bolt', desc: 'Badai Petir', color: '#8e44ad' },
        99: { icon: 'fas fa-bolt', desc: 'Badai Petir', color: '#8e44ad' }
    };
    return map[code] || { icon: 'fas fa-sun', desc: 'Cerah', color: '#f39c12' };
}

// Location time function
function updateLocationTime() {
    const locationTimeElement = document.getElementById('locationTime');
    if (locationTimeElement) {
        const now = new Date();
        const timeString = now.toLocaleTimeString('id-ID', { 
            hour: '2-digit', 
            minute: '2-digit',
            timeZone: 'Asia/Jakarta'
        });
        locationTimeElement.textContent = `${timeString} WIB`;
    }
}

function updateStatusIndicator(pestType, isActive) {
    const indicator = document.getElementById(`${pestType}-status`);
    if (indicator) {
        if (isActive) {
            indicator.classList.add('active');
        } else {
            indicator.classList.remove('active');
        }
    }
}

// Power control functions
function togglePower() {
    if (!currentPest) {
        showNotification('Pilih jenis hama terlebih dahulu', 'warning');
        updatePowerButtonAvailability();
        return;
    }
    isPowerOn = !isPowerOn;
    
    const powerBtn = document.getElementById('powerBtn');
    const powerStatus = document.getElementById('powerStatus');
    
    if (isPowerOn) {
        powerBtn.classList.add('active');
        powerStatus.textContent = 'ON';
        powerStatus.style.color = '#FF6B6B';
        sessionStartAt = Date.now();
        
        // Start timer if pest is selected
        if (currentPest) {
            applyPestFrequency(currentPest);
            startActiveTimer();
        }
        
        // Start countdown timer if timer is set
        if (selectedTimer > 0) {
            startTimerCountdown();
        }
        
        showNotification('Alat ultrasonik diaktifkan', 'success');
        sendDeviceCommand({ action: 'power', value: 'on', pest: currentPest, timerMin: selectedTimer || 0 }).catch(() => {});
    } else {
        powerBtn.classList.remove('active');
        powerStatus.textContent = 'OFF';
        powerStatus.style.color = '#666';
        
        // Stop timer and reset
        stopActiveTimer();
        resetActiveTime();
        clearTimerCountdown();
        saveHistoryEntry();
        
        showNotification('Alat ultrasonik dimatikan', 'info');
        sendDeviceCommand({ action: 'power', value: 'off' }).catch(() => {});
    }
    
    updateDeviceStatus();
    console.log(`Power: ${isPowerOn ? 'ON' : 'OFF'}`);
}


// Timer functions
function setTimer(minutes) {
    selectedTimer = parseInt(minutes);
    
    if (selectedTimer > 0) {
        showNotification(`Timer disetel untuk ${selectedTimer} menit`, 'info');
        sendDeviceCommand({ action: 'set_timer', minutes: selectedTimer }).catch(() => {});
        
        // If power is on, start countdown
        if (isPowerOn) {
            startTimerCountdown();
        }
    } else {
        showNotification('Timer dimatikan', 'info');
        clearTimerCountdown();
        sendDeviceCommand({ action: 'set_timer', minutes: 0 }).catch(() => {});
    }
    
    console.log(`Timer set to: ${selectedTimer} minutes`);
}

function startTimerCountdown() {
    clearTimerCountdown();
    
    if (selectedTimer > 0) {
        // Show countdown display
        const countdownElement = document.getElementById('timerCountdown');
        if (countdownElement) {
            countdownElement.style.display = 'block';
        }
        
        // Start countdown timer
        let remainingTime = selectedTimer * 60; // Convert to seconds
        
        // Update timer display every second
        const timerDisplay = setInterval(() => {
            remainingTime--;
            
            // Update countdown display
            const countdownText = document.getElementById('countdownText');
            if (countdownText) {
                const minutes = Math.floor(remainingTime / 60);
                const seconds = remainingTime % 60;
                countdownText.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                
                // Change color when less than 1 minute
                if (remainingTime < 60) {
                    countdownText.parentElement.style.background = 'linear-gradient(135deg, #E74C3C, #C0392B)';
                }
            }
            
            // Update timer select background
            const timerSelect = document.getElementById('timerSelect');
            if (timerSelect) {
                timerSelect.style.background = remainingTime < 60 ? '#FF6B6B' : '#4ECDC4';
                timerSelect.style.color = 'white';
                timerSelect.style.fontWeight = 'bold';
            }
            
            if (remainingTime <= 0) {
                clearInterval(timerDisplay);
                // Auto turn off after timer
                if (isPowerOn) {
                    togglePower();
                    showNotification(`Timer selesai - Alat dimatikan setelah ${selectedTimer} menit`, 'warning');
                }
                // Reset timer display
                resetTimerDisplay();
            }
        }, 1000);
        
        // Store interval ID for cleanup
        timerInterval = timerDisplay;
    }
}

function clearTimerCountdown() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    resetTimerDisplay();
}

function resetTimerDisplay() {
    const timerSelect = document.getElementById('timerSelect');
    const countdownElement = document.getElementById('timerCountdown');
    
    if (timerSelect) {
        timerSelect.style.background = 'white';
        timerSelect.style.color = '#2D5118';
        timerSelect.style.fontWeight = '500';
    }
    
    if (countdownElement) {
        countdownElement.style.display = 'none';
    }
}

// Active time tracking
function startActiveTimer() {
    if (!isPowerOn) return;
    
    setInterval(() => {
        if (isPowerOn) {
            activeTime++;
            updateActiveTimeDisplay();
        }
    }, 1000);
}

function stopActiveTimer() {
    clearTimerCountdown();
}

function resetActiveTime() {
    activeTime = 0;
    updateActiveTimeDisplay();
}

function updateActiveTimeDisplay() {
    const activeTimeElement = document.getElementById('activeTime');
    if (activeTimeElement) {
        const hours = Math.floor(activeTime / 3600);
        const minutes = Math.floor((activeTime % 3600) / 60);
        const seconds = activeTime % 60;
        
        activeTimeElement.textContent = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

// Device control functions
function applyPestFrequency(pestType) {
    if (!isPowerOn || !pestType) return;
    
    const config = pestFrequencies[pestType];
    if (config) {
        // Send command to device via REST API (ESP32 server)
        sendDeviceCommand({ action: 'apply_frequency', pest: pestType, frequency: config.freq })
            .catch(() => {});
        console.log(`Applying frequency: ${config.freq}`);
        
        // In a real implementation, this would send commands to the actual device
        // via Bluetooth, WiFi, or other communication protocol
        
        showNotification(`Frekuensi ${config.freq} diterapkan`, 'success');
    }
}

function updateDeviceStatus() {
    const deviceStatus = document.getElementById('deviceStatus');
    if (deviceStatus) {
        // Poll device status
        fetch(`${API_BASE}/api/status`).then(r=>r.json()).then(s=>{
            if (s && s.connected) {
                if (s.power && s.pest) {
                    deviceStatus.textContent = `Aktif - ${getPestDisplayName(s.pest)}`;
                    deviceStatus.style.color = '#27ae60';
                } else if (s.power) {
                    deviceStatus.textContent = 'Aktif - Tidak ada hama dipilih';
                    deviceStatus.style.color = '#f39c12';
                } else {
                    deviceStatus.textContent = 'Terhubung';
                    deviceStatus.style.color = '#3498db';
                }
            } else {
                deviceStatus.textContent = 'Tidak Terhubung';
                deviceStatus.style.color = '#e74c3c';
            }
        }).catch(()=>{
            deviceStatus.textContent = 'Tidak Terhubung';
            deviceStatus.style.color = '#e74c3c';
        });
    }
}

// Utility functions
function resetAllSelections() {
    currentPest = null;
    isPowerOn = false;
    
    // Reset UI elements
    document.querySelectorAll('.pest-category').forEach(category => {
        category.classList.remove('active');
    });
    
    // Reset only mice and birds status indicators
    const miceStatus = document.getElementById('mice-status');
    const birdsStatus = document.getElementById('birds-status');
    
    if (miceStatus) miceStatus.classList.remove('active');
    if (birdsStatus) birdsStatus.classList.remove('active');
    
    const powerBtn = document.getElementById('powerBtn');
    const powerStatus = document.getElementById('powerStatus');
    
    if (powerBtn) powerBtn.classList.remove('active');
    if (powerStatus) {
        powerStatus.textContent = 'OFF';
        powerStatus.style.color = '#666';
    }
    
    stopActiveTimer();
    resetActiveTime();
    updateDeviceStatus();
    updatePowerButtonAvailability();
    saveHistoryEntry();
}

function addTouchFeedback() {
    // Add haptic feedback for mobile devices
    document.querySelectorAll('.pest-category, .btn-primary, .btn-power').forEach(element => {
        element.addEventListener('touchstart', function() {
            // Add visual feedback
            this.style.transform = 'scale(0.95)';
        });
        
        element.addEventListener('touchend', function() {
            // Remove visual feedback
            this.style.transform = '';
        });
    });
}

function updatePowerButtonAvailability() {
    const powerBtn = document.getElementById('powerBtn');
    if (!powerBtn) return;
    const enabled = !!currentPest;
    powerBtn.disabled = !enabled;
    powerBtn.style.opacity = enabled ? '' : '0.6';
    powerBtn.style.cursor = enabled ? '' : 'not-allowed';
}

// History functions
function loadHistory() {
    try {
        const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.warn('Failed to read history');
        return [];
    }
}

function persistHistory(history) {
    try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
        console.warn('Failed to save history');
    }
}

function saveHistoryEntry() {
    // Only save if a session started and we're currently OFF
    if (sessionStartAt === null) return;
    const endAt = Date.now();
    const durationSec = Math.max(0, Math.floor((endAt - sessionStartAt) / 1000));

    // Ignore too-short accidental toggles (< 2s)
    if (durationSec < 2) {
        sessionStartAt = null;
        return;
    }

    const entry = {
        id: `${endAt}`,
        pest: currentPest,
        pestName: getPestDisplayName(currentPest || ''),
        startAt: sessionStartAt,
        endAt: endAt,
        durationSec: durationSec,
        timerMin: selectedTimer || 0
    };

    const history = loadHistory();
    history.unshift(entry);
    // Cap history length
    if (history.length > 100) history.length = 100;
    persistHistory(history);
    sessionStartAt = null;
    renderHistory();
}

function renderHistory() {
    const list = document.getElementById('historyList');
    const empty = document.getElementById('historyEmpty');
    if (!list || !empty) return;

    let history = applyHistoryFilters(loadHistory());
    list.innerHTML = '';

    if (!history.length) {
        empty.style.display = 'flex';
        return;
    }
    empty.style.display = 'none';

    history.forEach(item => {
        const li = document.createElement('li');
        li.className = 'history-item';

        const config = pestFrequencies[item.pest || ''] || { icon: 'fas fa-bullhorn' };
        const started = new Date(item.startAt);
        const ended = new Date(item.endAt);

        li.innerHTML = `
            <div class="left">
                <div class="icon">${item.pest === 'mice' ? '🐭' : `<i class="${config.icon}"></i>`}</div>
                <div class="text">
                    <div class="title">${item.pestName || 'Tanpa pilihan'}${item.timerMin ? ` • Timer ${item.timerMin}m` : ''}</div>
                    <div class="meta">${formatDateId(ended)} • ${formatTimeRangeId(started, ended)}</div>
                </div>
            </div>
            <div class="duration">${formatDuration(item.durationSec)}</div>
        `;

        list.appendChild(li);
    });
}

function onHistoryFilterChange() { renderHistory(); }

function initHistoryFilters() {
    const dateInput = document.getElementById('filterDate');
    if (!dateInput) return;
}

function applyHistoryFilters(items) {
    const dateInput = document.getElementById('filterDate');
    const pestSel = document.getElementById('filterPest');
    const dateStr = dateInput && dateInput.value ? dateInput.value : null; // YYYY-MM-DD
    const pest = pestSel ? pestSel.value : 'all';

    return items.filter(item => {
        const d = new Date(item.endAt);
        if (dateStr) {
            const [y,m,day] = dateStr.split('-').map(n=> parseInt(n));
            if (d.getFullYear() !== y || (d.getMonth()+1) !== m || d.getDate() !== day) return false;
        }
        if (pest !== 'all' && item.pest !== pest) return false;
        return true;
    }).sort((a,b)=> b.endAt - a.endAt);
}
function formatDuration(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}j ${m}m ${s}d`; // jam, menit, detik
    if (m > 0) return `${m}m ${s}d`;
    return `${s}d`;
}

function formatDateId(date) {
    return date.toLocaleDateString('id-ID', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
}

function formatTimeRangeId(startDate, endDate) {
    const start = startDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const end = endDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    return `${start} - ${end} WIB`;
}

// Notification system
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 1000;
        font-weight: 500;
        animation: slideIn 0.3s ease-out;
        max-width: 300px;
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function getNotificationColor(type) {
    const colors = {
        success: '#27ae60',
        error: '#e74c3c',
        warning: '#f39c12',
        info: '#3498db'
    };
    return colors[type] || colors.info;
}

// REST API client (ESP32 server)
const API_BASE = localStorage.getItem('desbin_api_base') || 'http://192.168.4.1'; // adjust as needed

async function sendDeviceCommand(payload) {
    try {
        const res = await fetch(`${API_BASE}/api/command`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Request failed');
        return await res.json().catch(() => ({}));
    } catch (e) {
        console.warn('sendDeviceCommand failed');
        return null;
    }
}

// ESP32 direct endpoints (optional)
// Ganti IP ini sesuai dengan IP dari ESP32 kamu
const ESP32_IP = "http://192.168.5.1";

// START alat
async function startRepellant(frequency, duration) {
    try {
        const res = await fetch(`${ESP32_IP}/start?frequency=${frequency}&duration=${duration}`);
        const data = await res.json();
        console.log("START response:", data);

        if (data.status === "success") {
            alert(`Alat aktif pada ${frequency / 1000} kHz selama ${duration} detik`);
        } else {
            alert(`Gagal: ${data.message}`);
        }
    } catch (err) {
        console.error("Gagal konek ke ESP32:", err);
        alert("Tidak bisa terhubung ke alat. Pastikan WiFi ESP32 aktif.");
    }
}

// STOP alat
async function stopRepellant() {
    try {
        const res = await fetch(`${ESP32_IP}/stop`);
        const data = await res.json();
        console.log("STOP response:", data);

        alert(data.message);
    } catch (err) {
        console.error("Gagal konek ke ESP32:", err);
        alert("Tidak bisa menghentikan alat.");
    }
}

// STATUS alat
async function getStatus() {
    try {
        const res = await fetch(`${ESP32_IP}/status`);
        const data = await res.json();
        console.log("STATUS response:", data);

        // tampilkan status di UI
        const el = document.getElementById("status");
        if (el) {
            el.innerText = `
      Status: ${data.status}
      Frekuensi: ${data.frequency / 1000} kHz
      Sisa waktu: ${data.remaining} detik
      Relay 20kHz: ${data.relay_20khz}
      Relay 40kHz: ${data.relay_40khz}
    `;
        }
    } catch (err) {
        console.error("Gagal ambil status:", err);
        alert("Tidak bisa membaca status alat.");
    }
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Error handling
window.addEventListener('error', function(e) {
    console.error('Application error:', e.error);
    showNotification('Terjadi kesalahan dalam aplikasi', 'error');
});

// Service Worker registration for PWA installability
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('sw.js')
            .then(function() { console.log('ServiceWorker registered'); })
            .catch(function() { console.log('ServiceWorker registration failed'); });
    });
}
