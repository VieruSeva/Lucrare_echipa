const API_KEY = '63a9e8c5334d9c0a0644cc370abc6d18';
const CURRENT_WEATHER_URL = 'https://api.openweathermap.org/data/2.5/weather';
const FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast';
const GEOCODING_URL = 'https://api.openweathermap.org/geo/1.0/direct';

const PARTICLE_COUNT = {
    winter: 35,
    spring: 40,
    autumn: 30,
    summer: 0
};

const body = document.body;
const themeCheckbox = document.getElementById('theme-checkbox');
const cityInput = document.getElementById('city-input');
const searchButton = document.getElementById('search-button');
const suggestionsBox = document.getElementById('suggestions-box');
const geolocationButton = document.getElementById('geolocation-button');
const loadingIndicator = document.getElementById('loading-indicator');
const weatherError = document.getElementById('weather-error');
const weatherContentContainer = document.getElementById('weather-content-container');
const currentWeatherContainer = document.getElementById('current-weather-container');
const forecastContainer = document.getElementById('forecast-container');
const backgroundParticlesContainer = document.getElementById('background-particles');
const currentYearSpan = document.getElementById('current-year');

const currentCityName = document.getElementById('current-city-name');
const currentTemp = document.getElementById('current-temp');
const currentDescription = document.getElementById('current-description');
const currentFeelsLike = document.getElementById('current-feels-like');
const currentHumidity = document.getElementById('current-humidity');
const currentWindSpeed = document.getElementById('current-wind-speed');
const currentWindDirection = document.getElementById('current-wind-direction');
const currentPressure = document.getElementById('current-pressure');
const currentSunrise = document.getElementById('current-sunrise');
const currentSunset = document.getElementById('current-sunset');
const currentWeatherIcon = document.getElementById('current-weather-icon');
const forecastGrid = document.getElementById('forecast-grid');

let suggestionTimeout;
let activeSuggestionIndex = -1;

function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

function degreesToCompass(degree) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round((degree % 360) / 22.5);
    return directions[index % 16];
}

function showLoading() {
    loadingIndicator.style.display = 'flex';
    weatherError.style.display = 'none';
    weatherContentContainer.classList.remove('visible');
    suggestionsBox.style.display = 'none';
}

function hideLoading() {
    loadingIndicator.style.display = 'none';
}

function showError(message) {
    hideLoading();
    weatherError.textContent = message;
    weatherError.style.display = 'block';
    weatherContentContainer.classList.remove('visible');
}

function formatTime(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDateShort(timestamp) {
     const date = new Date(timestamp * 1000);
     return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

async function fetchSuggestions(query) {
    if (query.length < 3) {
        suggestionsBox.innerHTML = '';
        suggestionsBox.style.display = 'none';
        return;
    }
    try {
        const params = new URLSearchParams({ q: query, limit: 5, appid: API_KEY });
        const response = await fetch(`${GEOCODING_URL}?${params}`);
        if (!response.ok) {
            throw new Error(`Geocoding API error! Status: ${response.status}`);
        }
        const data = await response.json();
        displaySuggestions(data);
    } catch (error) {
        console.error("Error fetching suggestions:", error);
        suggestionsBox.innerHTML = '';
        suggestionsBox.style.display = 'none';
    }
}

const debouncedFetchSuggestions = debounce(fetchSuggestions, 350);

function displaySuggestions(suggestions) {
    if (!suggestions || suggestions.length === 0) {
        suggestionsBox.innerHTML = '';
        suggestionsBox.style.display = 'none';
        return;
    }
    suggestionsBox.innerHTML = '';
    activeSuggestionIndex = -1;
    suggestions.forEach((suggestion) => {
        const item = document.createElement('div');
        item.classList.add('suggestion-item');
        item.textContent = `${suggestion.name}${suggestion.state ? ', ' + suggestion.state : ''}, ${suggestion.country}`;
        item.dataset.city = suggestion.name;
        item.dataset.lat = suggestion.lat;
        item.dataset.lon = suggestion.lon;
        item.dataset.fulltext = item.textContent;
        item.addEventListener('click', () => {
            selectSuggestion(item);
        });
        suggestionsBox.appendChild(item);
    });
    suggestionsBox.style.display = 'block';
}

function selectSuggestion(selectedItem) {
      if (!selectedItem) return;
      const city = selectedItem.dataset.city;
      const fullText = selectedItem.dataset.fulltext;
      const lat = selectedItem.dataset.lat;
      const lon = selectedItem.dataset.lon;
      cityInput.value = fullText;
      suggestionsBox.innerHTML = '';
      suggestionsBox.style.display = 'none';
      if (lat && lon) {
          getWeatherByCoords(parseFloat(lat), parseFloat(lon));
      } else {
          getWeatherByCity(city);
      }
}

function handleSuggestionKeyDown(event) {
    const items = suggestionsBox.querySelectorAll('.suggestion-item');
    if (!items.length || suggestionsBox.style.display === 'none') return;

    if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (activeSuggestionIndex < items.length - 1) {
            activeSuggestionIndex++;
            updateSuggestionHighlight(items);
        }
    } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (activeSuggestionIndex > 0) {
            activeSuggestionIndex--;
            updateSuggestionHighlight(items);
        } else if (activeSuggestionIndex === 0) {
             activeSuggestionIndex = -1;
             updateSuggestionHighlight(items);
        }
    } else if (event.key === 'Enter') {
        event.preventDefault();
        if (activeSuggestionIndex >= 0 && activeSuggestionIndex < items.length) {
            selectSuggestion(items[activeSuggestionIndex]);
        } else {
            getWeatherByCity(cityInput.value.trim());
            suggestionsBox.style.display = 'none';
        }
    } else if (event.key === 'Escape') {
        suggestionsBox.style.display = 'none';
    }
}

