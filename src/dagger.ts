import * as os from 'os';
import * as path from 'path';
import * as toolLib from 'azure-pipelines-tool-lib/tool';
import { HttpClient } from 'typed-rest-client/HttpClient';

export class Dagger {

	private readonly S3_URL = 'https://dl.dagger.io/dagger';
	private readonly osPlatform = os.platform();
	private readonly osArch = os.arch();

	async install(version: string) {
		const versionSanitize = await this.getVersionString(version);
		const downloadUrl = this.getDownloadUrl(versionSanitize);

		console.info(`Downloading ${downloadUrl}`);
		const downloadPath: string = await toolLib.downloadTool(downloadUrl);
		console.debug(`Downloaded to ${downloadPath}`);

		console.info("Extracting Dagger");
		let extPath: string;
		if (this.osPlatform === 'win32') {
			extPath = await toolLib.extractZip(downloadPath);
		} else {
			extPath = await toolLib.extractTar(downloadPath);
		}
		console.debug(`Extracted to ${extPath}`);

		const cachePath: string = await toolLib.cacheDir(extPath, "dagger", version);
		console.debug(`Cached to ${cachePath}`);

		const exePath: string = path.join(
			cachePath,
			this.osPlatform == "win32" ? "dagger.exe" : "dagger"
		);
		console.debug(`Exe path is ${exePath}`);

		return path.join(cachePath, this.osPlatform == "win32" ? "dagger.exe" : "dagger");
	}

	async getVersionString(version: string): Promise<string> {
		const http = new HttpClient('dagger-for-azuredevops');
		const res = await http.get(`${this.S3_URL}/versions/${version}`);
		if (res.message.statusCode === 200) {
			version = await res.readBody().then((body) => body.trim());
		}

		return version.replace(/^v/, '');
	}

	getVersionFilename(version: string) {
		const plat = this.osPlatform === 'win32' ? 'windows' : this.osPlatform;
		const arch = this.osArch == "x64" ? "amd64" : this.osArch;
		const ext: string = this.osPlatform == "win32" ? "zip" : "tar.gz";
		return `dagger_v${version}_${plat}_${arch}.${ext}`;
	}

	getDownloadUrl(version: string) {
		return `${this.S3_URL}/releases/${version}`;
	}

}
