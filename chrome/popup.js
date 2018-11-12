// returns the relative path of the icon file
// corresponding to the platform of each post
function icon(platform){

  if(platform=="CODECHEF")          return "img/cc32.jpg";
  else if (platform=="HACKEREARTH") return "img/he32.png";
  else if (platform=="CODEFORCES")  return "img/cf32.png"; 
  else if(platform=="TOPCODER")     return "img/tc32.gif";
  else if(platform=="HACKERRANK")   return "img/hr36.png";
  else if(platform=="GOOGLE")   return "img/google32.png";
  else return "img/other32.png";
}

// converts the input time(which is Indian Standard Time) to
// the browser timezone.
function changeTimezone(date){
  d = new Date(date);
  var offset = -(d.getTimezoneOffset());
  var newDate = new Date(d.getTime() + offset*60000 - 19800000);
  return newDate;
}

// First, the present constest fields are cleared
// Then add contest fields are added by going through the recieved json.
function putdata(json)
{ 
  // removes the previous contest entries.
  $("#upcoming > a").remove();
  $("#ongoing > a").remove();
  $("hr").remove();

  // the conditional statements that compare the start and end time with curTime
  // verifies that each contest gets added to right section regardless of the 
  // section it was present in the "json" variable.
  
  //storing locally for notification purpose
  var FetchedContestURLs = {};

  // for unread Tag
  var localStorageData = localStorage.getItem("FetchedContestURLs");
  if((localStorageData === null) || (localStorageData.length === 0)){ localStorageData = "{}";}
  var prevFetchContestURLs = JSON.parse(localStorageData);
  var notifierTag = false;

  curTime  = new Date();

  $.each(json.result.ongoing , function(i,post){ 
    flag=0;
    if(post.Platform=="HACKEREARTH"){
      if(localStorage.getItem(post.Platform+post.challenge_type)=="false")flag=1;
    }
    
    if(localStorage.getItem(post.Platform)=="true" && flag==0){
      endTime   = Date.parse(post.EndTime);
      timezonePerfectEndTime  = changeTimezone(endTime).toString().slice(0,21);
      e = new Date(endTime);
      
      if(e>curTime){
        humanReadableEndTime = moment(timezonePerfectEndTime).fromNow();

        $("#ongoing").append('<a  data='+'"'+post.url+'"'+'>\
          <li><br><h3>'+post.Name+'</h3>\
          <img title="'+post.Platform+'" src="'+icon(post.Platform)+'"></img><br>\
          <h4>End: '+timezonePerfectEndTime+' ( ' + humanReadableEndTime + ' )</h4><br>\
          </li><hr></a>');
      }
    }
  });

  $.each(json.result.upcoming , function(i,post){ 
    flag=0;
    if(post.Platform=="HACKEREARTH"){
      if(localStorage.getItem(post.Platform+post.challenge_type)=="false")flag=1;
    }

    if(localStorage.getItem(post.Platform)=="true" && flag==0){
      // converts the startTime and Endtime revieved
      // to the format required for the Google Calender link to work
      startTime = Date.parse(post.StartTime)
      timezonePerfectStartTime  = changeTimezone(startTime).toString().slice(0,21);
      endTime   = Date.parse(post.EndTime)
      timezonePerfectEndTime  = changeTimezone(endTime).toString().slice(0,21);
      humanReadableStartTime = moment(timezonePerfectStartTime).fromNow();
      humanReadableEndTime = moment(timezonePerfectEndTime).fromNow();

      s = new Date(changeTimezone(startTime).getTime() - ((curTime).getTimezoneOffset()*60000 )).toISOString().slice(0,19).replace(/-/g,"").replace(/:/g,"");
      e = new Date(changeTimezone(endTime).getTime() - ((curTime).getTimezoneOffset()*60000 )).toISOString().slice(0,19).replace(/-/g,"").replace(/:/g,"");
      
      calendarTime = s+'/'+e
      calendarLink = "https://www.google.com/calendar/render?action=TEMPLATE&text="+encodeURIComponent(post.Name)+"&dates="+calendarTime+"&location="+post.url+"&pli=1&uid=&sf=true&output=xml#eventpage_6"
      
      sT = new Date(startTime);
      eT = new Date(endTime);

      FetchedContestURLs[post.url] = 1;

      if(sT<curTime && eT>curTime){
        $("#ongoing").append('<a  data='+'"'+post.url+'"'+'>\
          <li><br><h3>'+post.Name+'</h3>\
          <img title="'+post.Platform+'" src="'+icon(post.Platform)+'"></img><br>\
          <h4>End: '+timezonePerfectEndTime+' ( ' + humanReadableEndTime + ' )</h4><br>\
          </li><hr></a>');
      }
      else if(sT>curTime && eT>curTime){
        //checking whether new contest has been added or not
        unreadTag = '';
        if(!(post.url in prevFetchContestURLs)){
          unreadTag = '<div class="unread">new</div>';
          notifierTag = true;
        }
        $("#upcoming").append('<div class="unread-bg">' + unreadTag + '<a  data='+'"'+post.url+'"'+'>\
          <li><br><h3>'+post.Name+'</h3>\
          <img title="'+post.Platform+'" src="'+icon(post.Platform)+'"></img><br>\
          <h4>Start: '+timezonePerfectStartTime+' ( ' + humanReadableStartTime + ' )</h4><br>\
          <h4>Duration: '+post.Duration+'</h4><br>\
          <h4 data='+calendarLink+' class="calendar">Add to Calendar</h4>\
          </li><hr></a></div>');
      }
    }
  });

  //saving into local storage
  localStorage.setItem("FetchedContestURLs",JSON.stringify(FetchedContestURLs));
  if(notifierTag){document.getElementById('scroll-info').style.display = "inline";}
  chrome.browserAction.setBadgeText({text: ""}); // We have 0 unread items.
  setTimeout(function(){$("#scroll-info").fadeOut(700);},5000);
}

