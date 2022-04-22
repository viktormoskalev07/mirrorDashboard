/* Magic Mirror Config Sample
 *
 * By Michael Teeuw https://michaelteeuw.nl
 * MIT Licensed.
 *
 * For more information on how you can configure this file
 * See https://github.com/MichMich/MagicMirror#configuration
 *
 */

var config = {
	address: "localhost", // Address to listen on, can be:
// - "localhost", "127.0.0.1", "::1" to listen on loopback interface
// - another specific IPv4/6 to listen on a specific interface
// - "0.0.0.0", "::" to listen on any interface
// Default, when address config is left out or empty, is "localhost"
	port: 8080,
	basePath: "/", // The URL path where MagicMirror is hosted. If you are using a Reverse proxy
// you must set the sub path here. basePath must end with a /
	ipWhitelist: ["127.0.0.1", "::ffff:127.0.0.1", "::1"], // Set [] to allow all IP addresses
// or add a specific IPv4 of 192.168.1.5 :
// ["127.0.0.1", "::ffff:127.0.0.1", "::1", "::ffff:192.168.1.5"],
// or IPv4 range of 192.168.3.0 --> 192.168.3.15 use CIDR format :
// ["127.0.0.1", "::ffff:127.0.0.1", "::1", "::ffff:192.168.3.0/28"],

	useHttps: false, // Support HTTPS or not, default "false" will use HTTP
	httpsPrivateKey: "", // HTTPS private key path, only require when useHttps is true
	httpsCertificate: "", // HTTPS Certificate path, only require when useHttps is true

	language: "en",
	locale: "en-US",
	logLevel: ["INFO", "LOG", "WARN", "ERROR"], // Add "DEBUG" for even more logging
	timeFormat: 12,
	units: "metric",
// serverOnly:  true/false/"local" ,
// local for armv6l processors, default
//   starts serveronly and then starts chrome browser
// false, default for all NON-armv6l devices
// true, force serveronly mode, because you want to.. no UI on this device

	modules: [
		{
			module: "alert",
		},
		{
			module: "updatenotification",
			position: "top_bar"
		},
		{
			module: "clock",
			position: "top_bar",
			config: {
				displaySeconds: false
			}
		},
		{
			module:     'MMM-3Day-Forecast',
			position:   'top_right',
			config: {
				api_key:    '72906a9bb77f4d3ca02fa2a238229a76',
				lat:        40.730610,
				lon:        -73.935242,
				units:      'I',
				lang:       'en',
				interval:   900000,
				horizontalView: true
			},

		},
		{
			module: "calendar",
			header: "Upcoming Events",
			position: "top_left",
			config: {
				calendars: [
					{
						symbol: "calendar-check",
						maximumEntries: 5,
						url: "https://calendar.google.com/calendar/ical/klaraweddingcalendar%40gmail.com/private-60053b5822a8fda8429bd371a06cdf57/basic.ics" }
				]
			}
		},
		{
			module: "compliments",
			position: "top_center"
		},
		{
			module: 'MMM-SmartTouch',
			position: 'bottom_center',    // This can be any of the regions.(bottom-center Recommended)
			config:{
				// None configuration options defined
			}
		},
		{
			module: 'MMM-Screencast',
			position: 'bottom_right', // This position is for a hidden <div /> and not the screencast window
			config: {
				position: 'bottom_center',
				height: 300,
				width: 500,
			}
		}

	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {module.exports = config;}
