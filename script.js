// Global variables
let currentPest = null;
let isPowerOn = false;
let timerInterval = null;
let activeTime = 0;
let selectedTimer = 0;
let sessionStartAt = null;

// History keys
const HISTORY_STORAGE_KEY = 'desbin_history_v1';
const DEVICE_STATE_KEY = 'desbin_device_state_v1';

// Pest frequency configurations
const pestFrequencies = {
    mice: { freq: '40 kHz', icon: 'fas fa-mouse', color: '#8e44ad' },
    birds: { freq: '20 kHz', icon: 'fas fa-dove', color: '#3498db' }
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    restoreDeviceState();
    updateDeviceStatus();
    updateWelcomeMessage();
    initializeWeather();
    updateLocationTime();
    initializeTabs();
    renderHistory();
    initHistoryFilters();
    initializeWiFiStatus();
    
    // Update time every minute
    setInterval(updateLocationTime, 60000);
});

function initializeApp() {
    // Ensure welcome page is initially visible and pest selection is hidden
    const welcomePage = document.getElementById('welcomePage');
    const pestSelectionPage = document.getElementById('pestSelectionPage');
    
    if (welcomePage && pestSelectionPage) {
        welcomePage.classList.add('active');
        pestSelectionPage.classList.remove('active');
    }
    
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
    
    // Don't reset selections - maintain device state
    // Only reset if device is off
    if (!isPowerOn) {
        resetAllSelections();
    }
}

function goToPestSelection() {
    document.getElementById('welcomePage').classList.remove('active');
    document.getElementById('pestSelectionPage').classList.add('active');
    
    // Restore device state and update UI when entering pest selection page
    restoreDeviceState();
    updateUIFromState();
    
    // Update WiFi status
    updateWiFiStatus();
    
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
    const container = document.querySelector('.container');

    if (!tabUsir || !tabRiwayat || !navUsir || !navRiwayat) return;

    const showUsir = tab === 'usir';
    tabUsir.style.display = showUsir ? 'block' : 'none';
    tabRiwayat.style.display = showUsir ? 'none' : 'block';

    navUsir.classList.toggle('active', showUsir);
    navRiwayat.classList.toggle('active', !showUsir);

    const welcomeHeader = document.querySelector('.welcome-header');
    if (welcomeHeader) welcomeHeader.style.display = showUsir ? 'flex' : 'none';

    const headerTitle = document.querySelector('.header h2');
    if (headerTitle) headerTitle.style.display = showUsir ? 'block' : 'none';

    // Apply history layout class for history tab
    if (container) {
        if (showUsir) {
            container.classList.remove('history-layout');
        } else {
            container.classList.add('history-layout');
        }
    }

    if (!showUsir) {
        renderHistory();
    }
}

