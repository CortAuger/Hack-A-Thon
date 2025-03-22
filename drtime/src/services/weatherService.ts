import axios from "axios";

const API_KEY =
  process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY || "fallback_key";
const API_URL =
  process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_URL ||
  "https://api.openweathermap.org/data/2.5";

export interface WeatherForecast {
  dt: number;
  temp:
    | number
    | {
        day: number;
        min?: number;
        max?: number;
        night?: number;
        eve?: number;
        morn?: number;
      };
  feels_like: number;
  humidity: number;
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
  pop: number; // Probability of precipitation
  uvi: number; // UV Index
}

export interface AirQuality {
  aqi: number;
  components: {
    pm2_5: number;
    pm10: number;
    o3: number;
    no2: number;
    co: number;
  };
}

export interface WeatherResponse {
  current: {
    temp: number;
    feels_like: number;
    humidity: number;
    uvi: number;
    weather: Array<{
      main: string;
      description: string;
      icon: string;
    }>;
  };
  daily: WeatherForecast[];
  hourly: WeatherForecast[];
  air_quality?: AirQuality;
  location_name?: string;
}

export const getUVIndexRecommendation = (
  uvi: number
): { risk: string; recommendation: string } => {
  if (uvi <= 2) {
    return {
      risk: "Low",
      recommendation: "No protection required. Safe to stay outside.",
    };
  } else if (uvi <= 5) {
    return {
      risk: "Moderate",
      recommendation:
        "Wear sunscreen and protective clothing. Seek shade during midday hours.",
    };
  } else if (uvi <= 7) {
    return {
      risk: "High",
      recommendation:
        "Reduce time in the sun between 10 a.m. and 4 p.m. Apply sunscreen SPF 30+.",
    };
  } else if (uvi <= 10) {
    return {
      risk: "Very High",
      recommendation:
        "Minimize sun exposure during midday hours. Apply sunscreen SPF 50+.",
    };
  } else {
    return {
      risk: "Extreme",
      recommendation:
        "Avoid sun exposure during midday hours. Take all precautions.",
    };
  }
};

export const getAQIDescription = (
  aqi: number
): { level: string; description: string } => {
  switch (aqi) {
    case 1:
      return { level: "Good", description: "Air quality is satisfactory" };
    case 2:
      return { level: "Fair", description: "Air quality is acceptable" };
    case 3:
      return {
        level: "Moderate",
        description: "May cause breathing discomfort",
      };
    case 4:
      return {
        level: "Poor",
        description:
          "May cause breathing discomfort to people with lung disease",
      };
    case 5:
      return {
        level: "Very Poor",
        description: "May cause respiratory illness on prolonged exposure",
      };
    default:
      return { level: "Unknown", description: "No data available" };
  }
};

export const fetchWeatherData = async (
  lat: number,
  lon: number
): Promise<WeatherResponse> => {
  try {
    // 1. Fetch current weather data
    const currentWeatherResponse = await axios.get(
      `${API_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
    );

    // 2. Fetch 5-day forecast data (3-hour intervals)
    const forecastResponse = await axios.get(
      `${API_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
    );

    // 3. Fetch air quality data
    const airQualityResponse = await axios.get(
      `${API_URL}/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`
    );

    // 4. Fetch location name
    const geoResponse = await axios.get(
      `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`
    );

    // Validate API responses
    if (
      !currentWeatherResponse.data ||
      !forecastResponse.data ||
      !airQualityResponse.data ||
      !geoResponse.data
    ) {
      throw new Error("Invalid API response format");
    }

    // Process forecast data into daily and hourly formats
    const dailyForecast = processDailyForecast(forecastResponse.data.list);
    const hourlyForecast = processHourlyForecast(forecastResponse.data.list);

    // Construct weather data response
    const weatherData: WeatherResponse = {
      current: {
        temp: currentWeatherResponse.data.main.temp,
        feels_like: currentWeatherResponse.data.main.feels_like,
        humidity: currentWeatherResponse.data.main.humidity,
        uvi: 0, // UV index not available in basic OpenWeatherMap API
        weather: currentWeatherResponse.data.weather,
      },
      daily: dailyForecast,
      hourly: hourlyForecast,
      air_quality: {
        aqi: airQualityResponse.data.list[0].main.aqi,
        components: airQualityResponse.data.list[0].components,
      },
      location_name: geoResponse.data[0]?.name || "Unknown Location",
    };

    return weatherData;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error("OpenWeatherMap API Error:", error.response.data);
      if (error.response.status === 401) {
        console.error("Authentication failed. Please check your API key.");
      }
    }
    console.error("Error fetching weather data:", error);
    throw error;
  }
};

// Process 3-hour interval forecast data into daily groups
function processDailyForecast(forecastList: any[]): WeatherForecast[] {
  const dailyMap = new Map();

  forecastList.forEach((item) => {
    const date = new Date(item.dt * 1000).toISOString().split("T")[0];

    if (!dailyMap.has(date)) {
      dailyMap.set(date, {
        dt: item.dt,
        temp: {
          day: item.main.temp,
          min: item.main.temp_min,
          max: item.main.temp_max,
        },
        feels_like: item.main.feels_like,
        humidity: item.main.humidity,
        weather: item.weather,
        pop: item.pop || 0,
        uvi: 0,
      });
    } else {
      const existing = dailyMap.get(date);
      if (item.main.temp_max > existing.temp.max) {
        existing.temp.max = item.main.temp_max;
      }
      if (item.main.temp_min < existing.temp.min) {
        existing.temp.min = item.main.temp_min;
      }
      const hour = new Date(item.dt * 1000).getHours();
      if (hour >= 11 && hour <= 14) {
        existing.temp.day = item.main.temp;
        existing.weather = item.weather;
      }
      if (item.pop && item.pop > existing.pop) {
        existing.pop = item.pop;
      }
    }
  });

  return Array.from(dailyMap.values());
}

// Process hourly forecast data
function processHourlyForecast(forecastList: any[]): WeatherForecast[] {
  return forecastList.slice(0, 8).map((item) => ({
    dt: item.dt,
    temp: item.main.temp,
    feels_like: item.main.feels_like,
    humidity: item.main.humidity,
    weather: item.weather,
    pop: item.pop || 0,
    uvi: 0,
  }));
}