function updateSuggestionHighlight(items) {
    items.forEach((item, index) => {
        item.classList.toggle('active', index === activeSuggestionIndex);
        if (index === activeSuggestionIndex) item.scrollIntoView({ block: 'nearest' });
    });
}

function getSeason(lat, date = new Date()) {
    const month = date.getMonth();
    const isNorthernHemisphere = lat >= 0;

    if (isNorthernHemisphere) {
        if (month >= 2 && month <= 4) return 'spring';
        if (month >= 5 && month <= 7) return 'summer';
        if (month >= 8 && month <= 10) return 'autumn';
        return 'winter';
    } else {
        if (month >= 2 && month <= 4) return 'autumn';
        if (month >= 5 && month <= 7) return 'winter';
        if (month >= 8 && month <= 10) return 'spring';
        return 'summer';
    }
}

function applySeasonalTheme(season) {
    body.classList.remove('season-winter', 'season-spring', 'season-summer', 'season-autumn');
    if (season) {
        body.classList.add(`season-${season}`);
    }
    createBackgroundParticles(season);
}

function createBackgroundParticles(season) {
    backgroundParticlesContainer.innerHTML = '';
    const count = PARTICLE_COUNT[season] || 0;
    if (count === 0) return;

    let particleClass = '';
    let animationBaseName = 'fall';

    if (season === 'spring') {
        particleClass = 'petal';
        animationBaseName = 'fall-sway';
    } else if (season === 'winter') {
        particleClass = 'snowflake';
        animationBaseName = 'fall';
    } else if (season === 'autumn') {
        particleClass = 'leaf';
        animationBaseName = 'fall-rotate';
    } else {
        return;
    }

    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle', particleClass);
        particle.style.left = `${Math.random() * 100}%`;
        const duration = Math.random() * (season === 'spring' ? 7 : 6) + (season === 'spring' ? 7 : 6);
        const delay = Math.random() * (season === 'spring' ? 9 : 7);
        particle.style.animation = `${animationBaseName} ${duration}s linear ${delay}s infinite`;
        particle.style.opacity = 0;

        let scale = Math.random() * 0.5 + 0.7;
        if (season === 'spring') {
            scale = Math.random() * 0.6 + 0.6;
        }
        let initialRotation = '';
        if (particleClass === 'leaf') initialRotation = `rotate(${Math.random() * 70 - 35}deg)`;
        else if (particleClass === 'petal') initialRotation = `rotate(${Math.random() * 50 - 25}deg)`;

        particle.style.transform = `scale(${scale}) ${initialRotation}`;
        backgroundParticlesContainer.appendChild(particle);
    }
}

