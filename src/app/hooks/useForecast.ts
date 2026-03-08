import { useState, useEffect } from 'react';
import { locationType, forecastType } from '../types';
import { meteoMaps } from '@/components/weather/meteo-maps';


const useForecast = () => {

    const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

    const [selectedTrack, setSelectedTrack] = useState(''); // use to track the currently selected track
    const [forecastData, setForecastData] = useState<{ [key: string]: forecastType | null }>({}); // stores weather data for multiple locations in an object, track is a key
    const [predictWeatherData, setPredictWeatherData] = useState<{ [key: string]: forecastType | null }>({}); // store predicted weather data for a location 

    // predefined locations
    const locations: { [key: string]: locationType } = {
        Vancouver: { name: 'Vancouver', lat: 49.2827, lon: -123.1207 },
        Banff: { name: 'Banff', lat: 51.1784, lon: -115.5708 },
        Edmonton: { name: 'Edmonton', lat: 53.5461, lon: -113.4938 },
        Jasper: { name: 'Jasper', lat: 52.8734, lon: -118.0806 },
        Canmore: { name: 'Canmore', lat: 51.0899, lon: -115.3593 },
        'Red Deer': { name: 'Red Deer', lat: 52.2681, lon: -113.8112 },
    };

    // To fetch weather data for a single location, which take parameter location of type locationType and return a promise of forecastType
    const getWeatherData = async (location: locationType): Promise<forecastType | null> => {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lon}&units=metric&appid=${API_KEY}`
        );
        const data = await response.json(); // fetch data from the response as a list 
        return {
            name: data.name,
            country: data.sys.country,
            sunrise: data.sys.sunrise,
            sunset: data.sys.sunset,
            list: [
                {
                    dt: data.dt,
                    main: data.main,
                    visibility: data.visibility,
                    wind: data.wind,
                    clouds: data.clouds,
                    weather: data.weather[0],
                    timestamp: data.dt,
                    temperature: {
                        current
                            : data.main.temp,
                    }
                },
            ],
        };

    };

    const getPredictWeatherData = async (location: locationType): Promise<forecastType | null> => {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${location.lat}&lon=${location.lon}&cnt=10&units=metric&appid=${API_KEY}`
        );
        const data = await response.json();
        console.log(data);

        return {
            name: data.city.name,
            country: data.city.country,
            sunrise: data.city.sunrise,
            sunset: data.city.sunset,
            list: data.list.map((day: any) => ({
                temperature: {
                    current: day.main.temp,
                },
                wind: {
                    speed: day.wind.speed,
                },
                timestamp: day.dt_txt
            })),
        };
    };

    // To fetch weather data for all locations simultaneously
    const fetchAllWeatherData = async () => {
        const updatedData: { [key: string]: forecastType | null } = {};
        const locationKeys = Object.keys(locations); // Fetch the keys of the locations object

        for (const key of locationKeys) {
            const location = locations[key];
            const weatherData = await getWeatherData(location);
            updatedData[key] = weatherData;
        }

        setForecastData(updatedData);
    };

    const fetchPredictWeatherData = async () => {
        if (!selectedTrack) {
            return;
        }
        const updatedData: { [key: string]: forecastType | null } = {};

        const location = locations[selectedTrack];
        const data = await getPredictWeatherData(location)
        updatedData[selectedTrack] = data;
        setPredictWeatherData(updatedData);
        console.log('Predicted weather data:', JSON.stringify(updatedData, null, 2));

        saveDataToFile({ predictWeatherData: updatedData });

    };

    const saveDataToFile = async (dataToSave: any) => {
        try {
            const response = await fetch('/api/saveWeather', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSave, null, 2),
            });

            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('Data saved:', result);
        } catch (error) {
            console.error('Error saving data:', error);
        }
    };




    // To handle the track change event (through track selection)
    const handleTrackChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const track = e.target.value.trim();
        setSelectedTrack(track);
    };

    // To fetch weather data for all locations when the component mounts
    useEffect(() => {
        fetchAllWeatherData();
    }, []);

    useEffect(() => {
        if (selectedTrack && locations[selectedTrack]) {
            fetchPredictWeatherData();
        }
    }, [selectedTrack]);

    return { selectedTrack, handleTrackChange, forecastData, locations, getPredictWeatherData, predictWeatherData };
};


export default useForecast;
