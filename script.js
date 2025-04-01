// Weather data simulation for Moldova cities
const weatherData = {
  chisinau: { lat: 47.01, lon: 28.86 },
  balti: { lat: 47.76, lon: 27.93 },
  tiraspol: { lat: 46.84, lon: 29.64 },
  cahul: { lat: 45.92, lon: 28.19 }
};

const API_KEY = '63a9e8c5334d9c0a0644cc370abc6d18'; // Replace with your actual OpenWeatherMap API key

// Get current season
function getCurrentSeason() {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
}

// Handle city selection
document.addEventListener('DOMContentLoaded', function () {
  const citySelect = document.getElementById('city-select');
  const weatherResult = document.getElementById('weather-result');
  const currentSeason = getCurrentSeason();

  // Highlight the current season
  const currentSeasonCard = document.getElementById(currentSeason);
  if (currentSeasonCard) {
    currentSeasonCard.style.transform = 'scale(1.05)';
    currentSeasonCard.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.15)';
  }

  // Display weather on city selection
  citySelect.addEventListener('change', async function () {
    const selectedCity = this.value;
    const { lat, lon } = weatherData[selectedCity];

    try {
      const weather = await fetchRealTimeWeather(lat, lon);
      displayWeather(weather, selectedCity);
    } catch (error) {
      console.error('Error fetching weather data:', error);
      weatherResult.innerHTML = '<p>Failed to load weather data. Please try again later.</p>';
    }
  });

  // Initialize with default city
  citySelect.value = 'chisinau';
  const event = new Event('change');
  citySelect.dispatchEvent(event);

  // Add hover animation to season cards
  const seasonCards = document.querySelectorAll('.season-card');
  seasonCards.forEach(card => {
    card.addEventListener('mouseover', function () {
      if (this.id !== currentSeason) {
        this.style.transform = 'translateY(-10px)';
        this.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.15)';
      } else {
        // Special hover effect for the current season card
        this.style.transform = 'scale(1.1)';
        this.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.2)';
      }
    });

    card.addEventListener('mouseout', function () {
      if (this.id !== currentSeason) {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.1)';
      } else {
        // Reset the current season card to its original scale
        this.style.transform = 'scale(1.05)';
        this.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.15)';
      }
    });
  });
});

// Fetch real-time weather data from OpenWeatherMap API
async function fetchRealTimeWeather(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const data = await response.json();
  return data;
}

// Display weather data in the UI
function displayWeather(weather, city) {
  const { temp, humidity } = weather.main;
  const { description, icon } = weather.weather[0];
  const windSpeed = weather.wind.speed;

  const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;

  document.getElementById('weather-result').innerHTML = `
    <div class="weather-card">
      <h3>${city.charAt(0).toUpperCase() + city.slice(1)}</h3>
      <img src="${iconUrl}" alt="${description}" class="weather-icon">
      <p>Temperature: ${temp}°C</p>
      <p>Conditions: ${description}</p>
      <p>Humidity: ${humidity}%</p>
      <p>Wind Speed: ${windSpeed} m/s</p>
    </div>
  `;
}