async function fetchWeatherData(url, params) {
    const query = new URLSearchParams({ ...params, appid: API_KEY, units: 'metric' });
    const response = await fetch(`${url}?${query}`);
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
    }
    return response.json();
}

async function fetchAndDisplayWeather(fetchPromise) {
    showLoading();
    try {
        const currentWeatherData = await fetchPromise;
        displayCurrentWeather(currentWeatherData);

        const { lat, lon } = currentWeatherData.coord;
        const forecastData = await fetchWeatherData(FORECAST_URL, { lat, lon });
        displayForecast(forecastData);

        const season = getSeason(lat);
        applySeasonalTheme(season);

        hideLoading();
        currentWeatherContainer.style.display = 'block';
        forecastContainer.style.display = 'block';
        requestAnimationFrame(() => {
            weatherContentContainer.classList.add('visible');
        });
        weatherError.style.display = 'none';

    } catch (error) {
        console.error('Error fetching weather data:', error);
        showError(`Could not fetch weather. Reason: ${error.message}`);
        applySeasonalTheme(null);
    }
}

function getWeatherByCity(city) {
    if (!city) {
        showError("Please enter a city name.");
        return;
    }
    fetchAndDisplayWeather(fetchWeatherData(CURRENT_WEATHER_URL, { q: city }));
}

function getWeatherByCoords(lat, lon) {
    fetchAndDisplayWeather(fetchWeatherData(CURRENT_WEATHER_URL, { lat, lon }));
}

