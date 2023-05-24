//simple cut and past from https://gist.github.com/jaredkotoff/90af44f1533a6a5ea6d43180efddc375
  /*
  It is bad practice and a security violation to store API keys, passwords, or any sensitive information
  in git or github. This also makes your code brittle as you may need to change API keys at some point.
  Deriving your keys from external source, usually though environment variables, not only keeps them safe
  but also lets you change them easily without having make commits and redeploying your code.
  This is an example of one way to keep API keys safe when you don't have a server infrastructure to keep
  them hidden from the public.
  Every user will need to provide their own key and it will be stored locally in that users browser's localStorage.
  This also allows everyone in your group to have their own key and prevent everyone in the group causing
  API rate limits because they were all using one shared key.
  The important bits are
  1. creating global API key variables to hold the API keys. Instead of initializing them in the code.
  2. Immediately calling the loadAPIKeys() function.
  3. If keys already exist in localStorage, then your app will work as if they were hard-coded values.
  The second part to this code is implementing a way to let users add their own keys via the form.
  The form here is made in HTML and hidden once API keys are loaded. You don't have to hide the input form
  and/or can build the form with JavaScript if you prefer instead. You can also adjust for form
  to load more than 2 keys if necessary.
  This isn't a perfect implementation that will work for everyone out-of-the-box.
  You may have to modify this to work with your own code. This is simply an example.
  */

//keys that are storaged locally on user's localstorage. will be get when onload
  var API_KEY_1 = '';
  var API_KEY_2 = '';
  var API_KEYS_MAP = {
    API_KEY_1: 'API Ninja',
    API_KEY_2: 'Spoonacular'
  }

  var apiKeysForm =  document.getElementById('api-key-form');
  var apiKeyInput1 = document.getElementById('api-key-1');
  var apiKeyInput2 = document.getElementById('api-key-2');

  // Loads API keys from localStorage
  //   If they keys exist, then the form is hidden
  function loadAPIKeys() {
    API_KEY_1 = localStorage.getItem(API_KEYS_MAP.API_KEY_1) || '';
    API_KEY_2 = localStorage.getItem(API_KEYS_MAP.API_KEY_2) || '';

    // require both api keys before hiding the fields
    if (!API_KEY_1 || !API_KEY_2) {
      apiKeyInput1.value = API_KEY_1;
      apiKeyInput2.value = API_KEY_2;
      apiKeysForm.addEventListener('submit', handleFormSubmit);
      apiKeysForm.style.display = 'flex';
    } else {
      apiKeyInput1.value = '';
      apiKeyInput2.value = '';
      apiKeysForm.removeEventListener('submit', handleFormSubmit);
      apiKeysForm.style.display = 'none';
    }
  }

  // Saves the API keys to localStorage and then load them into the app
  function saveAPIKeys(apiKey1, apiKey2) {
    localStorage.setItem(API_KEYS_MAP.API_KEY_1, apiKey1);
    localStorage.setItem(API_KEYS_MAP.API_KEY_2, apiKey2);
    loadAPIKeys();
  }

  // When the form is submitted, save the keys to localStorage
  function handleFormSubmit(event) {
    event.preventDefault();
    var apiKey1 = apiKeyInput1.value.trim();
    var apiKey2 = apiKeyInput2.value.trim();
    saveAPIKeys(apiKey1,apiKey2);
  }

//start of MealMatch js codes

//Recipe Request Page DOM
const searchBtn = document.querySelector("#search");
const saveBtn = document.querySelector("#save");
const nextBtn = document.querySelector("#next");
const resultContainer = document.querySelector("#result-container");
const recipeNavBtns = document.querySelector("#btn-row");
const saveApiKeyBtn = document.getElementById("saveApiKeyBtn");
const apiModal = document.getElementById("apiModal");
const modalOverlay = document.getElementById("modalOverlay");
//API URLs
const fetchhRecipesURL = `https://api.spoonacular.com/recipes/complexSearch`;
const fetchCaloriesBurnt = `https://api.api-ninjas.com/v1/caloriesburnedactivities`;
const fetchExercises = `https://api.api-ninjas.com/v1/exercises?`;

