function $(name)
{
    return document.getElementById(name);
}

function json(method, other_params)
{
    var url = "http://api.flickr.com/services/rest/?method="+method+"&format=json&api_key=2c4f0eb3f21b15c9cbae940f22a98d57&"+other_params;
    var script = document.createElement("script");
    script.setAttribute("src", url);
    script.setAttribute("type", "text/javascript");
    document.body.appendChild(script);
}

var photos = [];
var timer = null;
var fetch_timer = null;
var ii = 0;
var last_fetch = 0;

function start_timers()
{
    if (timer == null) {
        timer = setInterval('set_new_photo();', 10*1000);
        fetch_timer = setInterval('fetch()', 30*60*1000);
    }
}

function got_photo(p)
{
    for (var i = 0; i < photos.length; i++) {
        // not sure how unique this is
        if (p.id == photos[i].id)
            return true;
    }
    return false;
}

function findByUsername(json)
{
    if (json.stat == "fail")
        $('title').innerText = json.message;
    else {
        if (window.widget)
            widget.setPreferenceForKey(json.user.nsid, "UserId");
        photos.length = 0;
        fetch();
    }
}

function jsonFlickrApi(json)
{
    if (json.stat == "fail") {
        $('title').innerText = json.message;
        return;
    }

    var was_first_time = photos.length == 0;
    
    for (var i = 0; i < json.photos.photo.length; i++) {
        var p = json.photos.photo[i];
        if (!got_photo(p)) {
            // we prepend as they come in reverse date order
            photos.unshift(p);
        }
    }

    if (photos.length > 50)
        photos.length = 50;
    
    start_timers();
    if (was_first_time)
        set_new_photo();
}

function image_url(p)
{
    return 'http://farm'+p.farm+'.static.flickr.com/'+p.server+'/'+p.id+'_'+p.secret+'_m.jpg';
}

function set_new_photo()
{
    if (photos.length == 0)
        return;
    if (ii > photos.length)
        ii = 0;

    var p = photos[ii++];
    $('image').src = image_url(p);
    $('title').innerHTML = p.title;
    $('title').href = "javascript:window.widget.openURL('http://www.flickr.com/photos/"+p.owner+'/'+p.id+"');return false;";
    $('owner').innerHTML = ' '+p.username.replace(' ', '&nbsp;');
    $('date').innerText = p.datetaken;

    // preload next image
    img = new Image();
    img.src=image_url(photos[ii]);
}

function fetch()
{
    var uid = window.widget.preferenceForKey("UserId");
    if (!uid || uid.length <= 0) return;
    
    last_fetch = new Date().getTime();
    
    var params = 'user_id='+uid+'&just_friends=1&extras=date_taken';
    
    // if this is the first time, get 50 photos
    if (photos.length == 0)
        params += '&count=50';
    
    json("flickr.photos.getContactsPublicPhotos", params);
}

function show()
{
    if (new Date().getTime()-last_fetch > 30*60 || photos.length == 0) {
        fetch();
    } else {
        start_timers();
    }
}

function hide()
{
    if (timer != null) {
        clearInterval(timer);
        clearInterval(fetch_timer);
        timer = null;
        fetch_timer = null;
    }
}

if (window.widget) {
    widget.onshow = show;
    widget.onhide = hide;
}


function setup()
{
    new AppleGlassButton($("donebutton"), "Done", hidePrefs);
    new AppleInfoButton($("infobutton"), $("polaroid"), "black", "black", showPrefs);
}

function showPrefs()
{
    if (window.widget) {
        widget.prepareForTransition("ToBack");
        var username = widget.preferenceForKey("Username");
        if (username) $('username').value = username;
    }
 
    $('polaroid').style.display="none";
    $('back').style.display="block";
 
    if (window.widget)
        setTimeout('widget.performTransition();', 0);
}

function hidePrefs()
{
    var username = $('username').value;
    if (username && username.length > 0 && username != window.widget.preferenceForKey("Username")) {
        widget.setPreferenceForKey(username, "Username");
        json("flickr.people.findByUsername", "jsoncallback=findByUsername&username="+username);
    }
    widget.prepareForTransition("ToFront");

    $('back').style.display="none";
    $('polaroid').style.display="block";
 
    if (window.widget)
        setTimeout('widget.performTransition();', 0);
}