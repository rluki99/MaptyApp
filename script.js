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
const cancelBtn = document.querySelector('.form__btn-cancel')

class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workouts = [];
  #workoutEdit;

  constructor() {
    // get user's position
    this._getPosition();

    // get data from local storage
    this._getLocalStorage();

    // attach event handlers
    form.addEventListener('submit', this._newWorkout.bind(this));
    editForm.addEventListener('submit', this._submitEditWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
    // prettier-ignore
    containerWorkouts.addEventListener('click', this._showEditWorkout.bind(this));
    cancelBtn.addEventListener('click', this._hideEditWorkout)
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

  _newWorkout(e) {
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    e.preventDefault();

    // get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // if workout running, create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;

      console.log(distance, duration, cadence);

      // check if data is valid
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Inputs have to be positive numbers!');

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // if workout cycling, create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;

      // check if data is valid
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Inputs have to be positive numbers!');

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

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
      inputElevationEdit
        .closest('.form__row')
        .classList.add('form__row--hidden');
      inputCadenceEdit
        .closest('.form__row')
        .classList.remove('form__row--hidden');
      inputCadenceEdit.value = this.#workoutEdit.cadence;
    }

    if (this.#workoutEdit.type === 'cycling') {
      // prettier-ignore
      inputElevationEdit.closest('.form__row').classList.remove('form__row--hidden');
      inputCadenceEdit.closest('.form__row').classList.add('form__row--hidden');
      inputElevationEdit.value = this.#workoutEdit.elevationGain;
    }

    console.log(this.#workoutEdit);
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
    console.log('czy dalej poszlo');
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    e.preventDefault();

    const type = inputTypeEdit.value;
    const distance = +inputDistanceEdit.value;
    const duration = +inputDurationEdit.value;
    const [lat, lng] = this.#workoutEdit.coords;
    let workout;

    // if workout running, create running object
    if (type === 'running') {
      const cadence = +inputCadenceEdit.value;

      console.log(distance, duration, cadence);

      // check if data is valid
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Inputs have to be positive numbers!');

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // if workout cycling, create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevationEdit.value;

      // check if data is valid
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Inputs have to be positive numbers!');

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    const workoutIndex = this.#workouts.findIndex(
      work => work.id === this.#workoutEdit.id
    );
    console.log(this.#workouts[workoutIndex]);
    console.log(workout);
    this.#workouts[workoutIndex] = workout;
    console.log(this.#workouts[workoutIndex]);
    console.log(workout);
    console.log(this.#workouts);

    document.querySelectorAll('.workout').forEach((work) =>{
      work.remove()
    })

    // render workouts on list
    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });

    // set local storage to all workouts
    this._setLocalStorage();

    // hide modal with edit
    this._hideEditWorkout()
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
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
  }

  _renderWorkout(workout) {
    let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
        <button class="workout__edit">EDIT</button>
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

    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }

  // method to reset localStorage for example via console
  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