//Global Var

 
//all the recipes searched in current browser session(page refresh will wipe this!)
var searchedRecipes = [];
//an idex to know which recipe is the user seeing now in current session
var currentRecipesIndex = 0;
var currentRecipeID = 0;

//------------------Locate Storage functions(https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)


//----------------DOM functions and eventlistener functions-------------------------------------------
function getCuisineInput() {
  const cuisineSelect = document.getElementById("cuisine-select");
  const cuisine = cuisineSelect.value;
  return cuisine;
}

//on page load, hide the result dive and button row at the bottom.
//check localstorage for stored API key, if no keys found, open modal and get user's input
//when user hit the saveApiKey button, it then store the key to local storage

document.addEventListener("DOMContentLoaded", function () 
{
  
    
  if (document.title === "MealMatch")
  {
    //runs API script only on index.html
    loadAPIKeys();
    // Hide the bottom section initially
    resultContainer.classList.add("hide");
    recipeNavBtns.classList.add("hide");

    // Clear the searched recipes from localStorage from old session
    localStorage.removeItem("recipes");

    //search button event listener onclick
    searchBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      const cuisine = getCuisineInput();
      const newRecipe = await fetchRecipe(cuisine);
      await sportSearch();
      computeDuration(newRecipe);
      displayArecipe(newRecipe);
      sportDisplayAll();
      // Remove the "hide" class from the bottom section container element
      resultContainer.classList.remove("hide");
      recipeNavBtns.classList.remove("hide");
    });
    //next button event listener
    nextBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      const cuisine = getCuisineInput();
      const newRecipe = await fetchRecipe(cuisine);
      await sportSearch();
      computeDuration(newRecipe);
      displayArecipe(newRecipe);
      sportDisplayAll();
    });

        
  }
  else if (document.title ==="Recipe Details") //for Recripe Detail page use
  {
    //Grab the Parms url
    const urlParams = new URLSearchParams(window.location.search);
    //get the id behind the q in the url
    var id = urlParams.get("q");
    //passing in the id to the get recipe from localStorage fucntion 
    //that return a recipe object
    var recipe = getLocalRecipesDataByID(id);
    //pass in the returned recipe and call the display function out to the
    //recipe detail page
    displayRecipeDetails(recipe);
 
  }


});

//------------------------Recipes Related functions below-----------------------------------------------

//------------Fetch a Recripe from API------------------------

//Pass in cuisine(String) and return a "repackaged" recipe


async function fetchRecipe(cuisine) {
  const apiUrl = `https://api.spoonacular.com/recipes/complexSearch?apiKey=${API_KEY_2}&cuisine=${cuisine}&sort=random&number=1&addRecipeNutrition=true&fillIngredients=true`;

  const apiFetch = await (await fetch(apiUrl)).json();

  const recipeObj = apiFetch.results[0]; //recipe object

  //things that are under the recipeData.results[0] from response
  const recipeID = recipeObj.id;
  const recipeImgUrl = recipeObj.image;
  const summary = recipeObj.summary;
  const readyInMinutes = recipeObj.readyInMinutes;
  const title = recipeObj.title;
  const vegan = recipeObj.vegan;
  const ingredients = recipeObj.extendedIngredients;
  const cookingSteps = recipeObj.analyzedInstructions[0].steps;

  //things that is under the butrients array
  const nutrients = recipeObj.nutrition.nutrients; //"nutrients array of objects"
  const calories = nutrients.find((item) => item.name === "Calories").amount;
  const dishType = recipeObj.dishTypes; //return the first type only

  // repackage all the recipe data that we need into a new obj
  const recipeOutput = {
    cuisine: cuisine,
    calories: calories, //int
    ingredients: ingredients, //array of obj
    summary: summary, //string
    recipeID: recipeID, //int
    imgURL: recipeImgUrl,
    min: readyInMinutes, //int
    title: title, //string
    vegan: vegan, //boolean
    cookingSteps: cookingSteps, //array of obj
    dishType: dishType, //obj
  };

  //push current recipe into var
  searchedRecipes.push(recipeOutput);
  currentRecipeID = recipeID;

  setLocalRecipesData(recipeOutput);

  //return the repackaged recipeData contain only data that we need
  return recipeOutput;
}
//------------->logic/compute------------------------------

