const API_KEY = "8cc73129f980ec310558fc9600caefa1";

let currentUnit = "metric";

const searchInput = document.querySelector("input");

const locationText = document.getElementById("location");
const tempDisplay = document.getElementById("temp");
const feelsLike = document.getElementById("feels");
const desc = document.getElementById("desc");

const wind = document.getElementById("wind");
const humidity = document.getElementById("humidity");
const pressure = document.getElementById("pressure");
const visibility = document.getElementById("visibility");

const uv = document.getElementById("uv");
const dew = document.getElementById("dew");

const cBtn = document.getElementById("celsius");
const fBtn = document.getElementById("fahrenheit");
const locationBtn = document.getElementById("use-location");


// 🔹 MAIN WEATHER
async function getWeather(city) {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=${currentUnit}`
  );

  const data = await res.json();

  if (data.cod !== 200) {
    alert("City not found");
    return;
  }

  updateUI(data);
  getForecast(city);

  const { lat, lon } = data.coord;
  getExtraData(lat, lon);
}


// 🔹 COORD WEATHER
async function getWeatherByCoords(lat, lon) {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${currentUnit}`
  );

  const data = await res.json();

  updateUI(data);
  getForecastByCoords(lat, lon);
  getExtraData(lat, lon);
}


// 🔹 EXTRA
async function getExtraData(lat, lon) {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=uv_index_max&hourly=dew_point_2m`
    );

    const data = await res.json();

    uv.innerText = data.daily?.uv_index_max?.[0] ?? "N/A";
    dew.innerText = Math.round(data.hourly?.dew_point_2m?.[0] ?? 0) + "°";

  } catch {
    uv.innerText = "N/A";
    dew.innerText = "N/A";
  }
}


// 🔹 UI
function updateUI(data) {
  locationText.innerText = `${data.name}, ${data.sys.country}`;

  tempDisplay.innerText = Math.round(data.main.temp) + "°";
  feelsLike.innerText = "Feels like " + Math.round(data.main.feels_like) + "°";
  desc.innerText = data.weather[0].description;

  wind.innerText =
    currentUnit === "metric"
      ? data.wind.speed + " m/s"
      : data.wind.speed + " mph";

  humidity.innerText = data.main.humidity + "%";
  pressure.innerText = data.main.pressure + " hPa";
  visibility.innerText = data.visibility / 1000 + " km";
}


// 🔹 FORECAST
async function getForecast(city) {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=${currentUnit}`
  );

  const data = await res.json();

  displayHourly(data.list.slice(0, 8));

  const daily = data.list.filter(item =>
    item.dt_txt.includes("12:00:00")
  );

  displayForecast(daily);
}

async function getForecastByCoords(lat, lon) {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${currentUnit}`
  );

  const data = await res.json();

  displayHourly(data.list.slice(0, 8));

  const daily = data.list.filter(item =>
    item.dt_txt.includes("12:00:00")
  );

  displayForecast(daily);
}


// 🔹 HOURLY
function displayHourly(hours) {
  const container = document.getElementById("hourly-container");
  container.innerHTML = "";

  hours.forEach(item => {
    const time = item.dt_txt.split(" ")[1].slice(0, 5);
    const temp = Math.round(item.main.temp);
    const icon = item.weather[0].icon;

    const div = document.createElement("div");

    div.className = "bg-orange-100 rounded-xl p-3 text-center w-20 shrink-0";

    div.innerHTML = `
      <span class="text-xs block mb-2">${time}</span>
      <img src="https://openweathermap.org/img/wn/${icon}.png" class="mx-auto w-6"/>
      <span class="text-lg block">${temp}°</span>
    `;

    container.appendChild(div);
  });
}


// 🔹 DAILY
function displayForecast(days) {
  const container = document.getElementById("seven-day");
  container.innerHTML = "";

  days.forEach((day, index) => {
    const date = new Date(day.dt_txt);

    const dayName =
      index === 0
        ? "Today"
        : date.toLocaleDateString("en-US", { weekday: "short" });

    const temp = Math.round(day.main.temp);
    const icon = day.weather[0].icon;

    const btn = document.createElement("button");

    btn.className = `
      h-11 flex items-center justify-center gap-2 rounded-xl
      ${index === 0 ? "bg-orange-500 text-white" : "bg-black/20 text-white"}
      w-[120px]
    `;

    btn.innerHTML = `
      <span>${dayName}</span>
      <span>${temp}°</span>
      <img src="https://openweathermap.org/img/wn/${icon}.png" class="w-6"/>
    `;

    container.appendChild(btn);
  });
}


// 🔹 SEARCH
searchInput.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    const city = searchInput.value.trim();
    if (city) getWeather(city);
  }
});


// 🔹 UNIT SWITCH
cBtn.onclick = () => {
  currentUnit = "metric";
  getWeather(searchInput.value || "Delhi");
};

fBtn.onclick = () => {
  currentUnit = "imperial";
  getWeather(searchInput.value || "Delhi");
};


// 🔹 LOCATION
locationBtn.onclick = () => {
  navigator.geolocation.getCurrentPosition(
    pos => {
      getWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
    },
    () => alert("Permission denied")
  );
};
const map = L.map("map").setView([28.6139, 77.2090], 5); // Delhi

// Base map
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap",
}).addTo(map);
L.tileLayer(
  `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${API_KEY}`,
  {
    opacity: 0.6,
  }
).addTo(map);

// 🔹 DEFAULT
getWeather("Delhi");