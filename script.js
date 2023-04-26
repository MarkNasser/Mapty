'use strict';
// console.log(globalOther);


const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');


class Workout{
    date = new Date();
    id = (Date.now() + '').slice(-10);
    clicks = 0;
    constructor(distance, duration, coords){
        this.distance = distance; // in km
        this.duration = duration; // in min
        this.coords = coords; // [lat, long]
    }
    
    _setDescription(){
        // prettier-ignore
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`
    }
    click(){
        this.clicks++
    }
};

class Running extends Workout{
    type = 'running';
    constructor(distance, duration, coords, cadence){
        super(distance, duration, coords);
        this.cadence = cadence;
        this.calcPace();
        this._setDescription();
    }
    calcPace(){
        // Km/m
        this.pace = this.duration / this.distance
        return this.pace
    }
};

class Cycling extends Workout{
    type = 'cycling';
    constructor(distance, duration, coords, elevation){
        super(distance, duration, coords);
        this.elevation = elevation;
        this.calcSpeed();
        this._setDescription();
    }
    calcSpeed(){
        // Km/h
        this.speed = this.distance / this.duration
        return this.speed;
    }
};


//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////// APLICATION
class App{
    #map;
    #eventMap;
    #workOuts=[];
    #mapZoom=13;
    constructor(){
        //______________current position
        this._getPosition();
        
        //___________load data
        this._getLocalSTorage();
        // ____________listen to submit event
        form.addEventListener('submit',this._newWorkout.bind(this));
        
        // ___________listen to change event
        inputType.addEventListener('change', this._toggleElevationField.bind(this));
        
        //____________listen to event list
        containerWorkouts.addEventListener('click', this._moving.bind(this));
        
    }
    
    _getPosition(){
        // Geolocation  function
        if(navigator.geolocation){
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this),function(){
                alert('could not get your position')
            })
        };
    }
    
    _loadMap(position){
        const {latitude, longitude} = position.coords;
        console.log(`https://www.google.com/maps/@${latitude},${longitude}`)
        
        // using library namespace to current position
        const coords = [latitude, longitude];
        this.#map = L.map('map').setView(coords, this.#mapZoom);
        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);
        
        this.#map.on('click',this._showForm.bind(this));      
        