//----------------->Set to localStorage---------------------------

//SET (one) recipe JOSON to localStorage
function setLocalRecipesData(recipe) { 
  //check to see if anything storaged locally
  const localData = getLocalRecipesData();
  //getting the passing in obj's (recipe) ID
  const recipeID = recipe.recipeID;
  
  //check with the passing in recipe is a new recipe before pushing it and storage to local
  const isRecipesUnique = localData.every((item) => item.recipeID !== recipeID);

  if (isRecipesUnique) {
    localData.push(recipe);
    localStorage.setItem("recipes", JSON.stringify(localData));
  }
}

//------------------------Get saved recipes from local storage--------------

//GET (one) recipe, return (one) recipe JOSON from localStorage
function getLocalRecipesData() {
  const savedRecipes = JSON.parse(localStorage.getItem("recipes")) || [];
  return savedRecipes;
}
//get recipe by ID function

function getLocalRecipesDataByID(recipeID) {
  const savedRecipes = JSON.parse(localStorage.getItem("recipes"));
  const returnRecipe = savedRecipes.find(
    (recipe) => recipe.recipeID == recipeID
  );
  return returnRecipe;
}
//------------------>display to UI-------------------------------
//display function for index.html page below
function displayArecipe(recipe) {
  // Get the elements that need to be updated
  const recipeImgEl = document.querySelector("#recipeImg");
  const recipeTitleEl = document.querySelector("#recipeTitleEl");
  const caloriesEl = document.querySelector("#calories");
  const recripeSummary = document.querySelector("#summary");
  const redirectURL = document.querySelector("#redirectURL");
  
  // Update the elements with the recipe details
  recipeImgEl.src = recipe.imgURL;
  recipeTitleEl.textContent = recipe.title;
  caloriesEl.textContent = `Calories: ${recipe.calories}`;
  recripeSummary.innerHTML = `${recipe.summary}`;
  const urlLink = `recipeDetails.html?q=${recipe.recipeID}`;
  redirectURL.setAttribute('href', urlLink);
  redirectURL.setAttribute('target', '_blank');
}

//fucntion to display recripe detils to recipeDetail.html page
function displayRecipeDetails(recipe) {
  // Get the elements that need to be updated
  if (document.title === "Recipe Details") 
  {
    var stepsUL = document.querySelector("#steps");
    var foodImg = document.querySelector("#recipe-image");
    var ingredientsUL = document.querySelector("#ingredientsUL");
    const titleEl = document.querySelector("#recipe-title");
    
    // Update the elements with the recipe details
    foodImg.src = recipe.imgURL;
    titleEl.textContent = recipe.title;
    
    //loop through the array of step objs
    for (var i = 0; i < recipe.cookingSteps.length; i++) {
      var li = document.createElement("li");
      li.textContent = recipe.cookingSteps[i].step;
      stepsUL.appendChild(li);
    }
    //loop through the array of ing objs
    for (var i = 0; i < recipe.ingredients.length; i++) {
      
      var li = document.createElement("li");
      li.textContent = recipe.ingredients[i].original;
      ingredientsUL.appendChild(li);
    }
  }
}

//========================================================================================================
//------------------------Activities Related functions below-----------------------------------------------

//Sports area DOM
const walk = document.querySelector("#walk");
const walkCalories = document.querySelector("#walkCalories");
const walkDuration = document.querySelector("#walkDuration");
const run = document.querySelector("#run");
const runCalories = document.querySelector("#runCalories");
const runDuration = document.querySelector("#runDuration");
const bike = document.querySelector("#bike");
const bikeCalories = document.querySelector("#bikeCalories");
const bikeDuration = document.querySelector("#bikeDuration");
const swim = document.querySelector("#swim");
const swimCalories = document.querySelector("#swimCalories");
const swimDuration = document.querySelector("#swimDuration");
const displaySportCaloriesLoop = [walkCalories, runCalories, bikeCalories, swimCalories];
const displaySportDurationLoop = [walkDuration, runDuration, bikeDuration, swimDuration];





