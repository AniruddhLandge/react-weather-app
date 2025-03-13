
import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [city, setCity] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const API_KEY = '1e3e8f230b6064d27976e41163a82b77';
  const WEATHERBIT_KEY = 'ef3fb294ce24463181e52861c92fa969'; 

  const getLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          await fetchWeatherByCoords(latitude, longitude);
          setLoading(false);
        },
        (err) => {
          setError('Geolocation denied. Please enter a city manually.');
          setLoading(false);
        }
      );
    }
  };

  const fetchWeatherByCoords = async (lat, lon) => {
    try {
      const [currentRes, forecastRes, weatherBitRes] = await Promise.all([
        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`),
        fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`),
        fetch(`https://api.weatherbit.io/v2.0/current?lat=${lat}&lon=${lon}&key=${WEATHERBIT_KEY}&units=M`)
      ]);

      if (!currentRes.ok || !forecastRes.ok || !weatherBitRes.ok) 
        throw new Error('Weather data not available');

      const currentData = await currentRes.json();
      const forecastData = await forecastRes.json();
      const weatherBitData = await weatherBitRes.json();

      setWeatherData({ ...currentData, weatherBit: weatherBitData.data[0] });
      setForecastData(processForecastData(forecastData));
      setError(null);
    } catch (err) {
      setError(err.message);
      setWeatherData(null);
      setForecastData(null);
    }
  };

  const fetchWeather = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const [currentRes, forecastRes, weatherBitRes] = await Promise.all([
        fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`),
        fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`),
        fetch(`https://api.weatherbit.io/v2.0/current?city=${city}&key=${WEATHERBIT_KEY}&units=M`)
      ]);

      if (!currentRes.ok || !forecastRes.ok || !weatherBitRes.ok) 
        throw new Error('City not found');

      const currentData = await currentRes.json();
      const forecastData = await forecastRes.json();
      const weatherBitData = await weatherBitRes.json();

      setWeatherData({ ...currentData, weatherBit: weatherBitData.data[0] });
      setForecastData(processForecastData(forecastData));
      setError(null);
    } catch (err) {
      setError(err.message);
      setWeatherData(null);
      setForecastData(null);
    } finally {
      setLoading(false);
    }
  };

  const processForecastData = (data) => {
    const dailyData = [];
    const seenDates = new Set();
    
    data.list.forEach(item => {
      const date = new Date(item.dt * 1000).toLocaleDateString();
      if (!seenDates.has(date) && dailyData.length < 5) {
        seenDates.add(date);
        dailyData.push({
          date: date,
          temp: Math.round(item.main.temp),
          icon: item.weather[0].icon,
          description: item.weather[0].description
        });
      }
    });
    return dailyData;
  };

  useEffect(() => {
    getLocation();
  }, []);

  return (
    <div className="app">
      <div className="weather-container">
        <h1 className="title">Weather Forecast</h1>
        
        <form onSubmit={fetchWeather} className="search-form">
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Enter city name"
            className="city-input"
          />
          <button type="submit" className="search-btn" disabled={loading}>
            {loading ? 'Loading...' : 'Search'}
          </button>
        </form>

        {error && <p className="error">{error}</p>}

        {weatherData && (
          <div className="weather-info">
            <div className="current-weather">
              <h2>{weatherData.name}</h2>
              <div className="main-info">
                <img
                  src={`https://www.weatherbit.io/static/img/icons/${weatherData.weatherBit.weather.icon}.png`}
                  alt="weather icon"
                  className="weather-icon"
                />
                <div className="temp-container">
                  <p className="temperature">
                    <i className="fas fa-thermometer-half"></i> 
                    {Math.round(weatherData.main.temp)}°C
                  </p>
                  <p className="description">{weatherData.weather[0].description}</p>
                </div>
              </div>
              <div className="details">
                <p>
                  <i className="fas fa-temperature-low"></i> 
                  Feels like: {Math.round(weatherData.main.feels_like)}°C
                </p>
                <p>
                  <i className="fas fa-tint"></i> 
                  Humidity: {weatherData.main.humidity}%
                </p>
                <p>
                  <i className="fas fa-wind"></i> 
                  Wind: {weatherData.wind.speed} m/s
                </p>
              </div>
            </div>

            {forecastData && (
              <div className="forecast-container">
                <h3>5-Day Forecast</h3>
                <div className="forecast-grid">
                  {forecastData.map((day, index) => (
                    <div key={index} className="forecast-card">
                      <p className="forecast-date">{day.date}</p>
                      <img
                        src={`http://openweathermap.org/img/wn/${day.icon}@2x.png`}
                        alt="forecast icon"
                      />
                      <p className="forecast-temp">
                        <i className="fas fa-thermometer-half"></i> 
                        {day.temp}°C
                      </p>
                      <p className="forecast-desc">{day.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;