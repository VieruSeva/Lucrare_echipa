// Weather data simulation for Moldova cities
const weatherData = {
  chisinau: {
    spring: { temp: '15°C', conditions: 'Partly Cloudy', icon: '🌤️' },
    summer: { temp: '28°C', conditions: 'Sunny', icon: '☀️' },
    autumn: { temp: '17°C', conditions: 'Light Rain', icon: '🌦️' },
    winter: { temp: '0°C', conditions: 'Snow Flurries', icon: '❄️' }
  },
  balti: {
    spring: { temp: '14°C', conditions: 'Cloudy', icon: '☁️' },
    summer: { temp: '27°C', conditions: 'Clear', icon: '☀️' },
    autumn: { temp: '16°C', conditions: 'Foggy', icon: '🌫️' },
    winter: { temp: '-2°C', conditions: 'Snow', icon: '❄️' }
  },
  tiraspol: {
    spring: { temp: '16°C', conditions: 'Sunny', icon: '☀️' },
    summer: { temp: '29°C', conditions: 'Hot', icon: '🔥' },
    autumn: { temp: '18°C', conditions: 'Windy', icon: '💨' },
    winter: { temp: '1°C', conditions: 'Light Snow', icon: '🌨️' }
  },
  cahul: {
    spring: { temp: '17°C', conditions: 'Mild', icon: '🌤️' },
    summer: { temp: '30°C', conditions: 'Very Hot', icon: '🔥' },
    autumn: { temp: '19°C', conditions: 'Pleasant', icon: '😊' },
    winter: { temp: '2°C', conditions: 'Cold', icon: '❄️' }
  }
};

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
  citySelect.addEventListener('change', function () {
    const selectedCity = this.value;
    const cityWeather = weatherData[selectedCity][currentSeason];

    weatherResult.innerHTML = `
      <div class="weather-card">
        <h3>${selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1)}</h3>
        <div class="weather-icon">${cityWeather.icon}</div>
        <p>Temperature: ${cityWeather.temp}</p>
        <p>Conditions: ${cityWeather.conditions}</p>
        <p>Season: ${currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1)}</p>
      </div>
    `;
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