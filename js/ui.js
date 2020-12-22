// cache some selectors we'll be using quite a bit
const $allStoriesList = $("#all-articles-list");
const $submitForm = $("#submit-form");
const $editForm = $("#edit-article-form");
const $filteredArticles = $("#filtered-articles");
const $loginForm = $("#login-form");
const $userProfile = $("#user-profile");
const $createAccountForm = $("#create-account-form");
const $ownStories = $("#my-articles");
const $navLogin = $("#nav-login");
const $navLogOut = $("#nav-logout");
const $navWelcome = $("#nav-welcome");
const $navUser = $("#nav-user");
const $navSubmit = $("#nav-submit");
const $navFavorites = $("#nav-favorites");
const $navMyStories = $("#nav-my-stories");
const $errorAlert = $("#error-alert");

// global storyList variable
let storyList = null;
// global currentUser variable
let currentUser = null;

/* Page initialization */
const initPage = async () => {
  storyList = null;
  currentUser = null;
  await checkIfLoggedIn();
  hideElements();
  $allStoriesList.toggle();
};

/**
 * Event listener for favoriting/unfavoriting a story.
 */
$("body").on("click", ".fa-star", toggleFavorite);

/**
 * Event listener for clicking icon to delete story.
 */
$("body").on("click", ".fa-trash-alt", deleteStory);

/**
 * Event listener for clicking icon to update story.
 */
$("body").on("click", ".fa-edit", showUpdateForm);

/**event handler for the edit story form submit event */
$editForm.on("submit", updateStory);

/**
 * Event listener for signing up.
 *  If successfully we will setup a new user instance
 */

$submitForm.on("submit", submitNewStory);

/**
 * Event listener for logging in.
 *  If successfully we will setup the user instance
 */

$loginForm.on("submit", loginUser);

/**
 * Event listener for signing up.
 *  If successfully we will setup a new user instance
 */

$createAccountForm.on("submit", creatNewUserAccount);

/** this function will either favorite or unfavorite the clicked story for the current user 
     depending if it currentlye exists in the users favorites or not */
async function toggleFavorite(evt) {
  const favoriteIcon = $(evt.target)[0];
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");

  const storyId = $(favoriteIcon.parentElement).attr("id");

  // Get current user
  const currentUser = await User.getLoggedInUser(token, username);
  if (!currentUser) {
    return;
  }
  // If user has story currently as favorite then unfavorite, otherwise favorite the story for the user
  if (currentUser.hasFavorite(storyId)) {
    await currentUser.deleteFavorite(storyId);
    $(favoriteIcon).removeClass("fas");
    $(favoriteIcon).addClass("far");
  } else {
    await currentUser.addFavorite(storyId);
    $(favoriteIcon).removeClass("far");
    $(favoriteIcon).addClass("fas");
  }

  await generateFavoritedStories();
}

/** This function will delete the current story that was created by the current user*/
async function deleteStory(evt) {
  const deleteIcon = $(evt.target)[0];
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");

  const storyId = $(deleteIcon.parentElement).attr("id");
  // get current user
  let currentUser = await User.getLoggedInUser(token, username);
  if (!currentUser) {
    return;
  }

  await currentUser.deleteOwnStory(storyId);

  await generateOwnStories();
}

/**this function will display the story update form having the fields pre-populated with story data values */
async function showUpdateForm(evt) {
  const editIcon = $(evt.target)[0];
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");

  const storyId = $(editIcon.parentElement).attr("id");
  // display update form
  $editForm.slideToggle();
  // get current user
  let currentUser = await User.getLoggedInUser(token, username);
  if (!currentUser) {
    return;
  }
  // get current story data
  const story = await StoryList.getStory(storyId);
  fillEditForm(story);
}

/** this function accepts a story object and fills edit form with the story data */
function fillEditForm(story) {
  //set the storyId as a data attribute on the edit form, to use for the api update
  $editForm.attr("data-storyId", story.storyId);
  // fill the form fields
  $("#edit-author").val(story.author);
  $("#edit-title").val(story.title);
  $("#edit-url").val(story.url);
}

