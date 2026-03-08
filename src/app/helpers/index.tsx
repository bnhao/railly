export const getWindDirection = (degree: number) => {
    if (degree > 15 && degree <= 75) return 'NE';
    if (degree > 75 && degree <= 105) return 'E';
    if (degree > 105 && degree <= 165) return 'SE';
    if (degree > 165 && degree <= 195) return 'S';
    if (degree > 195 && degree <= 255) return 'SW';
    if (degree > 255 && degree <= 285) return 'W';
    if (degree > 285 && degree <= 345) return 'NW';

    return 'N';
}