        //to the local sorage
        this.#workOuts.forEach(obj => {
            // display marker and the custimze popup
            this._renderWorkoutMarker(obj);
        });
    }
    
    _showForm(mapEvent){
        this.#eventMap = mapEvent; 
        form.classList.remove('hidden');
        inputDistance.focus();
    }
    
    
    _toggleElevationField(){
            inputElevation.closest('div').classList.toggle('form__row--hidden');
            inputCadence.closest('div').classList.toggle('form__row--hidden');
        }
    
    _newWorkout(e){
        e.preventDefault();
        //validation function
        const validInputs =(...inputs)=>inputs.every(input=>Number.isFinite(input));
        const validPositive =(...inputs)=>inputs.every(input=>input >0) 
        //get the data from inputs 
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration .value;
        const {lat,lng} = this.#eventMap.latlng;
        let workout;
        //check if it's valed
        
        if(type === 'running'){
            const cadence = +inputCadence .value;
            if(!validInputs(distance, duration, cadence) || !validPositive(distance, duration, cadence)) return alert('input should be a positive number');
            workout = new Running(distance, duration, [lat,lng], cadence);
            this.#workOuts.push(workout);
        }
        if(type === 'cycling'){
            const elevation = +inputElevation.value;
            if(!validInputs(distance, duration, elevation) || !validPositive(distance, duration)) return alert('input should be a positive number')
            workout = new Cycling(distance, duration, [lat,lng], elevation)
            this.#workOuts.push(workout);
        }
        
        //display marker and the custimze popup
        this._renderWorkoutMarker(workout);//no need too use bind in this case because its not callback func we call it ourself and with 'this'itself 
        
        //create a list 
        this._creatLinst(workout);
        
        //hide form + clear input fields
        this._hideForm();
        
        // set local storage to wourkouts
        this._setLocalStorage.apply(this);
    }
    
    _hideForm(){
        inputCadence.value = inputDistance.value = inputDuration.value = inputElevation.value = '';
        form.style.display = 'none';
        form.classList.add('hidden');
        setTimeout(()=>form.style.display='grid',1000);
    }
    
    _renderWorkoutMarker(workout){
        L.marker(workout.coords).addTo(this.#map).bindPopup(L.popup({
        maxWidth:250,
        minWidth:100,
        autoClose:false,
        closeOnClick:false,
        className:`${workout.type}-popup`})).setPopupContent(`${workout.type === 'running'?'🏃‍♂️':'🚴‍♀️'} ${workout.description}`)
        .openPopup();
    }
    
    _creatLinst(workout){
        let html = `<li class="workout workout--${workout.type}" data-id=${workout.id}>
        <h2 class="workout__title">${workout.description} </h2>
        <div class="workout__details">
        <span class="workout__icon">${workout.type === 'running'?'🏃‍♂️':'🚴‍♀️'}</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
        </div>`;
        
        if(workout.type === 'running'){
            html +=`
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
            </li>`
        };
        if(workout.type === 'cycling'){
            html +=`
            <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
            </div>
            <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevation}</span>
            <span class="workout__unit">m</span>
            </div>
            </li>`
        }
        form.insertAdjacentHTML('afterend',html);
    }
    
    _moving(e){
        //matching stratgy
        if(e.target.classList.contains('workouts') || e.target.closest('.form')) return;
        const elemntObj = e.target.closest('.workout');
        const wourkoutObj = this.#workOuts.find(obj => obj.id === elemntObj.dataset.id);
        
        // moving to event posstion
        this.#map.setView(wourkoutObj.coords,  this.#mapZoom);
        
        //using the public interface
        // wourkoutObj.click();
    }
    
    _setLocalStorage(){
        localStorage.setItem('workouts',JSON.stringify(this.#workOuts));
    }
    
    _getLocalSTorage(){
        const arrData = JSON.parse(localStorage.getItem('workouts'))
        if(!arrData)return;
        this.#workOuts = arrData;
        this.#workOuts.forEach(obj => {

            //create a list 
            this._creatLinst(obj);

            // we attached display marker and the custimze popup after the mape loaded
            // this._renderWorkoutMarker(obj);
        });
    }

    reset(){
        localStorage.clear();
        location.reload();
    }
};

const app = new App();
// app._getPosition();//instead of calling it manually we call it automaticaly as soon as this app object created by constructor function










/*
let map, eventMap;
// Geolocation  function
if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(function(position){
        const {latitude, longitude} = position.coords;
        console.log(`https://www.google.com/maps/@${latitude},${longitude}`)
        
        // using library namespace to current position
        const coords = [latitude, longitude];
        map = L.map('map').setView(coords, 13);
        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        //on click event handler
        map.on('click',function onMapClick(mapEvent) {
            eventMap = mapEvent; 
            form.classList.remove('hidden');
       inputDistance.focus();
    });
    
},function(){
    alert('could not get your position')
})
};



// ____________listen to submit event
form.addEventListener('submit',function(e){
    e.preventDefault();
    const type = inputType.value
    const distance = inputDistance.value
    const duration = inputDuration .value
    const cadence = inputCadence .value
    const elevation = inputElevation.value
    console.log(type, distance,duration, cadence,elevation);

//clear input fields
inputCadence.value = inputDistance.value = inputDuration.value = inputElevation.value = '';
//display marker
console.log(eventMap);
const {lat,lng} = eventMap.latlng;
L.marker([lat,lng]).addTo(map)
.bindPopup(L.popup({
    maxWidth:250,
    minWidth:100,
    autoClose:false,
    closeOnClick:false,
    className:'running-popup'}).setPopupContent(`workout`))
    .openPopup();io
})



// ___________listen to change event
inputType.addEventListener('change',function(){
    inputElevation.closest('div').classList.toggle('form__row--hidden');
    inputCadence.closest('div').classList.toggle('form__row--hidden');
});
*/
// const hugeArray = [{firstName:'Mark',lastName:'Boules'},{firstName:'Andrew',lastName:'Boules'}, {firstName:'Nasser',lastName:'Boules'}]
// window.localStorage.setItem('mainArray',hugeArray);











// window.localStorage.setItem('mainArrat',JSON.stringify([{find:1},{find:2}]) );
// localStorage.getItem('mainArrat').push(5);
// console.log(JSON.parse(localStorage.getItem('mainArrat')));

