'use strict';

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10) + Math.round(Math.random() * 1_000_000);
  clicks = 0;

  constructor(coords, distance, duration) {
    this.coords = coords; // [lat, lng]
    this.distance = distance; // in km
    this.duration = duration; // in min
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }

  click() {
    this.clicks++;
  }
}

class Running extends Workout {
  type = 'running';

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';

  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    // km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

// const run1 = new Running([39,-12], 5.2, 24, 178)
// const cycling1 = new Cycling([39,-12], 27, 95, 523)
// console.log(run1, cycling1);

///////////////////////////////
// APPLICATION ARCHITECTURE

const form = document.querySelector('.form');
const editForm = document.querySelector('.form__edit');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const inputTypeEdit = document.querySelector('.form__input--type-edit');
const inputDistanceEdit = document.querySelector('.form__input--distance-edit');
const inputDurationEdit = document.querySelector('.form__input--duration-edit');
const inputCadenceEdit = document.querySelector('.form__input--cadence-edit');
const inputElevationEdit = document.querySelector(
  '.form__input--elevation-edit'
);
const workoutHeaderEdit = document.querySelector('.form__workout-header');
const modalOverlay = document.querySelector('.modal-overlay');
const modal = document.querySelector('.modal');
const cancelBtn = document.querySelector('.form__btn-cancel');
const deleteAllBtn = document.querySelector('.delete-all-btn');

class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workouts = [];
  #workoutEdit;
  #markers = [];

  constructor() {
    // get user's position
    this._getPosition();

    // get data from local storage
    this._getLocalStorage();

    // attach event handlers
    form.addEventListener('submit', this._newWorkout.bind(this));
    editForm.addEventListener('submit', this._submitEditWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    inputTypeEdit.addEventListener('change', this._toggleElevationFieldEdit);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
    // prettier-ignore
    containerWorkouts.addEventListener('click', this._showEditWorkout.bind(this));
    containerWorkouts.addEventListener('click', this._deleteWorkout.bind(this));
    cancelBtn.addEventListener('click', this._hideEditWorkout);
    deleteAllBtn.addEventListener('click', this._deleteAllWorkouts.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your position');
        }
      );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // handling clicks on map
    this.#map.on('click', this._showForm.bind(this));

    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    // empty inputs
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => {
      form.style.display = 'grid';
    }, 1000);
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _toggleElevationFieldEdit() {
    //prettier-ignore
    inputElevationEdit.closest('.form__row').classList.toggle('form__row--hidden');
    //prettier-ignore
    inputCadenceEdit.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _validWorkoutInputs(
    type,
    distance,
    duration,
    lat,
    lng,
    inputCadenceType,
    inputElevationType
  ) {
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    // if workout running, create running object
    if (type === 'running') {
      const cadence = +inputCadenceType.value;

      // check if data is valid
      // prettier-ignore
      if (!validInputs(distance, duration, cadence) || !allPositive(distance, duration, cadence)) return;

      return new Running([lat, lng], distance, duration, cadence);
    }

    // if workout cycling, create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevationType.value;

      // check if data is valid
      // prettier-ignore
      if (!validInputs(distance, duration, elevation) || !allPositive(distance, duration)) return;

      return new Cycling([lat, lng], distance, duration, elevation);
    }
  }

  _newWorkout(e) {
    e.preventDefault();

    // get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // validate inputs
    workout = this._validWorkoutInputs(
      type,
      distance,
      duration,
      lat,
      lng,
      inputCadence,
      inputElevation
    );
    if (!workout) return alert('Inputs have to be positive numbers!');

    // add new object to workout array
    this.#workouts.push(workout);

    // render workout on map as marker
    this._renderWorkoutMarker(workout);

    // render workout on list
    this._renderWorkout(workout);

    // hide form + clear input fields
    this._hideForm();

    // set local storage to all workouts
    this._setLocalStorage();
  }

  _showEditWorkout(e) {
    const editBtn = e.target.closest('.workout__edit');

    if (!editBtn) return;

    modalOverlay.classList.add('modal-overlay--active');
    modal.classList.add('modal--active');

    this.#workoutEdit = this.#workouts.find(
      work => work.id === editBtn.closest('.workout').dataset.id
    );

    workoutHeaderEdit.textContent = this.#workoutEdit.description;
    inputTypeEdit.value = this.#workoutEdit.type;
    inputDistanceEdit.value = this.#workoutEdit.distance;
    inputDurationEdit.value = this.#workoutEdit.duration;

    if (this.#workoutEdit.type === 'running') {
      // prettier-ignore
      inputElevationEdit.closest('.form__row').classList.add('form__row--hidden');
      // prettier-ignore
      inputCadenceEdit.closest('.form__row').classList.remove('form__row--hidden');
      inputCadenceEdit.value = this.#workoutEdit.cadence;
    }