// sends a request to the backend,on recieving response
// passes the recieved response to putdata()
function fetchdata(){

  imgToggle();
  req =  new XMLHttpRequest();
  req.open("GET",'https://contesttrackerapi.herokuapp.com/',true);
  req.send();
  req.onload = function(){
    res = JSON.parse(req.responseText);

    imgToggle();
    putdata(res);

    // cache creation
    now = (new Date()).getTime()/1000;
    localStorage.cache  = req.responseText;
    localStorage.time = now;
        
  };
  req.onerror = function(){
    imgToggle();
    if(localStorage.cache){
      localData = JSON.parse(localStorage.cache);
      putdata(localData);
    }
  };
}
// Toggles between the loading gif and the reload icon.
function imgToggle(){
  $( ".fa-refresh" ).toggleClass( "fa-spin" );
}

function getVersion() {
  var details = chrome.app.getDetails();
  return details.version;
}

function checkRuntime(){
  
  // Check if the version has changed.
  var currVersion = getVersion();
  var prevVersion = localStorage['version']
  if (currVersion != prevVersion) {
    // Check if we just installed this extension.
    if (typeof prevVersion == 'undefined') {
      chrome.tabs.create({ url: "options.html" });
    } else {
      chrome.tabs.create({ url: "options.html" });
    }
    localStorage['version'] = currVersion;
  }
}

$(document).ready(function(){

  //initializing preference values in care they are not set.
  localStorage.HACKEREARTH = "true";
  if(!localStorage.HACKEREARTHhiring)localStorage.HACKEREARTHhiring = "true";
  if(!localStorage.HACKEREARTHcontest)localStorage.HACKEREARTHcontest = "true";
  if(!localStorage.HACKERRANK)localStorage.HACKERRANK = "true";
  if(!localStorage.CODECHEF)localStorage.CODECHEF = 'true';
  if(!localStorage.CODEFORCES)localStorage.CODEFORCES = 'true';
  if(!localStorage.TOPCODER)localStorage.TOPCODER = 'true';
  if(!localStorage.GOOGLE)localStorage.GOOGLE = 'true';
  if(!localStorage.OTHER)localStorage.OTHER = 'true';
  if(!localStorage.CHECKINTERVAL)localStorage.CHECKINTERVAL = 5;
  
  now = (new Date()).getTime()/1000;
  if(!localStorage.cache || now - parseInt(localStorage.time) > 30*60){
    // cache is old or not set
    fetchdata();
  
  }
  else{
    // cache is fresh
    localData = JSON.parse(localStorage.cache);
    putdata(localData);
    //  restoring the scroll state from the localStorage
    if(localStorage.scrollTop && now - parseInt(localStorage.scrolltime) < 5*60){
      document.body.scrollTop = localStorage.scrollTop;
    }

  }

  counter = 0;
  setInterval(function(){
    counter = counter+1;
    timeIntervalMin = parseInt(localStorage.CHECKINTERVAL);
    if(counter%timeIntervalMin==0) fetchdata();
    else{
      if(localStorage.cache){
        localData = JSON.parse(localStorage.cache);
        putdata(localData);
      }else{
        fetchdata();
      }
    }
  }, 60000);

  checkRuntime();

  // saves the scroll position of the document
  // which can be used to restore the scroll state later on
  addEventListener('scroll', function(){
    localStorage.scrollTop = document.body.scrollTop;
    localStorage.scrolltime = (new Date()).getTime()/1000;
  });


  // opens a new tab with the url given by the
  // data attribute of the "a" tag that was clicked
  $("body").on('click',"a", function(){
    chrome.tabs.create({url: $(this).attr('data')});
    return false;
  });

  // opens a new tab with the url given by the
  // data attribute of the "h4" tag that was clicked
  $("body").on('click',".calendar", function(){
    chrome.tabs.create({url: $(this).attr('data')});
    return false;
  });

  $("body").on('click',".fa-refresh", function(){
    if(!$( ".fa-refresh" ).hasClass( "fa-spin" )) fetchdata();
  });

  $("body").on('click',".fa-gear", function(){
    chrome.tabs.create({ url: "options.html" });
  });

  $("body").on('click',".fa-code", function(){
    chrome.tabs.create({ url: "https://bit.ly/1LUziPN" });
  });

  $("body").on('click',".fa-star", function(){
    chrome.tabs.create({ url: "https://chrome.google.com/webstore/detail/coders-calendar/bageaffklfkikjigoclfgengklfnidll/reviews" });
  });
  
  $("body").on('click',".fa-android", function(){
    chrome.tabs.create({ url: "https://bit.ly/1KqFi3U" });
  });
  
});

