document.addEventListener('DOMContentLoaded', function () {
  // DOM Elements
  const cityInput = document.getElementById('city-input');
  const searchBtn = document.getElementById('search-btn');
  const locationBtn = document.getElementById('location-btn');
  const currentCity = document.getElementById('current-city');
  const currentTemp = document.getElementById('current-temp');
  const weatherDesc = document.getElementById('weather-desc');
  const feelsLike = document.getElementById('feels-like');
  const windSpeed = document.getElementById('wind-speed');
  const humidity = document.getElementById('humidity');
  const pressure = document.getElementById('pressure');
  const visibility = document.getElementById('visibility');
  const forecastContainer = document.getElementById('forecast-container');
  const currentWeatherSection = document.getElementById('current-weather');
  const forecastSection = document.getElementById('forecast');
  const errorMessage = document.getElementById('error-message');
  const loadingIndicator = document.getElementById('loading');

  // API Configuration
  const API_KEY = '17e254e0ec50be7494db36b43a60ddbf';
  const DEFAULT_CITY = 'London';

  // Initialize app
  initWeatherApp();

  function initWeatherApp() {
    hideWeatherSections();
    fetchWeather(DEFAULT_CITY);
    setupEventListeners();
  }

  function setupEventListeners() {
    searchBtn.addEventListener('click', handleSearch);
    cityInput.addEventListener('keypress', handleKeyPress);
    locationBtn.addEventListener('click', getLocationWeather);
  }

  function handleSearch() {
    const city = cityInput.value.trim();
    if (city) {
      fetchWeather(city);
    } else {
      showError('Please enter a city name');
    }
  }

  function handleKeyPress(e) {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }

  async function fetchWeather(city) {
    try {
      showLoading();
      hideError();
      
      const currentData = await fetchCurrentWeather(city);
      if (currentData.cod === '404') {
        showError('City not found. Please try another city.');
        hideWeatherSections();
        return;
      }
      
      updateCurrentWeather(currentData);
      const forecastData = await fetchWeatherForecast(city);
      updateForecast(forecastData);
      
      showWeatherSections();
    } catch (err) {
      console.error('Weather fetch error:', err);
      showError('Failed to fetch weather data. Please try again later.');
      hideWeatherSections();
    } finally {
      hideLoading();
    }
  }

  async function fetchCurrentWeather(city) {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`
    );
    return await response.json();
  }

  async function fetchWeatherForecast(city) {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${API_KEY}`
    );
    return await response.json();
  }

  function updateCurrentWeather(data) {
    const date = new Date(data.dt * 1000).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    currentCity.innerHTML = `<i class="fas fa-city"></i> ${data.name}, ${data.sys.country} (${date})`;
    currentTemp.textContent = `${data.main.temp.toFixed(1)}°C`;
    weatherDesc.textContent = capitalize(data.weather[0].description);
    feelsLike.textContent = `${data.main.feels_like.toFixed(1)}°C`;
    windSpeed.textContent = `${data.wind.speed.toFixed(1)} m/s`;
    humidity.textContent = `${data.main.humidity}%`;
    pressure.textContent = `${data.main.pressure} hPa`;
    visibility.textContent = `${(data.visibility / 1000).toFixed(1)} km`;
  }

  function updateForecast(data) {
    forecastContainer.innerHTML = '';
    const dailyForecasts = data.list.filter(item => item.dt_txt.includes('12:00:00')).slice(0, 5);

    dailyForecasts.forEach(day => {
      const date = new Date(day.dt * 1000).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
      
      const weatherIcon = getWeatherIcon(day.weather[0].main, day.weather[0].description);
      
      const forecastItem = document.createElement('div');
      forecastItem.className = 'forecast-item';
      forecastItem.innerHTML = `
        <div class="forecast-date">${date}</div>
        <div class="forecast-icon">${weatherIcon}</div>
        <div class="forecast-temp">${day.main.temp.toFixed(1)}°C</div>
        <div class="forecast-desc">${capitalize(day.weather[0].description)}</div>
        <div class="forecast-wind"><i class="fas fa-wind"></i> ${day.wind.speed.toFixed(1)} m/s</div>
        <div class="forecast-humidity"><i class="fas fa-tint"></i> ${day.main.humidity}%</div>
      `;
      forecastContainer.appendChild(forecastItem);
    });
  }

  function getWeatherIcon(main, description) {
    const hour = new Date().getHours();
    const isDayTime = hour > 6 && hour < 20;
    
    const icons = {
      Clear: isDayTime ? 'fa-sun' : 'fa-moon',
      Clouds: description.includes('few') ? (isDayTime ? 'fa-cloud-sun' : 'fa-cloud-moon') : 'fa-cloud',
      Rain: 'fa-cloud-rain',
      Drizzle: 'fa-cloud-rain',
      Thunderstorm: 'fa-bolt',
      Snow: 'fa-snowflake',
      Mist: 'fa-smog',
      Fog: 'fa-smog',
      Haze: 'fa-smog'
    };

    const colors = {
      'fa-sun': '#f39c12',
      'fa-moon': '#34495e',
      'fa-cloud-sun': '#7f8c8d',
      'fa-cloud-moon': '#7f8c8d',
      'fa-cloud': '#7f8c8d',
      'fa-cloud-rain': '#3498db',
      'fa-bolt': '#f1c40f',
      'fa-snowflake': '#ecf0f1',
      'fa-smog': '#bdc3c7'
    };

    const iconClass = icons[main] || 'fa-cloud';
    const iconColor = colors[iconClass] || '#7f8c8d';
    
    return `<i class="fas ${iconClass}" style="color: ${iconColor};"></i>`;
  }

  function getLocationWeather() {
    if (!navigator.geolocation) {
      showError('Geolocation not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          showLoading();
          hideError();
          
          const currentData = await fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
          updateCurrentWeather(currentData);

          const forecastData = await fetchForecastByCoords(pos.coords.latitude, pos.coords.longitude);
          updateForecast(forecastData);

          cityInput.value = currentData.name;
          showWeatherSections();
        } catch (err) {
          console.error('Geolocation weather error:', err);
          showError('Unable to fetch weather for your location.');
          hideWeatherSections();
        } finally {
          hideLoading();
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        showError('Location access denied. Please enable location services.');
      }
    );
  }

  async function fetchWeatherByCoords(lat, lon) {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
    );
    return await response.json();
  }

  async function fetchForecastByCoords(lat, lon) {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
    );
    return await response.json();
  }

  // Utility Functions
  function capitalize(text) {
    return text.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  function showLoading() {
    loadingIndicator.style.display = 'flex';
    hideWeatherSections();
  }

  function hideLoading() {
    loadingIndicator.style.display = 'none';
  }

  function showWeatherSections() {
    currentWeatherSection.style.display = 'block';
    forecastSection.style.display = 'block';
  }

  function hideWeatherSections() {
    currentWeatherSection.style.display = 'none';
    forecastSection.style.display = 'none';
  }

  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
  }

  function hideError() {
    errorMessage.style.display = 'none';
  }
});