async function updateStory(evt) {
  evt.preventDefault(); // no page refresh

  // check to see if user logged in
  const token = localStorage.getItem("token");
  if (!token) return;

  // grab the required fields
  let storyId = $editForm.attr("data-storyId");
  let author = $("#edit-author").val();
  let title = $("#edit-title").val();
  let url = $("#edit-url").val();

  // call the update method, which calls the API and then update story instance
  const updatedStory = await StoryList.updateStory(token, {
    storyId,
    author,
    title,
    url,
  });
  console.log("Story Updated: ", { ...updatedStory });

  // clear the update form
  $editForm.removeAttr("data-storyId");
  $("#edit-author").val("");
  $("#edit-title").val("");
  $("#edit-url").val("");
  // hide the update form from view
  $editForm.slideToggle();

  await generateStories();
  await generateOwnStories();
}

async function submitNewStory(evt) {
  evt.preventDefault(); // no page refresh

  // check to see if user logged in
  const token = localStorage.getItem("token");

  // grab the required fields
  let author = $("#author").val();
  let title = $("#title").val();
  let url = $("#url").val();

  // call the create method, which calls the API and then builds a new story instance
  const newStory = await StoryList.addStory(token, { author, title, url });
  console.log("New Story Created: ", { ...newStory });

  $("#author").val("");
  $("#title").val("");
  $("#url").val("");

  $submitForm.slideToggle();

  await generateStories();
  await generateOwnStories();
}

async function loginUser(evt) {
  evt.preventDefault(); // no page-refresh on submit

  // grab the username and password
  const username = $("#login-username").val();
  const password = $("#login-password").val();

  try {
    $errorAlert.hide();
    // call the login static method to build a user instance
    const userInstance = await User.login(username, password);
    // set the global user to the user instance
    currentUser = userInstance;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
    // await generateStories();
  } catch {
    const err = new Error("Invalid username/password");
    $errorAlert.html(err.message).show();
  }
}

async function creatNewUserAccount(evt) {
  evt.preventDefault(); // no page refresh

  // grab the required fields
  let name = $("#create-account-name").val();
  let username = $("#create-account-username").val();
  let password = $("#create-account-password").val();

  try {
    $errorAlert.hide();
    // call the create method, which calls the API and then builds a new user instance
    const newUser = await User.create(username, password, name);
    currentUser = newUser;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  } catch {
    const err = new Error("Username already exists");
    $errorAlert.html(err.message).show();
  }
}

/**
 * On page load, checks local storage to see if the user is already logged in.
 * Renders page information accordingly.
 */

async function checkIfLoggedIn() {
  // let's see if we're logged in
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");

  // if there is a token in localStorage, call User.getLoggedInUser
  //  to get an instance of User with the right details
  //  this is designed to run once, on page load
  currentUser = await User.getLoggedInUser(token, username);
  await generateStories();

  // if the user is logged in then initialize user-specific features on navbar and fill profile
  if (currentUser) {
    fillUserProfile(currentUser);
    showNavForLoggedInUser();
  } else {
    // hide the user navbar from view
    $navUser.hide();
  }
}

/**
 * A rendering function to run to reset the forms and hide the login info
 */

function loginAndSubmitForm() {
  // hide the forms for logging in and signing up
  $loginForm.hide();
  $createAccountForm.hide();

  // reset those forms
  $loginForm.trigger("reset");
  $createAccountForm.trigger("reset");

  // show the stories
  $allStoriesList.show();

  checkIfLoggedIn();
  // update the navigation bar
  showNavForLoggedInUser();
}

/**
 * A rendering function to call the StoryList.getStories static method,
 *  which will generate a storyListInstance. Then render it.
 */

async function generateStories() {
  storyList = [];
  // get an instance of StoryList
  const storyListInstance = await StoryList.getStories();
  // update our global variable
  storyList = storyListInstance;
  // empty out that part of the page
  $allStoriesList.empty();
  // get currently logged in user to show if story is favorited or not
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");
  const currentUser = await User.getLoggedInUser(token, username);

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const isFavorite = currentUser
      ? currentUser.hasFavorite(story.storyId)
      : false;
    const result = generateStoryHTML(story, isFavorite, false);
    $allStoriesList.append(result);
  }
}

