// Utility function to determine weather type for background
export function getWeatherType(weatherCode, temperature) {
  // Thunderstorm
  if (weatherCode >= 95) {
    return 'thunderstorm';
  }
  // Extreme Temperature
  if (temperature > 95) {
    return 'hot';
  }
  if (temperature < 32) {
    return 'cold';
  }
  // Rain
  if ((weatherCode >= 51 && weatherCode <= 67) || weatherCode >= 80) {
    return 'rain';
  }
  // Snow
  if (weatherCode >= 71 && weatherCode <= 77) {
    return 'snow';
  }
  // Clear sky
  if (weatherCode === 0) {
    return 'clear';
  }
  // Cloudy
  if (weatherCode >= 1 && weatherCode <= 3) {
    return 'cloudy';
  }
  // Default
  return 'default';
}

// Get current weather based on current hour
export function getCurrentWeather(weatherData) {
  if (!weatherData || weatherData.length === 0) {
    return null;
  }
  
  const now = new Date();
  const currentHour = now.getHours();
  
  // Find the weather data closest to current hour
  let closestWeather = weatherData[0];
  let minDiff = Infinity;
  
  weatherData.forEach(weather => {
    try {
      const weatherDate = new Date(weather.id);
      const diff = Math.abs(weatherDate.getHours() - currentHour);
      if (diff < minDiff) {
        minDiff = diff;
        closestWeather = weather;
      }
    } catch (e) {
      // Skip invalid dates
    }
  });
  
  return closestWeather;
}

