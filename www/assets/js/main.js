"use strict";
var currentDate = new Date(),
    today =  new Date(),
    inPast = false,
    currentModel;

// initialize Hoodie
var hoodie  = new Hoodie();

// start appcache
hoodie.appCache.start();

// bind main buttons
var buttonIds = [
  "#workout",
  "#abs",
  "#vegetable"
];
buttonIds.forEach(function(id){
  $(id).on('click', function(){
    $(this).toggleClass('clicked');
    if (currentModel[id.slice(1,id.length)]){
      currentModel[id.slice(1,id.length)] = false;
    }else{
      currentModel[id.slice(1,id.length)] = true;
    }
    hoodie.store.update('tracker',currentModel.id,currentModel);
  });
});



/*********************
 * Utility functions *
 *********************/

var updateDate = function updateDate(d){
  $('#date').text([monthHash[d.getMonth()],d.getDate()].join(" "));
  if (today.getDate() - d.getDate() === 0){
    inPast = false;
    $('#forwardButton').animate({'opacity':0},300);
  }else{
    inPast = true;
    $('#forwardButton').animate({'opacity':1},300);
  }

  getCurrentModel(currentDate);
}

var updateUIstate = function updateUIstate(){
  buttonIds.forEach(function(id){
    $(id).removeClass('clicked');
    if (currentModel[id.slice(1,id.length)]){
      $(id).addClass('clicked');
    }
  });
}

/***************
 * data model  *
 ***************/

var getCurrentModel = function getCurrentModel(date) {

  var modelId = [date.getMonth(),date.getDate(),date.getFullYear()].join(''),
      modelPrototype = {id: modelId, workout:false,abs:false,vegetable:false};

  hoodie.store.find('tracker',modelId)
    .done(function(model){
      currentModel = model;
      updateUIstate();
    })
    .fail(function(){
      console.log("failed to find today's model. Adding it now");
      hoodie.store.add('tracker', modelPrototype)
        .done(function(model){
          console.log('stored model');
          currentModel = model;
          updateUIstate();
        })
        .fail(function(e){
          console.log('failed to store model');
          console.log(e);
        });
    });

}

getCurrentModel(currentDate);

// bind date buttons

$('#forwardButton').css('opacity',0);
var monthHash = {
  0: 'January',
  1: 'February',
  2: 'March',
  3: 'April',
  4: 'May',
  5: 'June',
  6: 'July',
  7: 'August',
  8: 'September',
  9: 'October',
  10: 'November',
  11: 'December'
}

$('#backButton').on('click',function(){
  currentDate.setDate(currentDate.getDate()-1);
  updateDate(currentDate);
});

$('#forwardButton').on('click',function(){
  if (inPast){
    currentDate.setDate(currentDate.getDate()+1);
    updateDate(currentDate);
  }
});



$('#date').on('click',function(){
  currentDate.setDate(today.getDate());
  updateDate(today);
});



updateDate(currentDate);



/*********************
 * signIn and signUp *
 *********************/
$('#signInForm').hide();
$('#mainContainer').hide();
if (hoodie.account.username) {
  // user is signed in
  console.log(hoodie.account.username);
  $('#signInForm').hide();
  $('#mainContainer').show();
  $('#mainContainer').animate({opacity:1},600);
} else {
  // user is anonymous
  console.log('You are not logged in!');
  $('#signInForm').show();
  $('#signInForm').animate({opacity:1},600);
  $('#mainContainer').hide();
}

$('#signInForm').submit(function (event) {
  event.preventDefault();
  var username = $('#username').val().toLowerCase();
  var password = $('#password').val().toLowerCase();
  hoodie.account.signIn(username, password)
    .done(function(){
      console.log('login succeeded');
      $('#signInForm').hide();
      $('#mainContainer').show();
      $('#mainContainer').animate({opacity:1},600);
    })
    .fail(function(){
      console.log('failed login, attempting to create account');
      hoodie.account.signUp(username, password)
      .done(function(){
        $('#signInForm').hide();
        $('#mainContainer').show();
        $('#mainContainer').animate({opacity:1},600);
        console.log('created account');
      })
      .fail(function(){
        console.log('failed to create account');
      });
    });
});

/***********************
 * Handle swipe events *
 ***********************/
var directionLock = false,
    panned = false,
    pct,
    direction;


$('body').css('height',window.innerHeight);
var hammerElement = document.getElementsByTagName('body')[0];
var hammertime = new Hammer(hammerElement, {threshold: 100});
hammertime.on('pan', function(ev) {
    panned = true;
    if (!directionLock){
      direction = ev.direction;
      directionLock = true;
    }

    if (direction === 4){
      pct = ev.distance / window.innerWidth * 100;
      if (ev.deltaX > 0){
        var workoutLeft = 'calc(50% + ' + pct/2 + '% - 64px)';
        $('#workout').css('left',workoutLeft);
        $('#workout').css('opacity',1 - pct*3 / 100);

        var absLeft = 'calc(50% + ' + pct/3 + '% - 64px)';
        $('#abs').css('left',absLeft);
        $('#abs').css('opacity',1 - pct*2 / 100);

        var vegetableLeft = 'calc(50% + ' + pct/4 + '% - 64px)';
        $('#vegetable').css('left',vegetableLeft);
        $('#vegetable').css('opacity',1 - pct / 100);
      }
    }

    if (direction === 2){
      pct = ev.distance / window.innerWidth * 100;
      if (ev.deltaX < 0){
        var workoutLeft = 'calc(50% - ' + pct/2 + '% - 64px)';
        $('#workout').css('left',workoutLeft);
        $('#workout').css('opacity',1 - pct*3 / 100);

        var absLeft = 'calc(50% - ' + pct/3 + '% - 64px)';
        $('#abs').css('left',absLeft);
        $('#abs').css('opacity',1 - pct*2 / 100);

        var vegetableLeft = 'calc(50% - ' + pct/4 + '% - 64px)';
        $('#vegetable').css('left',vegetableLeft);
        $('#vegetable').css('opacity',1 - pct / 100);
      }
    }
});

$('body').bind('touchend',function(){
  if (panned){
    panned = false;
    directionLock = false;
    var left = (window.innerWidth / 2 - 90 )/ window.innerWidth * 100 + '%';

    if (direction === 2 && pct >= 50 && inPast){

      $('#workout').animate({'left': left, opacity: 0},1);
      $('#abs').animate({'left': left, opacity: 0},1);
      $('#vegetable').animate({'left': left, opacity: 0},1);
      setTimeout(function(){
        $('#workout').animate({opacity: 1},300);
        $('#abs').animate({opacity: 1},300);
        $('#vegetable').animate({opacity: 1},300);
      },300);

      currentDate.setDate(currentDate.getDate() + 1);
      updateDate(currentDate);

    }else if (direction === 4 && pct >= 50){
      $('#workout').animate({'left': left, opacity: 0},1);
      $('#abs').animate({'left': left, opacity: 0},1);
      $('#vegetable').animate({'left': left, opacity: 0},1);
      setTimeout(function(){
        $('#workout').animate({opacity: 1},300);
        $('#abs').animate({opacity: 1},300);
        $('#vegetable').animate({opacity: 1},300);
      },300);

      currentDate.setDate(currentDate.getDate() - 1);
      updateDate(currentDate);
    }else if (pct >= 10){
      $('#workout').animate({'left': left, opacity: 1},300);
      $('#abs').animate({'left': left, opacity: 1},300);
      $('#vegetable').animate({'left': left, opacity: 1},300);
    }
  }
});
