# Aero Tech

**Aero Tech helps you find the perfect window of good weather for your outdoor activities.**

## The Problem

You need to walk the dog, go for a run, or commute to work, but the weather is unpredictable. Traditional weather apps give you the current conditions, but don't help you plan around short bursts of rain or find that ideal sunny spot in your day.

## The Solution

Aero Tech provides hour-by-hour weather forecasts and highlights the perfect time slots for your outdoor tasks. Plan your day with confidence, knowing you won't get caught in a downpour.

## Key Features

*   **Hourly Forecasts:** View detailed hour-by-hour weather predictions.
*   **Task Scheduling:** Assign tasks to specific time slots.
*   **Weather Filtering:** Automatically filter out times with unsuitable weather for your activities.
*   **Location Search:** Get forecasts for any location.
*   **Default Location:** Set a home location for quick access to your local weather.
*   **Smart Task Restrictions:** Get warnings if you try to schedule a task during bad weather.
*   **Dark Mode:** Easy on the eyes, for those late-night planning sessions.

## Getting Started

1.  Clone the repository: `git clone <repository-url>`
2.  Install dependencies: `npm install`
3.  Run the development server: `npm run dev`

## Technologies Used

*   [React](https://reactjs.org/)
*   [Vite](https://vitejs.dev/)
*   [Open-Meteo API](https://open-meteo.com/)

## My Implementation

* Created settings page
* Added news header to dashboard
* Completed CSS
* Created the Dashboard page, SearchResults and WeatherCards components, using the weather API, Open-Meteo.

## API Usage
Using the weather API, Open-Meteo.
* Free to use
* Providers hour-by-hour weather forecasts
* Allows many different locations

## Technical Explanation

### Search State

The Dashboard tracks what the user types inside the search bar:

```js
const [searchQuery, setSearchQuery] = useState('');
```

This value is controlled by the Navbar component, which calls `onSearchQueryChange` whenever the user types.

### Searching a location

When the user presses Enter or hits the Search button, the `handleSearch` function runs:

```js
const handleSearch = useCallback(async () => {
    // If the search box is empty, clear the results
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      // Build the API url
      const url =
        `https://geocoding-api.open-meteo.com/v1/search?` +
        `name=${encodeURIComponent(searchQuery)}&count=5&language=en&format=json`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Geocoding API error, status: ${response.status}`);
      }

      const data = await response.json();

      // The API sometimes returns an error object instead of results
      if (data.error) {
        throw new Error(data.reason || 'Geocoding API returned an error');
      }

      // Make sure results is an array before using it
      if (Array.isArray(data.results)) {
        // Only keep results that contain the required fields
        const valid = data.results.filter(item =>
          item.name &&
          typeof item.latitude === 'number' &&
          typeof item.longitude === 'number'
        );

        setSearchResults(valid);

        // Auto-select the first valid result for weather data
        if (valid.length > 0) {
          setLocation(valid[0]);
        }
      } else {
        setSearchResults([]);
      }

    } catch (error) {
      console.error('Could not fetch geocoding results', error);
      setSearchResults([]);
    }
  }, [searchQuery]);
```

### How searching Works

* The input the user types goes into the Open-Meteo geocoding API.
* The API returns a list of locations.
* The code filters the results to keep:
  * a `name`
  * a `latitude`
  * a `longitude`
* The valid results are stored in `searchResults`, which is updated with the useState function `setSearchResults`.

### Automatically selecting a result

The first valid result is automatically chosen from the data returned:

```js
if (valid.length > 0) {
  setLocation(valid[0]);
}
```

### Passing data to components

The Dashboard sends needed data to two child components.

#### SearchResults Component

```jsx
<SearchResults
  results={searchResults}
  onSelectLocation={setLocation}
/>
```

* `results` is the API data after searching up locations.
* `onSelectLocation` updates the weater time slots to match what location the user selected.

#### WeatherCards component

```jsx
<WeatherCards
  location={location}
  onWeatherChange={setWeatherType}
/>
```

* `location` is the place that was last picked.
* WeatherCards fetches weather for that place to update the background theme with `onWeatherChange`, which is an example of lifting up state.
