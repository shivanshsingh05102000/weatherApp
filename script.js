const API_KEY = "8cc73129f980ec310558fc9600caefa1";

let currentUnit = "metric";
let forecastData = null;
let marker = null;
let weatherMarkers = [];
let lastCoords = null;

// ================= ELEMENTS =================
const searchInput = document.getElementById("search");

const locationText = document.getElementById("location");
const tempDisplay = document.getElementById("temp");
const feelsLike = document.getElementById("feels");
const desc = document.getElementById("desc");

const wind = document.getElementById("wind");
const humidity = document.getElementById("humidity");
const pressure = document.getElementById("pressure");
const visibility = document.getElementById("visibility");

const cBtn = document.getElementById("celsius");
const fBtn = document.getElementById("fahrenheit");
const locationBtn = document.getElementById("use-location");

// ================= ERROR =================
function showError(msg) {
  const err = document.getElementById("error");
  err.innerText = msg;
  err.classList.remove("hidden");
  setTimeout(() => err.classList.add("hidden"), 3000);
}

// ================= RECENT SEARCH =================
function saveRecent(city) {
  city = city.toLowerCase().trim(); // 🔥 normalize

  let cities = JSON.parse(localStorage.getItem("recentCities")) || [];

  if (!cities.includes(city)) {
    cities.unshift(city);
    if (cities.length > 5) cities.pop();
    localStorage.setItem("recentCities", JSON.stringify(cities));
  }

  renderDropdown();
}

function renderDropdown() {
  const dropdown = document.getElementById("recent-dropdown");
  const cities = JSON.parse(localStorage.getItem("recentCities")) || [];

  if (cities.length === 0) {
    dropdown.classList.add("hidden");
    return;
  }

  dropdown.innerHTML = "";

  cities.forEach(city => {
    const div = document.createElement("div");
    div.className = "p-2 hover:bg-gray-200 cursor-pointer transition";

    div.innerText =
      city.charAt(0).toUpperCase() + city.slice(1);

    div.onclick = () => {
      searchInput.value = city;
      getWeather(city);
      dropdown.classList.add("hidden");
    };

    dropdown.appendChild(div);
  });

  dropdown.classList.remove("hidden");
}

// ================= MAP =================
const map = L.map("map").setView([28.6139, 77.2090], 5);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

L.tileLayer(
  `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${API_KEY}`,
  { opacity: 0.6 }
).addTo(map);

map.on("click", (e) => {
  const { lat, lng } = e.latlng;
  moveMap(lat, lng);
  getWeatherByCoords(lat, lng);
});

function moveMap(lat, lon) {
  map.setView([lat, lon], 8);

  if (marker) map.removeLayer(marker);
  marker = L.marker([lat, lon]).addTo(map);
}

// ================= WEATHER =================
async function getWeather(city) {
  if (!city) return showError("Enter city name");

  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=${currentUnit}`
    );

    const data = await res.json();
    if (data.cod !== 200) return showError("City not found");

    lastCoords = data.coord;

    updateUI(data);
    getForecast(city);
    moveMap(data.coord.lat, data.coord.lon);
    showWeatherOnMap();
    saveRecent(city);

  } catch {
    showError("API Error");
  }
}

async function getWeatherByCoords(lat, lon) {
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${currentUnit}`
    );

    const data = await res.json();

    lastCoords = { lat, lon };

    updateUI(data);
    getForecastByCoords(lat, lon);
    moveMap(lat, lon);
    showWeatherOnMap();

  } catch {
    showError("API Error");
  }
}

// ================= UI =================
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
  visibility.innerText = (data.visibility / 1000).toFixed(1) + " km";

  // 🔥 FIXED ALERT (C + F safe)
  let tempC =
    currentUnit === "metric"
      ? data.main.temp
      : (data.main.temp - 32) * (5 / 9);

  if (tempC > 40) {
    showError("🔥 Extreme heat alert (>40°C)");
  }

  // 🌧️ Dynamic background
  const bg = document.getElementById("weather-bg");
  const condition = data.weather[0].main.toLowerCase();
  if (condition.includes("rain")) {
    bg.src = "https://openweathermap.org/img/widget_images/rain.jpg";
  } else if (condition.includes("cloud")) {
    bg.src = "https://openweathermap.org/img/widget_images/cloudy.jpg";
  } else {
    bg.src = "https://openweathermap.org/img/widget_images/clear_sky.jpg";
  }
}

