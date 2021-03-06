/* Magic Mirror
 * MMM-SmartTouch.js
 *
 * By SmartBuilds.io - Pratik and Eben
 * https://smartbuilds.io
 * MIT Licensed.
 */

Module.register("MMM-SmartTouch", {
	defaults: {
	},

	start: function () {
		Log.info(this.name + " has started...");
		this.sendSocketNotification("CONFIG", this.config);
	},

	getStyles: function () {
		return [this.file("css/mmm-smarttouch.css"), "font-awesome.css"];
	},

	// Load translations files
	getTranslations: function () {
		return {
			en: "translations/en.json",
			nb: "translations/nb.json",
		};
	},

	createContainerDiv: function () {
		const containerDiv = document.createElement("div");
		containerDiv.className = "st-container";

		return containerDiv;
	},

	toggleStandby: function () {
		const existingBodyClass = document.body.className;
		if (existingBodyClass === "st-standby show") {
			document.body.className = "st-standby fade";
		} else {
			document.body.className = "st-standby show";
		}
	},

	createStandByButtonDiv: function () {
		const standByButtonDiv = document.createElement("div");
		standByButtonDiv.className = "st-container__standby-button";

		standByButtonDiv.appendChild(document.createElement("span"))
		standByButtonDiv.addEventListener("click", () => this.toggleStandby());

		return standByButtonDiv;
	},


	toggleSideMenu: function () {
		const menuToggleDiv = document.getElementById("st-menu-toggle")
		menuToggleDiv.classList.toggle('show');

		const mainMenuDiv = document.getElementById("st-main-menu")
		mainMenuDiv.classList.toggle('show')
	},

	createMenuToggleButtonDiv: function () {
		const menuToggleButtonDiv = document.createElement("div");
		menuToggleButtonDiv.className = "st-container__menu-toggle";
		menuToggleButtonDiv.id = "st-menu-toggle";

		const hamburgerLineOne = document.createElement("div");
		hamburgerLineOne.className = "st-container__menu-toggle st-toggle__bar_one";

		const hamburgerLineTwo = document.createElement("div");
		hamburgerLineTwo.className = "st-toggle__bar_two";

		const hamburgerLineThree = document.createElement("div");
		hamburgerLineThree.className = "st-toggle__bar_three";

		menuToggleButtonDiv.appendChild(hamburgerLineOne);
		menuToggleButtonDiv.appendChild(hamburgerLineTwo);
		menuToggleButtonDiv.appendChild(hamburgerLineThree);

		menuToggleButtonDiv.addEventListener("click", () => this.toggleSideMenu());

		return menuToggleButtonDiv;
	},

	createShutdownButton: function () {
		const shutdownButtonItem = document.createElement("li");
		shutdownButtonItem.innerHTML = "<a href=\"/homebeauty\"> \n" +
			"  <img src=\"modules/MMM-SmartTouch/img/6.png\" alt=\"logo\">\n" +
			"  <span>Beauty</span>\n" +
			"</a>";

		shutdownButtonItem.className = "li-t";

		return shutdownButtonItem;
	},

	createRestartButton: function () {
		const restartButtonItem = document.createElement("li");
		restartButtonItem.innerHTML = "<a href=\"/gallery\">\n" +
			"  <img src=\"modules/MMM-SmartTouch/img/image.png\" alt=\"logo\">\n" +
			"  <span>Gallery</span>\n" +
			"</a>";
		restartButtonItem.className = "li-t";

		return restartButtonItem;
	},

	createMainMenuDiv: function () {
		const mainMenuDiv = document.createElement("div");
		mainMenuDiv.className = "st-container__main-menu";
		mainMenuDiv.id = "st-main-menu";

		const shutdownButton = this.createShutdownButton();
		const restartButton = this.createRestartButton();

		const buttonList = document.createElement("ul");
		buttonList.appendChild(shutdownButton);
		buttonList.appendChild(restartButton);

		mainMenuDiv.appendChild(buttonList);

		return mainMenuDiv;
	},

	getDom: function () {
		// Initial standby state
		document.body.className = "st-standby show";

		const container = this.createContainerDiv();

		const standByButton = this.createStandByButtonDiv();
		container.appendChild(standByButton);


		const menuToggleButton = this.createMenuToggleButtonDiv();
		container.appendChild(menuToggleButton);

		const mainMenu = this.createMainMenuDiv();
		document.body.appendChild(mainMenu);

		return container;
	},

	notificationReceived: function (notification, payload, sender) {
	},

	// Recieve notification from sockets via nodehelper.js
	socketNotificationReceived: function (notification, payload) {
	},

});
