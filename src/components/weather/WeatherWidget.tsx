const WeatherWidget: React.FC = () => {
    return (
        <div className="w-full h-full flex justify-center items-center">
            <iframe
                title="Meteoblue Weather Widget"
                src="https://www.meteoblue.com/en/weather/widget/three?&nocurrent=0&noforecast=0&days=4&tempunit=CELSIUS&windunit=KILOMETER_PER_HOUR&layout=dark"
                frameBorder="0"
                scrolling="no"
                loading="lazy"
                sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox"
                style={{ width: "560px", height: "375px" }}
            ></iframe>
            <div>
                {/* DO NOT REMOVE THIS LINK */}
                <a
                    href="https://www.meteoblue.com/en/weather/week/index?utm_source=three_widget&utm_medium=linkus&utm_content=three&utm_campaign=Weather%2BWidget"
                    target="_blank"
                    rel="noopener"
                    aria-label="Meteoblue Weather Forecast"
                >
                    Meteoblue
                </a>
            </div>
        </div>
    );
};

export default WeatherWidget;