# Module: Weather Underground Forecast
This is a module for MagicMirror, modified version of the default `weatherforecast` module.

This is similar to the default `weatherforecast` module, however it has additional functionality (such as displaying the probability of precipitation for each day). It also retrieves its data from Weather Underground instead of OpenWeatherMap.

The Weather Icons used in this module are created and maintained by Erik Flowers. v1.0 artwork by Lukas Bischoff. v1.1 - 2.0 artwork by Erik Flowers www.weathericons.io


## Installing the module
Clone this repository in your `~/MagicMirror/modules/` folder `( $ cd ~MagicMirror/modules/ )`:
````javascript
git clone https://github.com/RedNax67/MMM-WunderGround.git
````

## Using the module

To use this module, add it to the modules array in the `config/config.js` file:
````javascript
modules: [
{
    module: 'MMM-WunderGround',
    position: 'top_right',
    config: {
        apikey: 'xxxxxxxxxxxxx', // private; don't share!
        pws: 'pws:IGELDERL219', //culemborg
        hourly: '1',
        fctext: '1',
        fcdaycount: "5",
        fcdaystart: "0",
        hourlyinterval: "3",
        hourlycount: "2",
        alerttime: 10000,
        alerttruncatestring: "english:",
	roundTmpDecs: 1,
	UseCardinals: 0,
	layout: "horizontal",
	sysstat: 0
    }
};
]
````

## Configuration options

The following properties can be configured:


