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

// Generate simple smart task recommendations based on conditions
export function generateTaskRecommendations(weatherData) {
  if (!Array.isArray(weatherData) || weatherData.length === 0) {
    return [];
  }

  const scoredWindows = weatherData.map((entry) => {
    let score = 0;

    if (entry.cardClass === 'good') score += 3;
    if (entry.cardClass === 'bad') score += 1;
    if (entry.cardClass === 'unsuitable') score -= 3;

    const temp = Number(entry.tempValue);
    if (!Number.isNaN(temp)) {
      if (temp >= 55 && temp <= 82) score += 2;
      if (temp >= 45 && temp < 55) score += 1;
      if (temp > 90 || temp < 35) score -= 2;
    }

    // Prefer daylight hours (8 AM - 6 PM)
    try {
      const hour = new Date(entry.id).getHours();
      if (hour >= 8 && hour <= 18) {
        score += 1.5;
      }
    } catch (e) {
      // Ignore invalid dates
    }

    return {
      ...entry,
      recommendationScore: score
    };
  });

  const topWindows = scoredWindows
    .filter((entry) => entry.recommendationScore > 1)
    .sort((a, b) => b.recommendationScore - a.recommendationScore)
    .slice(0, 4);

  return topWindows.map((entry) => ({
    type: 'recommendation',
    message: `Task window ${entry.time} • ${entry.condition} • ${entry.temp}`
  }));
}

// Detect notable anomalies in the forecast to alert the user
export function detectWeatherAnomalies(weatherData) {
  if (!Array.isArray(weatherData) || weatherData.length === 0) {
    return [];
  }

  const anomalies = [];

  weatherData.forEach((entry, index) => {
    const temp = Number(entry.tempValue);
    const prev = weatherData[index - 1];

    if (entry.cardClass === 'unsuitable') {
      anomalies.push({
        type: 'anomaly',
        message: `${entry.time} alert • ${entry.condition} ${entry.icon}`
      });
    }

    if (!Number.isNaN(temp) && prev && !Number.isNaN(Number(prev.tempValue))) {
      const delta = Math.abs(temp - Number(prev.tempValue));
      if (delta >= 15) {
        anomalies.push({
          type: 'anomaly',
          message: `${entry.time} swing • ~${Math.round(delta)}° jump`
        });
      }
    }

    if (entry.weatherCode >= 95) {
      anomalies.push({
        type: 'anomaly',
        message: `${entry.time} alert • Thunderstorm risk`
      });
    }

    if (temp > 95) {
      anomalies.push({
        type: 'anomaly',
        message: `${entry.time} heat • ${Math.round(temp)}°`
      });
    }

    if (temp < 32) {
      anomalies.push({
        type: 'anomaly',
        message: `${entry.time} freeze • ${Math.round(temp)}°`
      });
    }
  });

  const uniqueMessages = new Map();
  anomalies.forEach((item) => {
    if (!uniqueMessages.has(item.message)) {
      uniqueMessages.set(item.message, item);
    }
  });

  return Array.from(uniqueMessages.values()).slice(0, 6);
}

