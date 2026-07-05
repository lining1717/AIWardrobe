/**
 * QWeather 兼容图标代码 → emoji 映射
 *
 * 后端 services/weather.py 的 map_weather_code() 把 Open-Meteo WMO weather_code
 * 映射成 QWeather 3 位数字图标代码字符串（如 "100"、"150"），前端需要再转成 emoji 显示。
 *
 * 参考：https://dev.qweather.com/docs/resource/icons/
 */

const WEATHER_ICON_MAP = {
    // 晴 / 夜间晴
    100: '☀️',
    150: '🌙',
    // 多云
    101: '⛅',
    102: '⛅',
    103: '⛅',
    104: '☁️',
    // 雨
    300: '🌦️',
    301: '🌧️',
    302: '⛈️',
    303: '⛈️',
    304: '⛈️',
    305: '🌦️',
    306: '🌧️',
    307: '🌧️',
    308: '🌧️',
    309: '🌦️',
    310: '🌧️',
    311: '🌧️',
    312: '🌧️',
    313: '🌧️',
    314: '🌧️',
    315: '🌧️',
    316: '🌧️',
    317: '🌧️',
    318: '🌧️',
    399: '🌧️',
    // 雪
    400: '🌨️',
    401: '🌨️',
    402: '❄️',
    403: '❄️',
    404: '🌨️',
    405: '🌨️',
    406: '🌨️',
    407: '❄️',
    408: '❄️',
    409: '❄️',
    410: '❄️',
    // 雾霾沙尘
    500: '🌫️',
    501: '🌫️',
    502: '🌫️',
    503: '🌫️',
    504: '🌫️',
    507: '🌪️',
    508: '🌪️',
    509: '🌫️',
    510: '🌫️',
    511: '🌫️',
    512: '🌫️',
    513: '🌫️',
    514: '🌫️',
    515: '🌫️',
    499: '🌨️',
    // 极端天气
    900: '🔥',
    901: '🥶',
    999: '🌤️'
}

/**
 * 把 QWeather 图标代码转成 emoji。
 * @param {string|number} code - QWeather 3 位数字图标代码（如 "100"、"150"）
 * @param {string} fallback - 未知 code 时的兜底 emoji
 * @returns {string} emoji
 */
export function weatherCodeToEmoji(code, fallback = '🌤️') {
    if (code == null || code === '') return fallback
    const key = String(code)
    return WEATHER_ICON_MAP[key] || fallback
}