// ================= FORECAST =================
async function getForecast(city) {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=${currentUnit}`
  );

  const data = await res.json();
  forecastData = data.list;

  displayHourly(forecastData.slice(0, 8));

  const daily = forecastData.filter(item =>
    item.dt_txt.includes("12:00:00")
  );

  displayForecast(daily);
}

async function getForecastByCoords(lat, lon) {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${currentUnit}`
  );

  const data = await res.json();
  forecastData = data.list;

  displayHourly(forecastData.slice(0, 8));

  const daily = forecastData.filter(item =>
    item.dt_txt.includes("12:00:00")
  );

  displayForecast(daily);
}

// ================= HOURLY =================
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

// ================= DAILY =================
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

    btn.className =
      "h-11 flex items-center justify-center gap-2 rounded-xl w-[120px] bg-black/20 text-white";

    btn.innerHTML = `
      <span>${dayName}</span>
      <span>${temp}°</span>
      <img src="https://openweathermap.org/img/wn/${icon}.png" class="w-6"/>
    `;

    btn.onclick = () => {
      [...container.children].forEach(b => {
        b.classList.remove("bg-orange-500");
        b.classList.add("bg-black/20");
      });

      btn.classList.add("bg-orange-500");

      const selectedDate = day.dt_txt.split(" ")[0];

      const filtered = forecastData.filter(item =>
        item.dt_txt.startsWith(selectedDate)
      );

      displayHourly(filtered);
    };

    if (index === 0) btn.classList.add("bg-orange-500");

    container.appendChild(btn);
  });
}

// ================= MAP WEATHER =================
function clearWeatherMarkers() {
  weatherMarkers.forEach(m => map.removeLayer(m));
  weatherMarkers = [];
}

async function showWeatherOnMap() {
  clearWeatherMarkers();

  const cities = [
    [28.6139, 77.2090],
    [19.0760, 72.8777],
    [13.0827, 80.2707],
    [22.5726, 88.3639],
  ];

  cities.forEach(async ([lat, lon]) => {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${currentUnit}`
    );

    const data = await res.json();

    const icon = data.weather[0].icon;
    const temp = Math.round(data.main.temp);

    const weatherIcon = L.divIcon({
      html: `
        <div style="text-align:center">
          <img src="https://openweathermap.org/img/wn/${icon}.png"/>
          <div style="font-size:12px;font-weight:bold">${temp}°</div>
        </div>
      `,
      className: "",
    });

    const m = L.marker([lat, lon], { icon: weatherIcon }).addTo(map);
    weatherMarkers.push(m);
  });
}

// ================= UNIT =================
function setActiveUnit() {
  cBtn.classList.remove("bg-white", "text-black");
  fBtn.classList.remove("bg-white", "text-black");

  if (currentUnit === "metric") {
    cBtn.classList.add("bg-white", "text-black");
  } else {
    fBtn.classList.add("bg-white", "text-black");
  }
}

cBtn.onclick = () => {
  currentUnit = "metric";
  setActiveUnit();

  if (lastCoords) {
    getWeatherByCoords(lastCoords.lat, lastCoords.lon);
  } else {
    getWeather("Delhi");
  }
};

fBtn.onclick = () => {
  currentUnit = "imperial";
  setActiveUnit();

  if (lastCoords) {
    getWeatherByCoords(lastCoords.lat, lastCoords.lon);
  } else {
    getWeather("Delhi");
  }
};

// ================= LOCATION =================
locationBtn.onclick = () => {
  if (!navigator.geolocation) return showError("Geolocation not supported");

  locationBtn.innerText = "Loading...";

  navigator.geolocation.getCurrentPosition(
    pos => {
      const { latitude, longitude } = pos.coords;
      getWeatherByCoords(latitude, longitude);
      locationBtn.innerText = "Use Location";
    },
    () => {
      showError("Location blocked");
      locationBtn.innerText = "Use Location";
    }
  );
};

// ================= SEARCH =================
searchInput.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    const city = searchInput.value.trim();
    if (!city) return showError("Enter a city");
    getWeather(city);
  }
});

searchInput.addEventListener("focus", renderDropdown);

// 🔥 NEW: show dropdown while typing
searchInput.addEventListener("input", renderDropdown);

// 🔥 NEW: hide dropdown on outside click
document.addEventListener("click", (e) => {
  const dropdown = document.getElementById("recent-dropdown");

  if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
    dropdown.classList.add("hidden");
  }
});

// ================= INIT =================
setActiveUnit();
getWeather("Delhi");