//list of variables
let saveCurrentSport = []; //stores info from API call.
// var sampleMenuCalories = 1200;  //sample var used for testing sports code. will be replaced with actual food calories. 
const sportSet = ["3.0 mph", "6.7 mph", "12-13.9 mph", "treading water, m"]
let sportInfoCurrent = []; // sports data gets stored here.
let sportDuration = []; //computed duration gets stored here.
let sportDurationCurrent = [];  //array of collected durations
let sportInfoPackage = []; //array of sports information to be sent to local storage for use in recipeDetails page.


//----------->Get Sport Data-------------------------------------

//search sportSet variable content in order.
async function sportSearch(){
  if (sportInfoCurrent === undefined || sportInfoCurrent.length == 0) {
  //sportInfoCurrent = [];
  for (var i = 0; i < sportSet.length; i++) {
let searchNinjaUrl = "https://api.api-ninjas.com/v1/caloriesburned?activity=" + sportSet[i];
await fetch(searchNinjaUrl,
{headers: { 'X-Api-Key': API_KEY_1},})
.then(function (response) {
  if (!response.ok) {
    throw response.json();
  }

  return response.json();
})
.then(function (data) {
  if (data == "") {
    
    return;  //ends function early for bad search input.
  }

  sportInfoCurrent.push(data);

})
.catch(function (error) {
  
  notFound.textContent = "searchNinjaUrl_error";
});

}
if (i === sportSet.length){
  return;
}
}
else {
  return;
}
}

//------------------------>set------------------------------

//note: currently unused
//prepares sport information set. waiting to be stored into local storage to be used in recipeDetails page.
// async function sportInfoPackagePrep() {
//   sportInfoPackage = [];
//   for (let i = 0; i < sportSet.length; i++) {
//     let set = [sportInfoCurrent[i][0], {duration: sportDurationCurrent[i]}]
//     sportInfoPackage.push(set);
//   }
//   if (i === sportSet.length){    
//     return;
//   }}

// save to local storage. 
// let mainPackage = [];
// function storeIndexInfo() {
//   mainPackage.push(sportInfoPackage);  //adds sport information package at end of mainPackage
//   localStorage.setItem("MealMatchIndex", JSON.stringify(mainPackage));
//   };

//------------------->compute-------------------------------

//get duration of sport in minutes to match menu calories
async function computeDuration(recipe) {
  
  sportDurationCurrent = [];
  sportDuration = [];
  for (let i = 0; i < sportInfoCurrent.length; i++) { 
    let sportCalories = sportInfoCurrent[i][0].calories_per_hour;
  sportDuration = recipe.calories / sportCalories;
  sportDurationCurrent.push(sportDuration);
}
}

//------------------->display-------------------------------

async function sportDisplayCalories() {
  for (let i = 0; i < displaySportCaloriesLoop.length; i++) { 
    displaySportCaloriesLoop[i].textContent = "Calories: \n " + sportInfoCurrent[i][0].calories_per_hour +"/hour";
  }
}

async function sportDisplayDuration() {
  for (let i = 0; i < displaySportDurationLoop.length; i++) { 
    if (sportDurationCurrent[i] >= 1){
      displaySportDurationLoop[i].textContent = "Duration: \n " + sportDurationCurrent[i].toFixed(1)+ " hours";
    }
    else {
      let sportDurationMin = sportDurationCurrent[i] * 60
      displaySportDurationLoop[i].textContent = "Duration: \n " + sportDurationMin.toFixed()+ " minutes";
    }
}
}

// bundled display functions for sports
function sportDisplayAll(){
  sportDisplayCalories();
  sportDisplayDuration();
}