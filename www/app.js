// npm i -g http-server
// cd www && http-server

var app = (function()
{
	// Application object.
	var app = {};

	// Dictionary of beacons.
	var beacons = {};

	var hitpoints = 100;
	var maxhitpoints = 100;
	var minhitpoints = 0;
	var suitpoints = 100;
	var maxsuitpoints = 100;
	var minsuitpoints = 0;
	var radpoints = 0;
	var maxradpoints = 100;
	var minradpoints = 0;
	var psipoints = 0;
	var maxpsipoints = 100;
	var minpsipoints = 0;
	var rad_coeff = 0;

	function displayStats()
	{
		document.getElementById("radBeacons").innerHTML = "Rad "+radpoints; 
		document.getElementById("psiBeacons").innerHTML = "Psi "+psipoints; 
		document.getElementById("hitBeacons").innerHTML = "Hit "+hitpoints; 
		document.getElementById("suitBeacons").innerHTML = "Suit "+suitpoints;
	}


//function log(options) {
//        var logger = $('#logger');
//        if (!logger.length) {
//            $('body').append($('<div id="logger"></div>'));
//            logger = $('#logger');
//        }
//        Object.keys(options).forEach(function(opt) {
//            var log = $('.log').attr('data-id', opt);
//            console.log(log);
//            var html = $('<div class="log" data-id="'+opt+'">'+opt+': '+ (options[opt])+'</div>');
//            if (!log.length) {
//                logger.append(html);
//            }
//            else {
//                log.last().after(html);
//            }
//        });
//    }

	function checkStats()
	{
		if (hitpoints > maxhitpoints)
		{
			hitpoints = maxhitpoints;
		}

		if (hitpoints < minhitpoints)
		{
			hitpoints = minhitpoints;
		}

		if (psipoints > maxpsipoints)
		{
			psipoints = maxpsipoints;
		}

		if (psipoints < minpsipoints)
		{
			psipoints = minpsipoints;
		}

		if (radpoints > maxradpoints)
		{
			radpoints = maxradpoints;
		}

		if (radpoints < minradpoints)
		{
			radpoints = minradpoints;
		}

		if (suitpoints > maxsuitpoints)
		{
			suitpoints = maxsuitpoints;
		}

		if (suitpoints < minsuitpoints)
		{
			suitpoints = minsuitpoints;
		}
		displayStats()
	}

	function radCoeff()
    {
       
        if (radpoints >= 0 && radpoints <= 9)
        {
            log({rads: '0-9'});
            rad_coeff = 0;
        }
        else if (radpoints >= 10 && radpoints <= 19)
        {
           log({rads: '10-19'});
            rad_coeff = 0.01;
        }
        else if (radpoints >= 20 && radpoints <= 29)
        {
           log({rads: '20-29'});
            rad_coeff = 0.02;
        }
        else if (radpoints >= 30 && radpoints <= 39)
        {
           log({rads: '30-39'});
            rad_coeff = 0.04;
        }
        else if (radpoints >= 40 && radpoints <= 49)
        {
            rad_coeff = 0.04;
        }
        else if (radpoints >= 50 && radpoints <= 59)
        {
            rad_coeff = 0.05;
        }
        else if (radpoints >= 60 && radpoints <= 69)
        {
            rad_coeff = 0.0625;
        }
        else if (radpoints >= 70 && radpoints <= 79)
        {
            rad_coeff = 0.0714;
        }
        else if (radpoints >= 80 && radpoints <= 89)
        {
            rad_coeff = 0.0833;
        }
        else if (radpoints >= 90 && radpoints <= 100)
        {
            rad_coeff = 0.1;
        }
        return rad_coeff;
    }

	function doRadDamage()
	{
		log({radCoeff: radCoeff(), hitpoints: hitpoints});
		hitpoints = +((hitpoints - radCoeff()).toFixed(4));

	}

	// Timer that displays list of beacons.
	//var updateTimer = null;
	app.initialize = function()
	{
		document.addEventListener(
			'deviceready',
			function() { evothings.scriptsLoaded(onDeviceReady) },
			false);
			bottomButtonListener();
			displayStats();
	};

	function onDeviceReady()
	{
		// Start tracking beacons!
		setTimeout(startScan, 1000);
		console.log(navigator.notification);
		console.log(navigator.vibrate);
		console.log(Media);
		console.log(device.cordova);
		// Display refresh timer.
	//	updateTimer = setInterval(displayBeaconList, 1000);
		xyz = setInterval(update, 1000);
	}

	function update()
	{
displayBeaconList();
doRadDamage();
checkStats();
	}

	function playAudio(src) {
		// HTML5 Audio
		if (typeof Audio != "undefined") { 
			new Audio(src).play() ;
	
		// Phonegap media
		} else if (typeof device != "undefined") {
	
			// Android needs the search path explicitly specified
			if (device.platform == 'Android') {
				src = '/android_asset/www/' + src;
			}
	
			var mediaRes = new Media(src,
				function onSuccess() {
				   // release the media resource once finished playing
				   mediaRes.release();
				},
				function onError(e){
					console.log("error playing sound: " + JSON.stringify(e));
				});
			 mediaRes.play();
	   } else {
		   console.log("no sound API to play: " + src);
	   }
	}
	
	function startScan()
	{
		// Called continuously when ranging beacons.
		evothings.eddystone.startScan(
			function(beacon)
			{
				// Insert/update beacon table entry.
				beacon.timeStamp = Date.now();
				beacons[beacon.address] = beacon;
			},
			function(error)
			{
				console.log('Eddystone Scan error: ' + JSON.stringify(error));
			});
	}

	/**
	 * Map the RSSI value to a value between 1 and 100.
	 */
	function mapBeaconRSSI(rssi)
	{
		if (rssi >= 0) return 1; // Unknown RSSI maps to 1.
		if (rssi < -100) return 0; // Max RSSI
		return 100 + rssi;
	}

	function getSortedBeaconList(beacons)
	{
		var beaconList = [];
		for (var key in beacons)
		{
			beaconList.push(beacons[key]);
		}
		beaconList.sort(function(beacon1, beacon2)
		{
			return mapBeaconRSSI(beacon1.rssi) < mapBeaconRSSI(beacon2.rssi);
		});
		return beaconList;
	}

	

	function displayBeaconList()
	{
		// Clear beacon display list.
		$('#found-beacons').empty();

		// Update beacon display list.
		var timeNow = Date.now();
		$.each(getSortedBeaconList(beacons), function(index, beacon)
		{
			// Only show beacons that are updated during the last 10 seconds.
			if (beacon.timeStamp + 10000 > timeNow)
			{
				// Create HTML to display beacon data.
				var element = $(
					'<li>'
					+	htmlBeaconName(beacon)
					+	htmlBeaconRSSIBar(beacon)
					+   htmlBeaconAccuracy(beacon)
					+	htmlBeaconRSSI(beacon)
					+ '</li>'
				);


				$('#message').remove();
				$('#found-beacons').append(element);
			
				if (beacon.name == "RADIATION" && beacon.rssi > -74)
			{
				radpoints++;
				navigator.vibrate(150);
				playAudio("audio/geiger_7.mp3");
			}
			if (beacon.name == "ARTIFACT" && beacon.rssi > -90)
			{
				psipoints++;
				playAudio("audio/contact_1.mp3");
				navigator.vibrate(150);
			}
			}
		});
	}
function bottomButtonListener()
{
	document.getElementById("hitHeal").addEventListener("click", function() {
		heal(0);
	});
	document.getElementById("radHeal").addEventListener("click", function() {
		heal(1);
	});
	document.getElementById("psiHeal").addEventListener("click", function() {
		heal(2);
	});
}
	

	function heal(n)
	{
		if (n == 0)
		{
			hitpoints = maxhitpoints;
		}
		else if (n == 1)
		{
			radpoints = minradpoints;
		}
		else if (n == 2)
		{
			psipoints = minpsipoints;
		}
		displayStats()
	}

	function htmlBeaconAccuracy(beacon)
		{var distance = evothings.eddystone.calculateAccuracy(
			beacon.txPower, beacon.rssi);
			return distance ?
				'Distance: ' + distance + '<br/>' :  '';
		}

	function htmlBeaconName(beacon)
	{
		return beacon.name ?
			'<strong>' + beacon.name + '</strong><br/>' :  '';
	}

	function htmlBeaconURL(beacon)
	{
		return beacon.url ?
			'URL: ' + beacon.url + '<br/>' :  '';
	}

	function htmlBeaconNID(beacon)
	{
		return beacon.nid ?
			'NID: ' + uint8ArrayToString(beacon.nid) + '<br/>' :  '';
	}

	function htmlBeaconBID(beacon)
	{
		return beacon.bid ?
			'BID: ' + uint8ArrayToString(beacon.bid) + '<br/>' :  '';
	}

	function htmlBeaconVoltage(beacon)
	{
		return beacon.voltage ?
			'Voltage: ' + beacon.voltage + '<br/>' :  '';
	}

	function htmlBeaconTemperature(beacon)
	{
		return beacon.temperature && beacon.temperature != 0x8000 ?
			'Temperature: ' + beacon.temperature + '<br/>' :  '';
	}
	function htmlBeaconTxPower(beacon)
	{
		return beacon.txPower ?
			'TxPower: ' + beacon.txPower + '<br/>' :  '';
	}

	function htmlBeaconAdvCnt(beacon)
	{
		return beacon.adv_cnt ?
			'ADV_CNT: ' + beacon.adv_cnt + '<br/>' :  '';
	}

	function htmlBeaconDsecCnt(beacon)
	{
		return beacon.dsec_cnt ?
			'DSEC_CNT: ' + beacon.dsec_cnt + '<br/>' :  '';
	}

	function htmlBeaconRSSI(beacon)
	{
		return beacon.rssi ?
			'RSSI: ' + beacon.rssi + '<br/>' :  '';
	}

	function htmlBeaconRSSIBar(beacon)
	{
		return beacon.rssi ?
			'<div style="background:rgb(112,130,56);height:20px;width:'
				+ mapBeaconRSSI(beacon.rssi) + '%;"></div>' : '';
	}

	function uint8ArrayToString(uint8Array)
	{
		function format(x)
		{
			var hex = x.toString(16);
			return hex.length < 2 ? '0' + hex : hex;
		}

		var result = '';
		for (var i = 0; i < uint8Array.length; ++i)
		{
			result += format(uint8Array[i]) + ' ';
		}
		return result;
	}

	return app;
})();

app.initialize();