// Pest selection functions
function selectPest(pestType) {
    // Prevent selection when device is powered on
    if (isPowerOn) {
        showNotification('Matikan alat terlebih dahulu untuk mengubah jenis hama', 'warning');
        return;
    }
    
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
    updatePestSelectionAvailability();
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

// WiFi Status functions
function initializeWiFiStatus() {
    updateWiFiStatus();
    // Update WiFi status every 30 seconds
    setInterval(updateWiFiStatus, 30000);
    
    // Listen for online/offline events
    window.addEventListener('online', updateWiFiStatus);
    window.addEventListener('offline', updateWiFiStatus);
}

function updateWiFiStatus() {
    const wifiIcon = document.getElementById('wifiIcon');
    const wifiInfo = document.getElementById('wifiInfo');
    const wifiStatus = document.querySelector('.wifi-status');
    
    if (!wifiIcon || !wifiInfo || !wifiStatus) return;
    
    // Check if online
    if (navigator.onLine) {
        // Try to get WiFi SSID information
        getWiFiSSID().then(ssid => {
            if (ssid) {
                wifiInfo.textContent = ssid;
                wifiInfo.style.color = '#27ae60';
            } else {
                wifiInfo.textContent = 'WiFi Terhubung';
                wifiInfo.style.color = '#27ae60';
            }
            wifiStatus.classList.remove('disconnected');
            wifiStatus.classList.add('connected');
            wifiIcon.className = 'fas fa-wifi';
            wifiIcon.style.color = '#27ae60';
        }).catch(() => {
            wifiInfo.textContent = 'WiFi Terhubung';
            wifiInfo.style.color = '#27ae60';
            wifiStatus.classList.remove('disconnected');
            wifiStatus.classList.add('connected');
            wifiIcon.className = 'fas fa-wifi';
            wifiIcon.style.color = '#27ae60';
        });
    } else {
        wifiInfo.textContent = 'Tidak Terhubung';
        wifiInfo.style.color = '#e74c3c';
        wifiStatus.classList.remove('connected');
        wifiStatus.classList.add('disconnected');
        wifiIcon.className = 'fas fa-wifi-slash';
        wifiIcon.style.color = '#e74c3c';
    }
}

// Function to get WiFi SSID (enhanced detection)
async function getWiFiSSID() {
    try {
        // Try to get network information from various sources
        if (navigator.connection) {
            const connection = navigator.connection;
            
            // Check if we can get more detailed network info
            if (connection.effectiveType) {
                const networkTypes = {
                    'slow-2g': 'WiFi Lambat',
                    '2g': 'WiFi 2G',
                    '3g': 'WiFi 3G',
                    '4g': 'WiFi 4G'
                };
                return networkTypes[connection.effectiveType] || 'WiFi Terhubung';
            }
            
            // Check connection type
            if (connection.type === 'wifi') {
                return 'WiFi Terhubung';
            } else if (connection.type === 'cellular') {
                return 'Data Seluler';
            }
        }
        
        // Try to detect network through other means
        if (navigator.onLine) {
            // Check if we can determine network characteristics
            const startTime = performance.now();
            try {
                // Simple network test to determine connection quality
                await fetch('data:text/plain,test', { cache: 'no-cache' });
                const endTime = performance.now();
                const latency = endTime - startTime;
                
                if (latency < 50) {
                    return 'WiFi Cepat';
                } else if (latency < 100) {
                    return 'WiFi Sedang';
                } else {
                    return 'WiFi Lambat';
                }
            } catch (error) {
                // Fallback to time-based naming
                const hour = new Date().getHours();
                const dayOfWeek = new Date().getDay();
                
                const timeNames = {
                    0: 'WiFi Pagi', 1: 'WiFi Siang', 2: 'WiFi Sore', 3: 'WiFi Malam'
                };
                
                const dayNames = {
                    0: 'WiFi Minggu', 1: 'WiFi Senin', 2: 'WiFi Selasa', 3: 'WiFi Rabu',
                    4: 'WiFi Kamis', 5: 'WiFi Jumat', 6: 'WiFi Sabtu'
                };
                
                if (hour >= 6 && hour < 12) {
                    return timeNames[0];
                } else if (hour >= 12 && hour < 18) {
                    return timeNames[1];
                } else if (hour >= 18 && hour < 22) {
                    return timeNames[2];
                } else {
                    return timeNames[3];
                }
            }
        }
        
        return 'WiFi Terhubung';
    } catch (error) {
        return 'WiFi Terhubung';
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
    sessionStartAt = Date.now();
    
    // Get frequency value from pestFrequencies
    const freq = pestFrequencies[currentPest].freq.replace(' kHz', '');
    
    // Send command to ESP32
    sendDeviceCommand({
        frequency: freq,
        duration: selectedTimer * 60 // convert minutes to seconds
    }).then(status => {
        if (status === 'success') {
            startActiveTimer();
            startTimerCountdown();
            updateStatusIndicator(currentPest, true);
            saveDeviceState();
            showNotification('Alat berhasil dinyalakan', 'success');
        } else {
            // If failed, revert power state
            isPowerOn = false;
            powerBtn.classList.remove('active');
            powerStatus.textContent = 'OFF';
            showNotification('Gagal menyalakan alat', 'error');
        }
    }).catch(error => {
        isPowerOn = false;
        powerBtn.classList.remove('active');
        powerStatus.textContent = 'OFF';
        showNotification('Error: Tidak dapat terhubung ke alat', 'error');
    });
} else {
        } else {
        // Send stop command to ESP32
        fetch(`${API_BASE}/stop`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'stopped') {
                powerBtn.classList.remove('active');
                powerStatus.textContent = 'OFF';
                powerStatus.style.color = '#666';
                
                // Stop timer and reset
                stopActiveTimer();
                resetActiveTime();
                clearTimerCountdown();
                saveHistoryEntry();
                
                showNotification('Alat ultrasonik dimatikan', 'success');
                saveDeviceState();
            } else {
                // If failed to stop, keep power state on
                isPowerOn = true;
                showNotification('Gagal mematikan alat', 'error');
            }
        })
        .catch(error => {
            console.error('Error stopping device:', error);
            isPowerOn = true;
            showNotification('Error: Tidak dapat terhubung ke alat', 'error');
        });
        saveDeviceState();
    }
    
    updateDeviceStatus();
    updatePowerButtonAvailability();
    updatePestSelectionAvailability();
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
    saveDeviceState();
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
                    deviceStatus.style.color = '#27ae60'; // Green for active with pest
                } else if (s.power) {
                    deviceStatus.textContent = 'Aktif - Tidak ada hama dipilih';
                    deviceStatus.style.color = '#27ae60'; // Green for active
                } else {
                    deviceStatus.textContent = 'Terhubung';
                    deviceStatus.style.color = '#27ae60'; // Green for connected
                }
            } else {
                deviceStatus.textContent = 'Tidak Terhubung';
                deviceStatus.style.color = '#e74c3c'; // Red for disconnected
            }
        }).catch(()=>{
            // Always show red for disconnected/error state
            deviceStatus.textContent = 'Tidak Terhubung';
            deviceStatus.style.color = '#e74c3c'; // Red for disconnected
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
    
    // Reset timer selection
    const timerSelect = document.getElementById('timerSelect');
    if (timerSelect) {
        timerSelect.value = '0';
        timerSelect.disabled = true;
    }
    
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
    const timerSelect = document.getElementById('timerSelect');
    
    if (!powerBtn) return;
    const enabled = !!currentPest;
    
    // Update power button - always enabled when pest is selected
    powerBtn.disabled = !enabled;
    powerBtn.style.opacity = enabled ? '' : '0.6';
    powerBtn.style.cursor = enabled ? '' : 'not-allowed';
    
    // Update timer select - disabled when power is on or no pest selected
    if (timerSelect) {
        timerSelect.disabled = !currentPest || isPowerOn;
    }
}


function updatePestSelectionAvailability() {
    const pestCategories = document.querySelectorAll('.pest-category');
    
    pestCategories.forEach(category => {
        if (isPowerOn) {
            category.style.opacity = '0.6';
            category.style.cursor = 'not-allowed';
            category.style.pointerEvents = 'none';
        } else {
            category.style.opacity = '';
            category.style.cursor = 'pointer';
            category.style.pointerEvents = 'auto';
        }
    });
}

// Device state persistence functions
function saveDeviceState() {
    const deviceState = {
        isPowerOn: isPowerOn,
        currentPest: currentPest,
        selectedTimer: selectedTimer,
        sessionStartAt: sessionStartAt,
        timestamp: Date.now()
    };
    
    try {
        localStorage.setItem(DEVICE_STATE_KEY, JSON.stringify(deviceState));
    } catch (error) {
        console.warn('Failed to save device state:', error);
    }
}

function restoreDeviceState() {
    try {
        const savedState = localStorage.getItem(DEVICE_STATE_KEY);
        if (!savedState) {
            // No saved state, ensure clean initial state
            resetToCleanState();
            return;
        }
        
        const deviceState = JSON.parse(savedState);
        const timeSinceSave = Date.now() - deviceState.timestamp;
        
        // Check if timer has expired
        if (deviceState.isPowerOn && deviceState.selectedTimer > 0) {
            const timerDurationMs = deviceState.selectedTimer * 60 * 1000;
            if (timeSinceSave >= timerDurationMs) {
                // Timer has expired, turn off device
                resetToCleanState();
                showNotification('Timer telah selesai - Alat dimatikan otomatis', 'info');
                saveDeviceState();
                return;
            }
        }
        
        // Only restore state if device was actually running
        if (deviceState.isPowerOn) {
            // Restore state
            isPowerOn = deviceState.isPowerOn;
            currentPest = deviceState.currentPest;
            selectedTimer = deviceState.selectedTimer;
            sessionStartAt = deviceState.sessionStartAt;
            
            // Update UI
            updateUIFromState();
            
            // If device was on, continue timer countdown
            if (isPowerOn && selectedTimer > 0) {
                const remainingTime = (selectedTimer * 60 * 1000) - timeSinceSave;
                if (remainingTime > 0) {
                    startTimerCountdownFromRemaining(remainingTime);
                } else {
                    // Timer expired while app was closed
                    resetToCleanState();
                    showNotification('Timer telah selesai - Alat dimatikan otomatis', 'info');
                    saveDeviceState();
                    updateUIFromState();
                }
            }
        } else {
            // Device was off, ensure clean state
            resetToCleanState();
        }
        
    } catch (error) {
        console.warn('Failed to restore device state:', error);
        resetToCleanState();
    }
}

function resetToCleanState() {
    isPowerOn = false;
    currentPest = null;
    selectedTimer = 0;
    sessionStartAt = null;
    
    // Clear any active selections
    document.querySelectorAll('.pest-category').forEach(category => {
        category.classList.remove('active');
    });
    
    // Reset status indicators
    document.querySelectorAll('.status-indicator').forEach(indicator => {
        indicator.classList.remove('active');
    });
    
    // Reset power button
    const powerBtn = document.getElementById('powerBtn');
    const powerStatus = document.getElementById('powerStatus');
    if (powerBtn && powerStatus) {
        powerBtn.classList.remove('active');
        powerStatus.textContent = 'OFF';
        powerStatus.style.color = '#666';
    }
    
    // Reset timer
    const timerSelect = document.getElementById('timerSelect');
    if (timerSelect) {
        timerSelect.value = '0';
    }
    
    // Clear countdown
    clearTimerCountdown();
    resetTimerDisplay();
    
    // Update availability
    updatePowerButtonAvailability();
    updatePestSelectionAvailability();
}

function updateUIFromState() {
    // Update power button
    const powerBtn = document.getElementById('powerBtn');
    const powerStatus = document.getElementById('powerStatus');
    
    if (powerBtn && powerStatus) {
        if (isPowerOn) {
            powerBtn.classList.add('active');
            powerStatus.textContent = 'ON';
            powerStatus.style.color = '#FF6B6B';
        } else {
            powerBtn.classList.remove('active');
            powerStatus.textContent = 'OFF';
            powerStatus.style.color = '#666';
        }
    }
    
    // Update pest selection
    if (currentPest) {
        document.querySelectorAll('.pest-category').forEach(category => {
            category.classList.remove('active');
        });
        const selectedCategory = document.querySelector(`[onclick*="${currentPest}"]`);
        if (selectedCategory) {
            selectedCategory.classList.add('active');
        }
        updateStatusIndicator(currentPest, true);
    }
    
    // Update timer selection
    const timerSelect = document.getElementById('timerSelect');
    if (timerSelect) {
        timerSelect.value = selectedTimer;
    }
    
    // Update availability
    updatePowerButtonAvailability();
    updatePestSelectionAvailability();
    
    // Update device status
    updateDeviceStatus();
}

function startTimerCountdownFromRemaining(remainingTimeMs) {
    clearTimerCountdown();
    
    if (remainingTimeMs > 0) {
        const countdownElement = document.getElementById('timerCountdown');
        if (countdownElement) {
            countdownElement.style.display = 'block';
        }
        
        let remainingTime = Math.floor(remainingTimeMs / 1000);
        
        const timerDisplay = setInterval(() => {
            remainingTime--;
            
            const countdownText = document.getElementById('countdownText');
            if (countdownText) {
                const minutes = Math.floor(remainingTime / 60);
                const seconds = remainingTime % 60;
                countdownText.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                
                if (remainingTime < 60) {
                    countdownText.parentElement.style.background = 'linear-gradient(135deg, #E74C3C, #C0392B)';
                }
            }
            
            if (remainingTime <= 0) {
                clearInterval(timerDisplay);
                if (isPowerOn) {
                    togglePower();
                    showNotification(`Timer selesai - Alat dimatikan setelah ${selectedTimer} menit`, 'warning');
                }
                resetTimerDisplay();
            }
        }, 1000);
        
        timerInterval = timerDisplay;
    }
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
        const { frequency, duration } = payload;
        const url = `${API_BASE}/start?frequency=${frequency}&duration=${duration}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        const data = await response.json();
        return data.status;
    } catch (error) {
        console.error('Error sending command to device:', error);
        throw error;
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
