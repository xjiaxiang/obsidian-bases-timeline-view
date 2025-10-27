import { readFileSync, writeFileSync } from 'node:fs';

function run() {
	// update the year info in the LICENSE file
	const license = readFileSync('LICENSE', 'utf8');
	const year = new Date().getFullYear();
	const updatedLicense = license.replace(
		/Copyright \(c\) \d{4}/,
		`Copyright (c) ${year}`,
	);
	writeFileSync('LICENSE', updatedLicense);
}

run();
