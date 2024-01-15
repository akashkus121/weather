const fs = require('fs');
const request = require('request');
const http = require('http');
require('dotenv').config(); // Load environment variables

const homeFile = fs.readFileSync('index.html', 'utf-8');

const replaceval = (tempval, orgval) => {
    if (!orgval || !orgval.main || !orgval.main.temp || !orgval.main.temp_min || !orgval.main.temp_max || !orgval.name || !orgval.sys || !orgval.sys.country || !orgval.weather || !orgval.weather[0] || !orgval.weather[0].main) {
        console.error('Invalid API response:', orgval);
        return tempval; // Return the original template if data is invalid
    }

    let temperature = tempval.replace("{%tempval%}", orgval.main.temp);
    temperature = temperature.replace("{%tempmin%}", orgval.main.temp_min);
    temperature = temperature.replace("{%tempmax%}", orgval.main.temp_max);
    temperature = temperature.replace("{%location%}", orgval.name);
    temperature = temperature.replace("{%country%}", orgval.sys.country);
    temperature = temperature.replace("{%tempstatus%}", orgval.weather[0].main);

    return temperature;
}

function fetchData(location, res) {
    const apiKey = process.env.WEATHER_API_KEY;
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}`;

    request(apiUrl)
        .on('data', (chunk) => {
            try {
                const objdata = JSON.parse(chunk);
                if (objdata.cod === 401) {
                    console.error('Invalid API key. Please update your API key.');
                    return res.end(); // End the response if there's an issue with the API key
                }

                const arrData = [objdata];
                const realTimeData = arrData.map((val) => replaceval(homeFile, val)).join('');
                res.write(realTimeData);
            } catch (error) {
                console.error('Error parsing JSON:', error);
            }
        })
        .on("end", (err) => {
            if (err) {
                console.error("Connection closed due to errors", err);
            }
            res.end();
        });
}

const server = http.createServer((req, res) => {
    if (req.url === '/') {
        // Default city is set to 'kanpur'
        fetchData('kanpur', res);
    } else if (req.url.startsWith('/search')) {
        const query = new URL(req.url, `http://${req.headers.host}`).searchParams.get('location');
        fetchData(query, res);
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

server.listen(7000, '127.0.0.1', () => {
    console.log('Server is listening on port 7000');
});
