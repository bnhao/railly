export type locationType = {
    name: string
    lat: number
    lon: number
}

export type forecastType = {
    name: string
    country: string
    sunrise: number
    sunset: number

    list: [
        {
            timestamp: any
            dt: number
            main: {
                feels_like: number
                temp_min: number
                temp: number
                temp_max: number
                pressure: number
                humidity: number
            }
            visibility: number
            wind: {
                speed: number
                deg: number
                gust: number
            }
            clouds: {
                all: number
            }
            weather: {
                id: number
                main: string
                description: string
                icon: string
            }
            temperature: {
                current: number
            }
        }
    ]
}