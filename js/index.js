/*
A simple program that takes a Google Sheet with config settings

Load filtered worksheets (for questions and responses) and creates a multi-page quiz.

Each question shows question text and an image next to an interactive map allowing the participant to click where on the map they think the picture was taken.


Steps:
1. Load config


*/
//keep track of map instances
var maps={}
var posts=[]
var data_post_url
$( function() {

   load_config("config.json")

});

load_config= function(url){
    $.ajax({
        type: "GET",
        url: url,
        dataType: "json",
        success: function(json) {
            for(var p in json){
                if(p!="post"){
                    load_csv(json[p],p)
                }else{
                    data_post_url=json[p]
                }
            }
         },
     });
}

load_csv = function(url,extra){
    $.ajax({
        type: "GET",
        url: url,
        extra:extra,
        success: function(csv) {
            process_csv(csv,extra)
         },

     });
}
process_csv = function(_data,extra){
  var data =$.csv.toObjects(_data.replaceAll('\t', ''))

    if(extra=='config'){
        create_header_footer(data)
    }else if(extra=='questions'){
        create_questions(data)
    }
}
create_header_footer = function(data){
    $("#header").html(data[0].intro_text)
    $("#footer").html(data[0].close_text)
}
create_questions = function(data){
    for(var q in data){
        var title= ""
        var text=data[q].question_text
        var image_url=data[q].question_photo
        var alt_text=data[q].alt_text
        var id=data[q].question_num

        html='<br/><br/><div class="col-sm-8">'
        html+='<h2>'+title+'</h2>'
        html+='<h5>'+text+'</h5>'
        html+='<img src="'+image_url+'" alt="'+alt_text+'" width="500"  />'
        html+='<div id="map_'+id+'" class="map"></div>'
        html+=' </div>'

        $("#sections").append(html)

        var map = L.map('map_'+id,{doubleClickZoom: false,}).setView([40.5747842,-105.0864732], 13);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);
        //keep track of map instances
        maps['map_'+id]=map

         map.on('dblclick', function(e) {
         var id = ($(this._container).attr("id"))
         // remove existing marker
         if(maps[id].click_marker){
            maps[id].removeLayer(maps[id].click_marker);
         }
         maps[id].click_marker = new L.marker(e.latlng).addTo(maps[id]);
        });
    }
}

submit_form=function(){
    console.log("We need to check they've answered all the questions")
    // for every answer we'll inject a line into the spreadsheet
    var form_answers=""
    var has_all_markers=true
    for(var m in maps){
        if(!maps[m].click_marker){
            has_all_markers=true

        }else{
            posts.push({"name":$("#full_name").val(),"email":$("#email").val(),"question_num":m.replace('map_',''),"lat":maps[m].click_marker._latlng.lat,"lng":maps[m].click_marker._latlng.lng})

        }
    }
    post_form(posts)
    // reset
    posts=[]
}

post_form=function(posts){

        $.ajax({
            url: data_post_url,
            data:JSON.stringify({"data":posts}),
            crossDomain: true,
            //dataType: 'jsonp',
            type: "POST",
            success: function(d){
               //show your success
                location.reload();
            },
            error: function(x,y,z){
                //show your error message
                console.log("Error",x,y,z)
           }
        });
    }