    if (this.#workoutEdit.type === 'cycling') {
      // prettier-ignore
      inputElevationEdit.closest('.form__row').classList.remove('form__row--hidden');
      inputCadenceEdit.closest('.form__row').classList.add('form__row--hidden');
      inputElevationEdit.value = this.#workoutEdit.elevationGain;
    }
  }

  _hideEditWorkout() {
    // empty inputs
    inputDistanceEdit.value =
      inputDurationEdit.value =
      inputCadenceEdit.value =
      inputElevationEdit.value =
        '';

    modalOverlay.classList.remove('modal-overlay--active');
    modal.classList.remove('modal--active');
  }

  _submitEditWorkout(e) {
    e.preventDefault();

    const type = inputTypeEdit.value;
    const distance = +inputDistanceEdit.value;
    const duration = +inputDurationEdit.value;
    const [lat, lng] = this.#workoutEdit.coords;
    let workout;

    // validate inputs
    workout = this._validWorkoutInputs(
      type,
      distance,
      duration,
      lat,
      lng,
      inputCadenceEdit,
      inputElevationEdit
    );
    if (!workout) return alert('Inputs have to be positive numbers!');

    // find this workout in #workouts array and rewrite it
    const workoutIndex = this.#workouts.findIndex(
      work => work.id === this.#workoutEdit.id
    );
    this.#workouts[workoutIndex] = workout;

    // clear DOM and render workouts on list
    this._clearAllWorkoutsDOM()

    this._renderAllWorkouts()

    // clear and render new marker
    // prettier-ignore
    const marker = this.#markers.find(marker => marker._latlng.lat == workout.coords[0] && marker._latlng.lng == workout.coords[1])
    const markerIndex = this.#markers.indexOf(marker);

    if (markerIndex !== -1) {
      this.#map.removeLayer(marker);
      this.#markers.splice(markerIndex, 1);
    }

    this._renderWorkoutMarker(workout);

    // set local storage to all workouts
    this._setLocalStorage();

    // hide modal with edit
    this._hideEditWorkout();
  }

  _deleteWorkout(e) {
    const deleteBtn = e.target.closest('.workout__delete');

    if (!deleteBtn) return;

    // find workout to get coords for marker delete
    const workout = this.#workouts.find(
      work => work.id === deleteBtn.closest('.workout').dataset.id
    );

    // find this workout in #workouts array and delete it
    const workoutIndex = this.#workouts.findIndex(
      work => work.id === deleteBtn.closest('.workout').dataset.id
    );
    this.#workouts.splice(workoutIndex, 1);

    // delete this workout from DOM and render rest workouts on list
    this._clearAllWorkoutsDOM();

    this._renderAllWorkouts()

    // delete marker of this workout
    const marker = this.#markers.find(
      marker =>
        marker._latlng.lat == workout.coords[0] &&
        marker._latlng.lng == workout.coords[1]
    );
    const markerIndex = this.#markers.indexOf(marker);

    if (markerIndex !== -1) {
      this.#map.removeLayer(marker);
      this.#markers.splice(markerIndex, 1);
    }

    // set local storage to all workouts
    this._setLocalStorage();
  }

  _deleteAllWorkouts() {
    this.#markers = [];
    this.#workouts = [];

    // remove all workouts from DOM
    this._clearAllWorkoutsDOM();

    // remove all markers
    this._clearAllMarkers();

    // set local storage to all workouts
    this._setLocalStorage();
  }

  _clearAllWorkoutsDOM() {
    document.querySelectorAll('.workout').forEach(work => {
      work.remove();
    });
  }

  _clearAllMarkers() {
    this.#map.eachLayer(layer => {
      if (layer instanceof L.Marker) {
        layer.remove();
      }
    });
  }

  _renderWorkoutMarker(workout) {
    const marker = L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();

    // collect markers in array to manipulate them
    this.#markers.push(marker);
  }

  _renderWorkout(workout) {
    let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__actions">
          <button class="workout__edit">EDIT</button>
          <button class="workout__delete">❌</button>
        </div>
        <div class="workout__details">
          <span class="workout__icon">${
            workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
          }</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>`;

    if (workout.type === 'running')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>`;

    if (workout.type === 'cycling')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevationGain}</span>
          <span class="workout__unit">m</span>
        </div>
      </li>`;

    form.insertAdjacentHTML('afterend', html);
  }

  _renderAllWorkouts() {
    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');

    if (!workoutEl) return;

    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

    // using the public interface
    // workout.click()
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;

    this.#workouts = data;

    this._renderAllWorkouts()
  }

  // method to reset localStorage for example via console
  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