<table width="100%">
	<thead>
		<tr>
			<th>Option</th>
			<th width="100%">Description</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td><code>pws</code></td>
			<td>Can be any WU api location info.<br><br><b>US Example:</b> <code>NY/New_York</code><br><b>Example:</b> <code>locid:NLXX8014;loctype:1</code><br><br> This value is <b>REQUIRED</b>
			</td>
		</tr>
		<tr>
			<td><code>apikey</code></td>
			<td>The <a href="https://www.wunderground.com/weather/api/d/pricing">Weather Underground</a> API key, which can be obtained by creating an OpenWeatherMap account. You need either Cumulus or Anvil plan for this module. As long as you make less than 500 queries a day, this is free.<br>
				<br> This value is <b>REQUIRED</b>
			</td>
		</tr>
		<tr>
			<td><code>units</code></td>
			<td>What units to use. Specified by config.js<br>
				<br><b>Possible values:</b> <code>config.units</code> = Specified by config.js, <code>default</code> = Kelvin, <code>metric</code> = Celsius, <code>imperial</code> =Fahrenheit
				<br><b>Default value:</b> <code>config.units</code>
			</td>
		</tr>
		<tr>
			<td><code>coloricon</code></td>
			<td>show Current Weather Icon in color<br>
				<br><b>Possible values:</b> <code>true</code>, <code>false</code>
				<br><b>Default value:</b> <code>false</code>
			</td>
		</tr>
		<tr>
			<td><code>fcdaycount</code></td>
			<td>How many days of forecast to return. Specified by config.js<br>
				<br><b>Possible values:</b> <code>1</code> - <code>10</code>
				<br><b>Default value:</b> <code>7</code> (7 days)
				<br>This value is optional. By default the wunderground module will return 7 days.
			</td>
		</tr>
		<tr>
			<td><code>fcdaystart</code></td>
			<td>On which day to start the forecast. Specified by config.js<br>
				<br><b>Possible values:</b> <code>1</code> - <code>10</code>
				<br><b>Default value:</b> <code>0</code> (Today)
				<br>This value is optional. By default the forecast will start today.
			</td>
		</tr>
		<tr>
			<td><code>fctext</code></td>
			<td>Display human readable forecast text. Specified by config.js<br>
				<br><b>Possible values:</b> <code>0</code> - <code>1</code>
				<br><b>Default value:</b> <code>1</code> (Will display text)
				<br>This value is optional. By default the forecast text will be displayed.
			</td>
		</tr>
		<tr>
			<td><code>scaletxt</code></td>
			<td>Scale forecast text when over 3 lines. Specified by config.js<br>
				<br><b>Possible values:</b> <code>0</code> - <code>1</code>
				<br><b>Default value:</b> <code>1</code> (Will scale text)
				<br>This value is optional. By default the forecast text will be scaled when needed.
			</td>
		</tr>
        <tr>
			<td><code>daily</code></td>
			<td>Display daily forecasts. Specified by config.js<br>
				<br><b>Possible values:</b> <code>0</code> - <code>1</code>
				<br><b>Default value:</b> <code>1</code> (Will display daily forecasts)
				<br>This value is optional. By default the daily forecast will be displayed.
			</td>
		</tr>
        <tr>
			<td><code>hourly</code></td>
			<td>Display hourly forecasts. Specified by config.js<br>
				<br><b>Possible values:</b> <code>0</code> - <code>1</code>
				<br><b>Default value:</b> <code>1</code> (Will display hourly forecasts)
				<br>This value is optional. By default the hourly forecast will be displayed.
			</td>
		</tr>
		<tr>
			<td><code>hourlycount</code></td>
			<td>How many hourly forecasts. Specified by config.js<br>
				<br><b>Possible values:</b> <code>0</code> - <code>24</code>
				<br><b>Default value:</b> <code>3</code> (Will display 4 hourly forecasts)
				<br>This value is optional. By default the 4 hourly forecasts will be displayed.
			</td>
		</tr>
		<tr>
			<td><code>hourlyinterval</code></td>
			<td>Hours between hourly forecasts. Specified by config.js<br>
				<br><b>Possible values:</b> <code>1</code> - <code>24</code>
				<br><b>Default value:</b> <code>3</code> (Will display hourly forecasts with 3 hour interval)
				<br>This value is optional.
			</td>
		</tr>
		<tr>
			<td><code>updateInterval</code></td>
			<td>How often does the content needs to be fetched? (Milliseconds)
				<br>Note that Wunderground updates every 15 minutes maximum. Also free version of API only allows 500 calls per day.
				<br><b>Possible values:</b> <code>1000</code> - <code>86400000</code>
				<br><b>Default value:</b> <code>900000</code> (15 minutes)
			</td>
		</tr>
		<tr>
			<td><code>animationSpeed</code></td>
			<td>Speed of the update animation. (Milliseconds)<br>
				<br><b>Possible values:</b><code>0</code> - <code>5000</code>
				<br><b>Default value:</b> <code>2000</code> (2 seconds)
			</td>
		</tr>
		<tr>
			<td><code>lang</code></td>
			<td>The language of the days.<br>
				<br><b>Possible values:</b> <code>en</code>, <code>nl</code>, <code>ru</code>, etc ...
				<br><b>Default value:</b> uses value of <i>config.language</i>
			</td>
		</tr>
		<tr>
			<td><code>fade</code></td>
			<td>Fade the future events to black. (Gradient)<br>
				<br><b>Possible values:</b> <code>true</code> or <code>false</code>
				<br><b>Default value:</b> <code>true</code>
			</td>
		</tr>
		<tr>
			<td><code>fadePoint</code></td>
			<td>Where to start fade?<br>
				<br><b>Possible values:</b> <code>0</code> (top of the list) - <code>1</code> (bottom of list)
				<br><b>Default value:</b> <code>0.25</code>
			</td>
		</tr>
		<tr>
			<td><code>initialLoadDelay</code></td>
			<td>The initial delay before loading. If you have multiple modules that use the same API key, you might want to delay one of the requests. (Milliseconds)<br>
				<br><b>Possible values:</b> <code>1000</code> - <code>5000</code>
				<br><b>Default value:</b>  <code>0</code>
			</td>
		</tr>
		<tr>
			<td><code>retryDelay</code></td>
			<td>The delay before retrying after a request failure. (Milliseconds)<br>
				<br><b>Possible values:</b> <code>1000</code> - <code>60000</code>
				<br><b>Default value:</b>  <code>2500</code>
			</td>
		</tr>
		<tr>
			<td><code>alerttime</code></td>
			<td>The amount of time the alert is duisplayed. (Milliseconds)<br>
				<br><b>Possible values:</b> <code>1000</code> - <code>60000</code>
				<br><b>Default value:</b>  <code>10000</code>
			</td>
		</tr>
		<tr>
			<td><code>alerttruncatestring</code></td>
			<td>Truncates the aletr text at the defined word (Milliseconds)<br>
				<br><b>Possible values:</b> <code>any string</code>
				<br><b>Default value:</b>  <code></code>
			</td>
		</tr>
		<tr>
			<td><code>roundTmpDecs</code></td>
			<td>Rounds off the current temperature display<br>
				<br><b>Possible values:</b> <code>number</code>
				<br><b>Default value:</b>  <code>1</code>
			</td>
		</tr>
		<tr>
			<td><code>windunits</code></td>
			<td>Which units to use for windspeed<br>
				<br><b>Possible values:</b> <code>"mph" or "bft"</code>
				<br><b>Default value:</b>  <code>"bft"</code>
			</td>
		</tr>
		<tr>
			<td><code>UseCardinals</code></td>
			<td>Toggles the use of winddirection arrow or cardinals<br>
				<br><b>Possible values:</b> <code>0 or 1</code>
				<br><b>Default value:</b>  <code>0</code>
			</td>
		</tr>
		<tr>
			<td><code>layout</code></td>
			<td>Chooses the layout option<br>
				<br><b>Possible values:</b> <code>"horizontal" or "vertical"</code>
				<br><b>Default value:</b>  <code>"vertical"</code>
			</td>
		</tr>
		<tr>
			<td><code>iconset</code></td>
			<td>Selects the style of icons to show<br>
				<br><b>Possible values:</b> <code>"colourful", "dark", "flat_black", "flat_colourful", "flat_white", "light", "novacon", "sketchy", "VCloudsWeatherIcons", "weezle"</code>
				<br><b>Default value:</b> <code>"VCloudsWeatherIcons"</code>
			</td>
		</tr>
		<tr>
			<td><code>sysstat</code></td>
			<td>Toggle sysinfo display<br>
				<br><b>Possible values:</b> <code>0 or 1</code>
				<br><b>Default value:</b>  <code>0</code>
			</td>
		</tr>
		<tr>
			<td><code>debug</code></td>
			<td>Toggle debug logging<br>
				<br><b>Possible values:</b> <code>0 or 1</code>
				<br><b>Default value:</b>  <code>0</code>
			</td>
		</tr>
	</tbody>
</table>