function displayCurrentWeather(data) {
     if (!data || !data.main || !data.weather || !data.sys) {
        showError("Received incomplete weather data.");
        return;
     }
     currentCityName.textContent = data.name || 'Unknown Location';
     currentTemp.textContent = Math.round(data.main.temp);
     currentDescription.textContent = data.weather[0]?.description || 'N/A';
     currentFeelsLike.textContent = Math.round(data.main.feels_like);
     currentHumidity.textContent = data.main.humidity;
     currentWindSpeed.textContent = data.wind?.speed?.toFixed(1) || 'N/A';
     currentWindDirection.textContent = data.wind?.deg !== undefined ? `(${degreesToCompass(data.wind.deg)})` : '(N/A)';
     currentPressure.textContent = data.main.pressure;
     currentSunrise.textContent = data.sys?.sunrise ? formatTime(data.sys.sunrise) : 'N/A';
     currentSunset.textContent = data.sys?.sunset ? formatTime(data.sys.sunset) : 'N/A';
     currentWeatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0]?.icon}@4x.png`;
     currentWeatherIcon.alt = data.weather[0]?.description || 'Weather icon';

     currentWeatherIcon.classList.remove('weather-icon-main');
     void currentWeatherIcon.offsetWidth;
     currentWeatherIcon.classList.add('weather-icon-main');
}

function displayForecast(data) {
    if (!data || !data.list) {
        forecastContainer.style.display = 'none';
        return;
    }
    forecastGrid.innerHTML = '';
    const dailyForecasts = {};

    data.list.forEach(item => {
        const dateStr = new Date(item.dt * 1000).toISOString().split('T')[0];
        if (!dailyForecasts[dateStr]) {
            dailyForecasts[dateStr] = {
                minTemp: item.main.temp,
                maxTemp: item.main.temp,
                descriptions: {},
                icons: {},
                timestamp: item.dt
            };
        } else {
            dailyForecasts[dateStr].minTemp = Math.min(dailyForecasts[dateStr].minTemp, item.main.temp);
            dailyForecasts[dateStr].maxTemp = Math.max(dailyForecasts[dateStr].maxTemp, item.main.temp);
        }
        const desc = item.weather[0]?.description || 'N/A';
        const icon = item.weather[0]?.icon || '01d';
        dailyForecasts[dateStr].descriptions[desc] = (dailyForecasts[dateStr].descriptions[desc] || 0) + 1;
        dailyForecasts[dateStr].icons[icon] = (dailyForecasts[dateStr].icons[icon] || 0) + 1;
    });

    Object.values(dailyForecasts).forEach(dayData => {
        dayData.mostCommonDesc = Object.keys(dayData.descriptions).reduce((a, b) => dayData.descriptions[a] > dayData.descriptions[b] ? a : b);
        dayData.mostCommonIcon = Object.keys(dayData.icons).reduce((a, b) => dayData.icons[a] > dayData.icons[b] ? a : b);
    });

    const forecastDays = Object.values(dailyForecasts);
    const todayStr = new Date().toISOString().split('T')[0];
    let daysDisplayed = 0;

    for (const dayData of forecastDays) {
        const dayStr = new Date(dayData.timestamp * 1000).toISOString().split('T')[0];
        if (dayStr === todayStr) continue;
        if (daysDisplayed >= 5) break;

        const card = document.createElement('div');
        card.classList.add('forecast-card');
        card.innerHTML = `
            <p class="forecast-date">${formatDateShort(dayData.timestamp)}</p>
            <img src="https://openweathermap.org/img/wn/${dayData.mostCommonIcon}@2x.png" alt="${dayData.mostCommonDesc}">
            <p class="forecast-temp">${Math.round(dayData.maxTemp)}°<span style="opacity:0.7"> / ${Math.round(dayData.minTemp)}°</span></p>
            <p class="forecast-desc">${dayData.mostCommonDesc}</p>
        `;
        forecastGrid.appendChild(card);
        daysDisplayed++;
    }
     forecastContainer.style.display = forecastGrid.children.length > 0 ? 'block' : 'none';
}

function handleGeolocation() {
     if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                getWeatherByCoords(position.coords.latitude, position.coords.longitude);
            },
            (error) => {
                console.error("Geolocation error:", error);
                let message = "Could not get location.";
                if (error.code === error.PERMISSION_DENIED) message = "Geolocation permission denied.";
                else if (error.code === error.POSITION_UNAVAILABLE) message = "Location info unavailable.";
                else if (error.code === error.TIMEOUT) message = "Location request timed out.";
                showError(message);
                applySeasonalTheme(null);
            },
            { timeout: 10000 }
        );
    } else {
        showError("Geolocation is not supported.");
        applySeasonalTheme(null);
    }
}

function applyTheme(theme) {
    const lightModeMeta = document.querySelector('meta[name="theme-color"][media="(prefers-color-scheme: light)"]');
    const darkModeMeta = document.querySelector('meta[name="theme-color"][media="(prefers-color-scheme: dark)"]');
    const lightColor = '#e0eaff';
    const darkColor = '#1a202c';

    if (theme === 'light') {
        body.classList.add('light-mode');
        if (themeCheckbox) themeCheckbox.checked = true;
        if (lightModeMeta) lightModeMeta.setAttribute('content', lightColor);
        if (darkModeMeta) darkModeMeta.setAttribute('content', lightColor); // Ensure consistency on toggle
    } else {
        body.classList.remove('light-mode');
        if (themeCheckbox) themeCheckbox.checked = false;
        if (lightModeMeta) lightModeMeta.setAttribute('content', darkColor); // Ensure consistency on toggle
        if (darkModeMeta) darkModeMeta.setAttribute('content', darkColor);
    }
}

function toggleTheme() {
    const currentTheme = body.classList.contains('light-mode') ? 'dark' : 'light';
    applyTheme(currentTheme);
    localStorage.setItem('weatherAppTheme', currentTheme);
}

cityInput.addEventListener('input', () => {
    debouncedFetchSuggestions(cityInput.value.trim());
});
cityInput.addEventListener('keydown', handleSuggestionKeyDown);

document.addEventListener('click', (event) => {
    if (!suggestionsBox.contains(event.target) && event.target !== cityInput) {
        suggestionsBox.style.display = 'none';
    }
});

searchButton.addEventListener('click', () => {
    getWeatherByCity(cityInput.value.trim());
    suggestionsBox.style.display = 'none';
});

geolocationButton.addEventListener('click', handleGeolocation);

if (themeCheckbox) {
    themeCheckbox.addEventListener('change', toggleTheme);
}

document.addEventListener('DOMContentLoaded', () => {
    if(currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    const savedTheme = localStorage.getItem('weatherAppTheme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme) {
        applyTheme(savedTheme);
    } else if (prefersDark) {
        applyTheme('dark');
    } else {
        applyTheme('light');
    }

    setTimeout(() => {
        body.classList.remove('preload');
    }, 100);

    // Default weather load (Chișinău: 47.01, 28.86)
    getWeatherByCoords(47.01, 28.86);
});