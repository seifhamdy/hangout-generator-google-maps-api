
function showDiv() {
    var x = document.getElementById("map-container");
    var y = document.getElementById("controls");
    if (y.style.display === "grid") {
        showControls();
    }
    if (x.style.display === "block") {
        x.style.opacity = 0;
        setTimeout(function () {
            x.style.display = "none";
        }, 300);
    } else {
        x.style.display = "block";
        setTimeout(function () {
            x.style.opacity = 1;
        }, 10);
    }
}

function showControls() {
    var x = document.getElementById("controls");
    var y = document.getElementById("map-container");
    if (y.style.display === "block") {
        showDiv();
    }
    if (x.style.display === "grid") {
        x.style.opacity = 0;
        setTimeout(function () {
            x.style.display = "none";
        }, 300);
    } else {
        x.style.display = "grid";
        setTimeout(function () {
            x.style.opacity = 1;
        }, 10);
    }
}

// Global variables
var map;
var marker;
var pickedLatitude;
var pickedLongitude;
var minRating = 0.0;

function initMap() {
    // Specify the coordinates of the center of the map
    var center = { lat: 37.7749, lng: -122.4194 };

    // Create a new map instance
    map = new google.maps.Map(document.getElementById('map'), {
        center: center,
        zoom: 12
    });

    // Create a marker variable to store the picked location
    marker = new google.maps.Marker({
        map: map
    });

    // Create an Autocomplete instance for the address input if it exists
    var addressInput = document.getElementById('addressInput');
    if (addressInput) {
        var autocomplete = new google.maps.places.Autocomplete(addressInput);
        autocomplete.bindTo('bounds', map);

        // Add a place_changed event listener to the autocomplete input
        autocomplete.addListener('place_changed', function () {
            var place = autocomplete.getPlace();

            if (place.geometry && place.geometry.location) {
                // Update the map center and marker position
                map.setCenter(place.geometry.location);
                marker.setPosition(place.geometry.location);
                pickedLatitude = place.geometry.location.lat();
                pickedLongitude = place.geometry.location.lng();
            }
        });
    }

    // Add a click event listener to the map
    map.addListener('click', function (event) {
        // Get the latitude and longitude from the clicked location
        var latLng = event.latLng;
        pickedLatitude = latLng.lat();
        pickedLongitude = latLng.lng();

        // Update the marker position
        marker.setPosition(latLng);
    });

    // Handle search button click event
    var searchButton = document.getElementById('submit');
    searchButton.addEventListener('click', searchPlaces);

    var radioButtons = document.querySelectorAll('fieldset.rate input[type="radio"]');
    radioButtons.forEach(function (radioButton) {
        radioButton.addEventListener('change', function () {
            // Get the value of the selected radio button and convert it to a float
            var selectedValue = parseFloat(this.value);

            // Update the minRating variable with the selected value (or default to zero if no radio button is selected)
            minRating = isNaN(selectedValue) ? 0.0 : selectedValue;
            console.log(minRating);
        });
    });
}
function searchPlaces() {
    // Get the user-selected values from the UI elements
    var radius = parseInt(document.getElementById('radiusInput').value);
    var placeCategory = document.getElementById('categorySelect').value;
    var filterByWorkingHours = document.getElementById('workingHoursCheckbox').checked;

    // Create a Places Service instance
    var placesService = new google.maps.places.PlacesService(map);

    // Set up a request to search for nearby places
    var request = {
        location: new google.maps.LatLng(pickedLatitude, pickedLongitude),
        radius: radius,
    };

    if (placeCategory !== "any") {
        request.type = placeCategory;
    } else {
        delete request.type;
    }

    // Send the nearby search request
    placesService.nearbySearch(request, function (results, status) {
        handleNearbySearch(results, status, minRating, filterByWorkingHours);
    });
}

function handleNearbySearch(results, status, minRating, filterByWorkingHours) {
    minRating = parseFloat(minRating);
    if (status === google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
        // Filter the results based on minimum rating
        var filteredResults = results.filter(function (place) {
            var placeRating = parseFloat(place.rating || 0.0);
            return placeRating >= minRating;
        });

        // Apply working hours filter if enabled
        if (filterByWorkingHours) {
            filteredResults = filteredResults.filter(function (place) {
                return place.opening_hours && place.opening_hours.isOpen();
            });
        }

        if (filteredResults.length > 0) {
            // Get a random place from the filtered results
            var randomIndex = Math.floor(Math.random() * filteredResults.length);
            var place = filteredResults[randomIndex];
            // Display the place name and address to the user

            var placeCard = generatePlaceCard(place);
            document.getElementById("placeCard").style.display = "block";
            document.getElementById("placeCard").innerHTML = placeCard;


            // Embed the Google Maps Place using the Place ID
            var placeId = place.place_id;
            var iframeHtml = '<iframe width="100%" height="300px" frameborder="0" style="border:0" src="https://www.google.com/maps/embed/v1/place?q=place_id:' + placeId + '&key=AIzaSyBK-cMbRGlKjjpe_o9KQaRBAhc8GzDExsk"></iframe>';

            // Display the embedded map
            document.getElementById("placeMap").style.display = "block";
            document.getElementById('placeMap').innerHTML = iframeHtml;
        } else {
            // No places found based on the filter criteria
            document.getElementById('placeCard').innerHTML = 'No suitable places found';
            document.getElementById('placeMap').innerHTML = '';
        }
    } else {
        // No places found within the specified radius
        document.getElementById('placeCard').innerHTML = 'No nearby places found';
        document.getElementById('placeMap').innerHTML = '';
    }
}

function generatePlaceCard(place) {
    var name = place.name;
    var address = place.vicinity;
    var rating = place.rating || 'N/A';
    var photoUrl = place.photos && place.photos[0].getUrl({ maxWidth: 300 });

    var html = '<div class="place-card">';
    if (photoUrl) {
        html += '<img src="' + photoUrl + '" alt="' + name + '">';
    } else {
        html += "No image available"
    }
    html += '<div class="place-details">';
    html += '<h2>' + name + '</h2>';
    html += '<p><strong>Address:</strong> ' + address + '</p>';
    html += '<p><strong>Rating:</strong> ' + rating + '</p>';
    html += '</div>';
    html += '</div>';

    return html;
}