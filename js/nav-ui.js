/**
 * Event Handler for Clicking Login
 */

$navLogin.on("click", async function () {
  // in case user opened submit form and then clicked the login/create user button, hide submit form
  $submitForm.hide();

  // Show the Login and Create Account Forms
  $loginForm.slideToggle();
  $createAccountForm.slideToggle();

  $allStoriesList.hide();
});

/**
 * Event handler for Navigation to Homepage
 */

$("body").on("click", "#nav-all", async function () {
  hideElements();
  await generateStories();
  $allStoriesList.show();
});

/**
 * Event handler for Navigation to Submit new story
 */

$navSubmit.on("click", () => {
  hideElements();
  // show submit form above the stories
  $submitForm.slideToggle();
  $allStoriesList.show();
});

/**
 * Event handler for Navigation to Favorites
 */
$navFavorites.on("click", async () => {
  hideElements();
  await generateFavoritedStories();
  $filteredArticles.show();
});

/**
 * Event handler for Navigation to Users Own Stories List
 */
$navMyStories.on("click", async () => {
  hideElements();
  await generateOwnStories();
  $ownStories.show();
});

/**
 * Event handler for Navigation to User Profile
 */
$navWelcome.on("click", function () {
  hideElements();

  $userProfile.show();
});

/**
 * Log Out Functionality
 */

$navLogOut.on("click", function () {
  // empty out local storage
  localStorage.clear();
  // refresh the page, clearing memory
  location.reload();
});
