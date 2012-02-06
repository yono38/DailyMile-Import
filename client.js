var serialize = function(obj, prefix) {
     var str = [];
     for(var p in obj) {
         var k = prefix ? prefix + "[" + p + "]" : p, v = obj[p];
         str.push(typeof v == "object" ? 
             serialize(v, k) :
             encodeURIComponent(k) + "=" + encodeURIComponent(v));
     }
     return str.join("&");
 }


function app(info){
	//var entries = JSON.parse(info);
	console.log(info);
	// take all checked entries, match their ID with info, POST to user (using API!)
	var checked_id = [];
	$('.entry:checked').each(function(k,v){
		checked_id.push(parseInt($(v).attr('id')));
	//	console.log($(v).attr('id'));
	});
	console.log(checked_id);
	$.each(info.entries, function(k,v){
		if ($.inArray(v.id, checked_id) != -1){
			console.log('Adding entry '+v.id);
			var posting_entry = {};
			if (v.message) posting_entry.message = v.message;
			else posting_entry.message = 'Imported using Dailymile Entry Importer from '+v.user.display_name;
			if (v.geo) {
				posting_entry.lat = v.geo.coordinates[1];
				posting_entry.long = v.geo.coordinates[0];
			}
			if (v.workout) posting_entry.workout = v.workout;
			// pretty sure every entry has an 'at' time
			posting_entry.workout['completed_at'] = v.at;
			console.log($.param(posting_entry));
			$.ajax({
				'url': '/add_entry',
				'type': 'POST',
				'data': {data :$.param(posting_entry)}
			});
		}
	});
}
