import * as os from "os";
import * as path from "path";
import * as util from "util";
import * as toolLib from "azure-pipelines-tool-lib/tool";
import * as http from "typed-rest-client/HttpClient";

const s3URL: string = "https://dl.dagger.io/dagger";
const osPlat: string = os.platform();
const osArch: string = os.arch();

export async function install(version: string): Promise<string> {
  version = await getVersionMapping(version);
  version = version.replace(/^v/, "");

  const downloadUrl: string = util.format(
    "%s/releases/%s/%s",
    s3URL,
    version,
    getFilename(version)
  );
  console.info(`Downloading ${downloadUrl}`);
  const downloadPath: string = await toolLib.downloadTool(downloadUrl);
  console.debug(`Downloaded to ${downloadPath}`);

  console.info("Extracting Dagger");
  let extPath: string;
  if (osPlat == "win32") {
    extPath = await toolLib.extractZip(downloadPath);
  } else {
    extPath = await toolLib.extractTar(downloadPath);
  }
  console.debug(`Extracted to ${extPath}`);

  const cachePath: string = await toolLib.cacheDir(extPath, "dagger", version);
  console.debug(`Cached to ${cachePath}`);

  const exePath: string = path.join(
    cachePath,
    osPlat == "win32" ? "dagger.exe" : "dagger"
  );
  console.debug(`Exe path is ${exePath}`);

  return path.join(cachePath, osPlat == "win32" ? "dagger.exe" : "dagger");
}

async function getVersionMapping(version: string): Promise<string> {
  const _http = new http.HttpClient("dagger-for-azuredevops");
  const res = await _http.get(`${s3URL}/versions/${version}`);
  if (res.message.statusCode != 200) {
    return version;
  }

  return await res.readBody().then((body) => body.trim());
}

const getFilename = (version: string): string => {
  const platform: string = osPlat == "win32" ? "windows" : osPlat;
  const arch: string = osArch == "x64" ? "amd64" : osArch;
  const ext: string = osPlat == "win32" ? ".zip" : ".tar.gz";
  return util.format("dagger_v%s_%s_%s%s", version, platform, arch, ext);
};