/**
 * A rendering function which will generate a storyListInstance with the current user's favorited stories. Then render it.
 */

async function generateFavoritedStories() {
  // empty out that part of the page
  $filteredArticles.empty();
  // get currently logged in user to show if story is favorited or not
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");
  const currentUser = await User.getLoggedInUser(token, username);

  // loop through all of our stories and generate HTML for them
  for (let story of currentUser.favorites) {
    const isFavorite = currentUser
      ? currentUser.hasFavorite(story.storyId)
      : false;
    const result = generateStoryHTML(story, isFavorite, false);
    $filteredArticles.append(result);
  }
}

/**
 * A rendering function which will generate a storyListInstance with the current user's own stories. Then render it.
 */

async function generateOwnStories() {
  // empty out that part of the page
  $ownStories.empty();
  // get currently logged in user to show if story is favorited or not
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");
  const currentUser = await User.getLoggedInUser(token, username);

  // loop through all of our stories and generate HTML for them
  for (let story of currentUser.ownStories) {
    const isFavorite = currentUser
      ? currentUser.hasFavorite(story.storyId)
      : false;
    const result = generateStoryHTML(story, isFavorite, true);
    $ownStories.append(result);
  }
}

/**
 * A function to render HTML for an individual Story instance
 */

function generateStoryHTML(story, isFavorite, isOwnStory) {
  let hostName = getHostName(story.url);

  // render story markup
  const storyMarkup = $(`
      <li id="${story.storyId}">
      ${isOwnStory ? '<i class="far fa-edit"></i>' : ""}  
      ${isOwnStory ? '<i class="far fa-trash-alt"></i>' : ""}
        ${
          isFavorite
            ? '<i class="fas fa-star"></i>'
            : '<i class="far fa-star"></i>'
        }
        <a class="article-link" href="${story.url}" target="a_blank">
          <strong>${story.title}</strong>
        </a>
        <small class="article-author ml-0 ml-md-3">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-username ml-0">posted by ${story.username}</small>
      </li>
    `);

  return storyMarkup;
}

/* hide all elements in elementsArr */

function hideElements() {
  const elementsArr = [
    $submitForm,
    $allStoriesList,
    $filteredArticles,
    $ownStories,
    $loginForm,
    $userProfile,
    $createAccountForm,
    $editForm,
  ];
  elementsArr.forEach(($elem) => $elem.hide());
}

/** this function will populate the user info in the profile
      section of the DOM and update the nav bar to display the user name when a user is logged in  */
function fillUserProfile(user) {
  $("#profile-name").html(`Name:  ${user.name}`);
  $("#profile-username").html(`Username:  ${user.username}`);
  $("#profile-account-date").html(`Account Created:  ${user.createdAt}`);
  // update the navbar to display the user name next to the logout button
  fillWelcomeNavButton(user.username);
}

/**this function updates the navbar to display the user name next to the logout button */
function fillWelcomeNavButton(username) {
  $navWelcome.children("a").html(`<b>${username}</bp>`);
}

/** this function shows the navbar controls that should be visible only when a user is logged in */
function showNavForLoggedInUser() {
  $navUser.show();
  $navLogin.hide();
  $navWelcome.show();
  $navLogOut.show();
}

/* simple function to pull the hostname from a URL */

function getHostName(url) {
  let hostName;
  if (url.indexOf("://") > -1) {
    hostName = url.split("/")[2];
  } else {
    hostName = url.split("/")[0];
  }
  if (hostName.slice(0, 4) === "www.") {
    hostName = hostName.slice(4);
  }
  return hostName;
}

/* sync current user information to localStorage */

function syncCurrentUserToLocalStorage() {
  if (currentUser) {
    localStorage.setItem("token", currentUser.loginToken);
    localStorage.setItem("username", currentUser.username);
  }
}

$(initPage());
