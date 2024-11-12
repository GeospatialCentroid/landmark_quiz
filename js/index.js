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
var answer_mode=false
var usp
var timer=60
$( function() {
   usp = new URLSearchParams(window.location.search.substring(1))
   if(usp.get('a')!=null){
    answer_mode=true
    console.log("answer_mode")
    $("#footer").hide();
     $("#sub_footer").hide();
   }
   load_config("config.json")

   //check validata on blur
    $('.needs-validation').find('input,select,textarea').on('focusout', function () {
        // check element validity and change class
        $(this).removeClass('is-valid is-invalid')
               .addClass(this.checkValidity() ? 'is-valid' : 'is-invalid');
    });

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
                }else if(p=="responses"){
                    if(answer_mode){
                        load_csv(json[p],p)
                    }
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
    }else if(extra=='responses'){
        //only load the answers if the form what recently submitted
        if(answer_mode){
            setTimeout(show_answers, 1000, data)
            setInterval(timer_countdown, 1000)
        }
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

        html='<br/><br/><div class=" text-center">'
        html+='<h2>'+title+'</h2>'
        html+='<h5>'+text+'</h5>'
        html+='<img class="landmark_img" src="'+image_url+'" alt="'+alt_text+'" width="100%"  />'
        html+='<div id="map_'+id+'" class="map"></div>'
        html+=' </div>'

        $("#sections").append(html)

        var map = L.map('map_'+id,{doubleClickZoom: false,}).setView([data[q].map_center_lat,data[q].map_center_lng], data[q].map_zoom);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);
        //keep track of map instances
        maps['map_'+id]=map
        if(!answer_mode){
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
}
show_answers=function(data){
    $("#alert").show()
    //sort the data by question number
    var grouped_answers={}
    for(a in data){
      if(!Object.hasOwn(grouped_answers,data[a]['question_num'])){
        grouped_answers[data[a]['question_num']]=[]
      }
      grouped_answers[data[a]['question_num']].push(data[a])

    }
    // create heatmaps for all the questions
    // need to associate each question with a map
     for(g in grouped_answers){
        var points=[]
        for(a in grouped_answers[g]){
            points.push([grouped_answers[g][a].lat,grouped_answers[g][a].lng])

        }
        L.heatLayer(points,{maxZoom:18,minOpacity:.5,radius:50}).addTo(maps['map_'+g])
     }
}

timer_countdown=function (){
    timer=timer-1
    $("#timer").html("This page will automatically reload in: "+timer+" <a href='#' onclick='reload_page()'>Reload Now</a>")
    if(timer<=0){
        reload_page()
    }
}
submit_form=function(){
    console.log("We need to check they've answered all the questions")
    if($("input.is-invalid").length){
        console.log("we have an invalid form")
        return
    }
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
               window.location = window.location.search += '?&a=1';
            },
            error: function(x,y,z){
                //show your error message
                console.log("Error",x,y,z)
           }
        });
    }

reload_page = function(){

  window.location = window.location.href.split("?")[0];

}