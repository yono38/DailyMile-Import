function app(info){
	console.log(info);
	// take all checked entries, match their ID with info, POST to user (using API!)
	// This is NOT an efficient algorithm, but it works
	var checked_id = [];
	$('.entry:checked').each(function(k,v){
		checked_id.push(parseInt($(v).attr('id')));
	});
	$.each(info.entries, function(k,v){
		if ($.inArray(v.id, checked_id) != -1){
			console.log('Adding entry '+v.id);
			var posting_entry = {};
			if (v.message) posting_entry.message = v.message;
			// Dailymile doesn't let you post entries without a message
			else posting_entry.message = 'Imported using Dailymile Entry Importer from '+v.user.display_name;
			if (v.geo) {
				posting_entry.lat = v.geo.coordinates[1];
				posting_entry.long = v.geo.coordinates[0];
			}
			if (v.workout) posting_entry.workout = v.workout;
			// pretty sure every entry has an 'at' time
			if (v.at) posting_entry.workout['completed_at'] = v.at;
			console.log($.param(posting_entry));
			// $.param is great! Screw nodejs's querystring lib, can't handle multidimensional objects
			$.ajax({
				'url': '/add_entry',
				'type': 'POST',
				'data': {data :$.param(posting_entry)}
			});
		}
	});
}
