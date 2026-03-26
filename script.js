const API_KEY = "8cc73129f980ec310558fc9600caefa1";

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


// 🔹 Step 1: Get basic weather
async function getWeather(city) {
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
    );

    const data = await res.json();
    console.log(data);
    if (data.cod !== 200) {
      alert("City not found");
      return;
    }
    getForecast(city);
    updateUI(data);

    // 🔥 Step 2: Get lat/lon → call One Call API
    const { lat, lon } = data.coord;
    getExtraData(lat, lon);

  } catch (err) {
    console.log(err);
    alert("API error");
  }
}


// 🔹 Step 2: Get UV + Dew Point
async function getExtraData(lat, lon) {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=uv_index_max&hourly=dew_point_2m`
    );

    const data = await res.json();
    console.log(data);
    if (!data.daily.uv_index_max) throw new Error("Invalid response");

    uv.innerText = data.daily.uv_index_max[0];

    dew.innerText = Math.round(data.hourly.dew_point_2m[0]) + "°C";

  } catch (err) {
    console.log(err);
    uv.innerText = "N/A";
    dew.innerText = "N/A";
  }
}


// 🔹 Update UI
function updateUI(data) {
  locationText.innerText = `${data.name}, ${data.sys.country}`;

  tempDisplay.innerText = Math.round(data.main.temp) + "°";
  feelsLike.innerText =
    "Feels like " + Math.round(data.main.feels_like) + "°";

  desc.innerText = data.weather[0].description;

  wind.innerText = data.wind.speed + " m/s";
  humidity.innerText = data.main.humidity + "%";
  pressure.innerText = data.main.pressure + " hPa";
  visibility.innerText = data.visibility / 1000 + " km";

  // 🔥 Dynamic background
  const weatherMain = data.weather[0].main.toLowerCase();
  const img = document.querySelector("img[alt='London']");

  if (weatherMain.includes("cloud")) {
    img.src =
      "https://openweathermap.org/img/widget_images/scattered_clouds.jpg";
  } else if (weatherMain.includes("rain")) {
    img.src =
      "https://openweathermap.org/img/widget_images/rain.jpg";
  } else {
    img.src =
      "https://openweathermap.org/img/widget_images/clear_sky.jpg";
  }
}


// 🔹 Search
searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const city = searchInput.value.trim();
    if (!city) return;
    getWeather(city);
  }
});


async function getForecast(city) {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`
  );

  const data = await res.json();

  // pick 12:00 data (1 per day)
  const daily = data.list.filter(item =>
    item.dt_txt.includes("12:00:00")
  );

  displayForecast(daily);
}
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
    const desc = day.weather[0].description;

    const btn = document.createElement("button");

    btn.className = `
      h-11 flex items-center justify-center gap-2.5 rounded-xl border border-white/30 
      cursor-pointer transition-all shrink-0 
      ${index === 0 ? "bg-orange" : "bg-black/20 hover:bg-black/30"} 
      w-[125px]
    `;

    btn.innerHTML = `
      <span class="text-base font-medium text-white whitespace-nowrap">${dayName}</span>
      <span class="text-base font-medium text-white">${temp}<sup>°</sup></span>
      <img src="https://openweathermap.org/img/wn/${icon}@2x.png" 
           class="w-6 h-6 object-contain" 
           alt="${desc}" />
    `;

    container.appendChild(btn);
  });
}


// 🔹 Default
getWeather("Delhi");