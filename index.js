const express = require('express');

let app = express(); 

let path = require('path');

const port = process.env.PORT || 3000; //AWS port info

app.set('view engine', 'ejs'); //use ejs for views

app.use(express.urlencoded({ extended: true })); //use templates

app.use(express.static(path.join(__dirname + '/public'))); //able to use assets

//database info
const knex = require("knex")({
  client: "pg",
  connection: {
    host: "localhost",
    user: process.env.RDS_USERNAME || "postgres",
    password: process.env.RDS_PASSWORD || "Id0n'ttakeLs",
    database: process.env.RDS_DB_NAME || "SocialMediaHealth",
    port: process.env.RDS_PORT || 5432,
    ssl: process.env.DB_SSL ? {rejectUnauthorized: false} : false
  }
});

//get home page
app.get('/', (req, res) => {
    res.render('index');
});

//get login page
app.get('/login', (req, res) => {
  res.render('login');
});

//display records after logging in
app.post('/displayRecords', (req, res) => {
  knex
  .select()
  .from("SurveyResponses")
  .then((SurveyResponses) => {
    res.render('displayRecords', { surveyentry: SurveyResponses });
  })
});

//get home page
app.get('/survey', (req, res) => {
  res.render('survey');
});

//get create new user homepage
app.get("/addUser", (req, res) => {
  res.render("addUser");
});

//route to make a new user
app.post("/addUser", (req, res) => {
  knex("authentication")
    .insert({
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      username: req.body.username,
      password: req.body.password
    })
    .then((newUser) => {
      res.redirect("/login");
    });
});

//get todays date
function getTodayDate() {
  return new Date();
};

//get current time
function getCurrentTime() {
  const currentDate = new Date();

  // Get hours, minutes, and seconds
  const hours = currentDate.getHours().toString().padStart(2, '0');
  const minutes = currentDate.getMinutes().toString().padStart(2, '0');
  const seconds = currentDate.getSeconds().toString().padStart(2, '0');

  // Format as HH:MM:SS
  const timestamp = `${hours}:${minutes}:${seconds}`;

  return timestamp;
}

//submit new survey data
app.post('/submit_survey', async (req, res) => {
  const [SurveyID] = await knex('SurveyResponses')
  .returning('SurveyID')
  .insert({
    Date: getTodayDate(),
    Time: getCurrentTime(),
    Age: req.body.age,
    Gender: req.body.gender,
    RelationshipStatus: req.body.relationship,
    OccupationStatus: req.body.occupation,
    UsesSocialMedia: req.body.use_social_media,
    AvgDailyHoursOnSocialMedia: req.body.hours_on_social_media,
    RatingUsingSocialMediaWithoutPurpose: req.body.rating_9,
    RatingGettingDistractedBySocialMediaWhenBusy: req.body.rating_10,
    RatingRestlessWithoutSocialMedia: req.body.rating_11,
    RatingEasilyDistracted: req.body.rating_12,
    RatingBotheredByWorries: req.body.rating_13,
    RatingDifficultyConcentrating: req.body.rating_14,
    RatingComparesToOtherSuccessfulPeople: req.body.rating_15,
    RatingFeelingsAboutComparisons: req.body.rating_16,
    RatingSeekValidationFromSocialMedia: req.body.rating_17,
    RatingDepression: req.body.rating_18,
    RatingInterestFluctuation: req.body.rating_19,
    RatingSleepIssues: req.body.rating_20,
    Location: 'Provo'
  });

  //redirect to the home page after submission
  res.redirect('/thankyou');

  //gather Organization types in an array
  const checkboxValuesAff = [];

  //loop through options on array values and add them in
  for (let iCount = 1; iCount <= 5; iCount++)
  {
    const name = `aff${iCount}`;
    if (req.body[name])
    {
      checkboxValuesAff.push(req.body[name]);
    };
  };

  //push through all array values matched with survey id into database
  await Promise.all(checkboxValuesAff.map(async (OrganizationAffiliateTypeNum) => {
    await knex('OrganizationEntry').insert({
      SurveyID: SurveyID.SurveyID,
      OrganizationAffiliateTypeNum: OrganizationAffiliateTypeNum
    });
  }));

  //gather social media types in an array
  const checkboxValuesSM = [];

  //loop through options on array values
  for (let iCount = 1; iCount <= 9; iCount++)
  {
    const name = `sm${iCount}`;
    if (req.body[name])
    {
      checkboxValuesSM.push(req.body[name]);
    };
  };

  //push through all array values matched with survey id into database
  await Promise.all(checkboxValuesSM.map(async (SocialMediaTypeNum) => {
    await knex('SocialMediaEntry').insert({
      SurveyID: SurveyID.SurveyID,
      SocialMediaTypeNum: SocialMediaTypeNum
    });
  }));
});

// display page to edit current user data
app.get("/displayUser", (req, res)=> {
  knex.select().from("authentication").then(authentication => {
    res.render("displayUser", {myAuthentication: authentication});
 })
})

//display users on admin page
app.post('/displayUser', (req, res) => {
  knex
  .select()
  .from("authentication")
  .then((authentication) => {
    res.render('displayUser', { myAuthentication: authentication });
  })
});



//explain route from displayUser FORM ACTION
app.get("/editUser/:id", (req, res)=> {
   knex
    .select(
      "User_ID",
      "first_name",
      "last_name",
      "username",
      "password"
    )
    .from("authentication")
    .where("User_ID", req.params.id)
    .then((authentication) => {
      res.render("editUser", { myAuthentication: authentication });
  })
  .catch( err => {
     console.log(err);
     res.status(500).json({err});
  });
});

//edit individual user from database
app.post("/editUser", (req, res)=> {
  knex("authentication")
    .where("User_ID", parseInt(req.body.User_ID))
    .update({
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      username: req.body.username,
      password: req.body.password
 })
  .then((myAuthentication) => {
    res.redirect("/displayUser");
 });
});

//delete individual user from database
app.post("/deleteUser/:id", (req, res) => {
  knex("authentication").where("User_ID",req.params.id).del().then( myAuthentication => {
    res.redirect("/displayUser");
  }).catch( err => {
    console.log(err);
    res.status(500).json({err});
  });
});

app.get('/thankyou', (req, res) => {
  res.render('thankyou');
});

//listener
app.listen(port, () => console.log('SMUMH is listening'));