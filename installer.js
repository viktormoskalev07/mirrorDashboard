// const { series } = require("async");
const { exec } = require("child_process");
const fs = require("fs");
const runInstaller = (folder) => {
	exec(`cd ${folder} && npm i`, (error, stdout, stderr) => {
		if (error) {
			console.error(`error: ${error.message}`);
			return;
		}

		if (stderr) {
			console.error(`stderr: ${stderr}`);
			return;
		}

		console.log(`stdout:\n${stdout}`);
	});
};
runInstaller("vendor");
runInstaller("fonts");

const dir = "modules";
const files = fs.readdirSync(dir);

for (const file of files) {
	runInstaller("modules/" + file);
}
