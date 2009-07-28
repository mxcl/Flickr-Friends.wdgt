function $(name)
{
    return document.getElementById(name);
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

function jsonFlickrApi(json)
{
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
    last_fetch = new Date().getTime();
    
    var url = 'http://api.flickr.com/services/rest/?method=flickr.photos.getContactsPublicPhotos&format=json&api_key=2c4f0eb3f21b15c9cbae940f22a98d57&user_id=73643601@N00&just_friends=1&extras=date_taken';
    
    // if this is the first time, get 50 photos
    if (photos.length == 0)
        url += '&count=50';
    
    var script = document.createElement("script");
    script.setAttribute("src", url);
    script.setAttribute("type", "text/javascript");
    document.body.appendChild(script);
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
