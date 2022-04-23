const { series } = require("async");
const { exec } = require("child_process");
const log4js = require("log4js");
const logger = log4js.getLogger();
logger.level = "debug";

const fs = require("fs");
const runInstaller = (directory) => {
	logger.info(`Installing dependencies in folder ${directory}`);
	try {
		exec(`cd ${directory} && npm install --unsafe-perm`, (err, stdout, stderr) => {
			if (err) {
				logger.error(err);
				return;
			}
			logger.warn(directory + " log");
			console.log(stdout);
		});
	} catch (e) {
		logger.error(e);
	}
};

runInstaller("vendor");
runInstaller("fonts");

const dir = "modules";
const files = fs.readdirSync(dir);

for (const file of files) {
	if (file !== "default") {
		runInstaller("modules/" + file);
	}
}
