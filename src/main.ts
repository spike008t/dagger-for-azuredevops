import * as tl from "azure-pipelines-task-lib/task";
import * as tr from "azure-pipelines-task-lib/toolrunner";
import * as http from "typed-rest-client/HttpClient";
import * as os from "os";

const s3URL: string = "https://dl.dagger.io/dagger";
const osPlat: string = os.platform();
const osArch: string = os.arch();

class Dagger {
  version: string;
  installOnly = false;

  constructor() {
    this.version = tl.getInput("version") ?? "latest";
    this.installOnly = tl.getBoolInput("installOnly");
  }

  async run() {
    if (this.installOnly === true) {
      return;
    }
  }

  async getVersion(version: string) {
    const _http = new http.HttpClient("dagger-for-azuredevops");
    const res = await _http.get(`${s3URL}/versions/${version}`);
    if (res.message.statusCode != 200) {
      version = await res.readBody().then((body) => body.trim());
    }

    return version.replace(/^v/, '');
  }
}

const dagger = new Dagger();

dagger.run();
