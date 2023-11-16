# MaptyApp - Workout Tracker App

This is a simple workout tracker application that allows users to log their running and cycling exercises. The app is built using HTML, CSS, and JavaScript. It utilizes the geolocation API built into web browsers for tracking workout locations and the local storage API for storing workout data.

### Preview

![obraz](https://github.com/rluki99/MaptyApp/assets/120097849/12321677-87a8-4b9b-ba1a-e66927ef981d)
https://rluki99.github.io/MaptyApp/

## Technologies Used

- **HTML**: 
- **CSS**: 
- **JavaScript**: 
- **Leaflet.js**: An open-source JavaScript library for interactive maps.
- **Geolocation API**: Used to retrieve the user's current location.
- **Local Storage API**: Stores workout data locally on the user's device.

## Features

### Basic Features

1. **Map Integration**: Displays an interactive map using Leaflet.js, allowing users to select workout locations. A marker is created on the map when a form workout is submitted.
2. **Form Submission**: Users can submit workout details such as type, distance, and duration through a form.
3. **Interactive Map Navigation**: Clicking on a workout in the list navigates the map to the corresponding marker.
4. **Local Storage**: Stores workout data locally on the user's device. When the page is reloaded, the data from Local Storage is rendered in the map and list

### Additional features beyond the project guidelines

1. **Edit Workout**: Allows users to edit the details of a previously saved workout.
2. **Delete Workout**: Enables users to delete a specific workout entry.
3. **Delete All Workouts**: Provides an option to delete all saved workouts.
4. **Alerts and Modals**: Alerts users with modals for various actions, ensuring a smooth user experience.


### Object-Oriented Programming (OOP)

The application is built on the principles of OOP, utilizing classes and class inheritance. The main classes include:

- **Workout**: The base class for all workouts, containing common properties and methods.
- **Running**: Extends the Workout class, representing running workouts with additional properties like cadence and pace.
- **Cycling**: Extends the Workout class, representing cycling workouts with additional properties like speed and elevation gain.
- **App Class** :

The `App` class serves as the central component of the application, orchestrating the functionality and interactions between various elements. It manages the user interface, handles user input, and interacts with the core workout classes. The key responsibilities of the `App` class include:

- **Managing Workouts**: The `App` class keeps track of all workouts created by the user, utilizing the `Workout`, `Running`, and `Cycling` classes.

- **Interacting with the DOM**: It handles interactions with the Document Object Model (DOM), updating the UI to reflect changes in workouts, such as additions, edits, and deletions.

- **Geolocation**: The class interacts with the geolocation API to retrieve the user's position for initializing the map.

- **Map Integration**: Utilizes Leaflet.js to create an interactive map for visualizing workout locations and details.

- **LocalStorage**: Manages the persistence of workout data using the browser's Local Storage API, ensuring data is saved and retrieved between sessions.

- **Event Handling**: Listens for user actions, such as form submissions, clicks on workouts, and handles them appropriately.

- **Editing Workouts**: Allows users to edit existing workouts, providing a seamless interface for modifying workout details.

- **Deletion of Workouts**: Enables the removal of individual workouts or all workouts at once.

- **Alerts and Modals**: Provides user feedback through alerts and modal dialogs for various actions.

By utilizing the principles of OOP, the `App` class enhances maintainability, extensibility, and readability of the codebase, contributing to a well-organized and structured application architecture.


The OOP approach enhances code organization and readability, making it easier to manage and extend the application in the future.
